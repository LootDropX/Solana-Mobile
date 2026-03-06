import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import * as Haptics from 'expo-haptics';
import { useWalletStore } from '../stores/wallet.store';
import { useLocationStore } from '../stores/location.store';
import { useMapStore } from '../stores/map.store';
import { haversineDistance } from '../utils/distance';
import { CLAIM_RADIUS } from '../constants/rarity';
import {
  buildClaimDropInstruction,
  resolveClaimDropAccounts,
} from '../program/instructions/claimDrop';
import { createClaimRecord } from '../services/drops.service';
import {
  SOLANA_RPC_URL,
  MWA_APP_IDENTITY,
  TX_CONFIRM_TIMEOUT_MS,
  CONFIRM_COMMITMENT,
} from '../constants/solana';
import type { NearbyDrop, ClaimResult, ClaimError } from '../types/drop.types';

export type ClaimState =
  | 'idle'
  | 'validating'
  | 'building_tx'
  | 'awaiting_signature'
  | 'confirming'
  | 'success'
  | 'error';

export interface UseClaimDropReturn {
  claim: (drop: NearbyDrop) => Promise<ClaimResult>;
  claimState: ClaimState;
  error: ClaimError | null;
  lastTxSignature: string | null;
}

/**
 * Orchestrates the full drop claim sequence:
 * 1. Pre-flight validation (GPS + on-chain state)
 * 2. Build Anchor instruction
 * 3. Sign via MWA
 * 4. Submit & confirm on-chain
 * 5. Write claim record to Supabase
 * 6. Trigger haptic + celebration UI
 *
 * @returns Claim function, current state, error, and last tx signature
 */
export function useClaimDrop(): UseClaimDropReturn {
  const [claimState, setClaimState] = useState<ClaimState>('idle');
  const [error, setError] = useState<ClaimError | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  const { publicKey, authToken } = useWalletStore();
  const rawCoords = useLocationStore((s) => s.coords);
  const devMode = useMapStore((s) => s.devModeEnabled);
  const devCoords = useMapStore((s) => s.devModeCoords);
  const queryClient = useQueryClient();

  const coords = devMode && devCoords ? devCoords : rawCoords;

  const claim = useCallback(
    async (drop: NearbyDrop): Promise<ClaimResult> => {
      setError(null);
      setClaimState('validating');

      // ── Step 1: Pre-flight ──────────────────────────────────────────────
      if (!publicKey || !authToken) {
        const err: ClaimError = { code: 'WALLET_NOT_CONNECTED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (!coords) {
        const err: ClaimError = { code: 'OUT_OF_RANGE', distanceMeters: Infinity, requiredMeters: CLAIM_RADIUS[drop.rarityTier] };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      const distanceMeters = haversineDistance(
        coords.latitude,
        coords.longitude,
        drop.latitude,
        drop.longitude,
      );
      const claimRadius = CLAIM_RADIUS[drop.rarityTier];

      if (distanceMeters > claimRadius) {
        const err: ClaimError = { code: 'OUT_OF_RANGE', distanceMeters, requiredMeters: claimRadius };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (!drop.isActive) {
        const err: ClaimError = { code: 'DROP_INACTIVE' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (new Date(drop.expiresAt) < new Date()) {
        const err: ClaimError = { code: 'DROP_EXPIRED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (drop.currentClaims >= drop.maxClaims) {
        const err: ClaimError = { code: 'DROP_FULL' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      if (drop.alreadyClaimed) {
        const err: ClaimError = { code: 'ALREADY_CLAIMED' };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      // ── Step 2: Build instruction ───────────────────────────────────────
      setClaimState('building_tx');

      const connection = new Connection(SOLANA_RPC_URL, CONFIRM_COMMITMENT);
      const claimer = new PublicKey(publicKey);
      const dropPDA = new PublicKey(drop.onChainAddress);
      const distanceCm = Math.round(distanceMeters * 100);

      const accounts = await resolveClaimDropAccounts(dropPDA, claimer);
      const instruction = buildClaimDropInstruction(accounts, distanceCm);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const message = new TransactionMessage({
        payerKey: claimer,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      const txBytes = transaction.serialize();

      // ── Step 3: MWA sign ────────────────────────────────────────────────
      setClaimState('awaiting_signature');

      let signedTxBytes: Uint8Array;
      try {
        const result = await transact(async (wallet) => {
          await wallet.authorize({ identity: MWA_APP_IDENTITY, chain: 'solana:devnet' });
          const signed = await wallet.signTransactions({
            transactions: [transaction],
          });
          return signed[0];
        });
        signedTxBytes = result as unknown as Uint8Array;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        const err: ClaimError = msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('cancel')
          ? { code: 'USER_REJECTED' }
          : { code: 'UNKNOWN', message: msg };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      // ── Step 4: Submit & confirm ────────────────────────────────────────
      setClaimState('confirming');

      let txSignature: string;
      try {
        txSignature = await connection.sendRawTransaction(signedTxBytes, {
          skipPreflight: false,
          maxRetries: 3,
        });

        const confirmResult = await Promise.race([
          connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, CONFIRM_COMMITMENT),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TX_TIMEOUT')), TX_CONFIRM_TIMEOUT_MS),
          ),
        ]);

        if ((confirmResult as { value?: { err: unknown } }).value?.err) {
          throw new Error('Transaction failed on-chain');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown';
        const err: ClaimError = msg === 'TX_TIMEOUT'
          ? { code: 'TX_EXPIRED' }
          : { code: 'RPC_ERROR', message: msg };
        setError(err);
        setClaimState('error');
        return { success: false, error: err };
      }

      // ── Step 5: Write to Supabase ───────────────────────────────────────
      try {
        await createClaimRecord({
          dropId: drop.id,
          dropOnChainAddress: drop.onChainAddress,
          claimerWallet: publicKey,
          txSignature,
          distanceMeters,
        });
      } catch {
        // Non-fatal — on-chain state is the source of truth
      }

      // ── Step 6: Celebrate ───────────────────────────────────────────────
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastTxSignature(txSignature);
      setClaimState('success');

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['nearby-drops'] });
      queryClient.invalidateQueries({ queryKey: ['global-drops'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      return { success: true, txSignature };
    },
    [publicKey, authToken, coords, queryClient, devMode, devCoords],
  );

  return { claim, claimState, error, lastTxSignature };
}
