import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useWalletStore } from '../stores/wallet.store';
import {
  buildCreateDropInstruction,
  resolveCreateDropAccounts,
} from '../program/instructions/createDrop';
import { createDropRecord } from '../services/drops.service';
import {
  SOLANA_RPC_URL,
  MWA_APP_IDENTITY,
  TX_CONFIRM_TIMEOUT_MS,
  CONFIRM_COMMITMENT,
} from '../constants/solana';
import type { DropCreationParams } from '../types/drop.types';

export type CreateDropState =
  | 'idle'
  | 'building_tx'
  | 'awaiting_signature'
  | 'confirming'
  | 'success'
  | 'error';

export interface UseCreateDropReturn {
  createDrop: (params: DropCreationParams) => Promise<{ success: boolean; error?: string }>;
  createState: CreateDropState;
  error: string | null;
}

/**
 * Orchestrates the full drop creation sequence:
 * 1. Build Anchor create_drop instruction
 * 2. Sign via MWA
 * 3. Submit & confirm on-chain
 * 4. Write drop metadata to Supabase
 *
 * @returns Create function, current state, and error
 */
export function useCreateDrop(): UseCreateDropReturn {
  const [createState, setCreateState] = useState<CreateDropState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { publicKey, authToken } = useWalletStore();
  const queryClient = useQueryClient();

  const createDrop = useCallback(
    async (params: DropCreationParams): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setCreateState('building_tx');

      if (!publicKey || !authToken) {
        const msg = 'Wallet not connected';
        setError(msg);
        setCreateState('error');
        return { success: false, error: msg };
      }

      const connection = new Connection(SOLANA_RPC_URL, CONFIRM_COMMITMENT);
      const creator = new PublicKey(publicKey);

      // Generate a random UUID
      const uuid = crypto.getRandomValues(new Uint8Array(16));

      const { dropPDA, vaultPDA } = await resolveCreateDropAccounts(creator, uuid);

      const instruction = buildCreateDropInstruction(creator, dropPDA, vaultPDA, {
        uuid,
        title: params.title,
        description: params.description,
        latitude: BigInt(Math.round(params.latitude * 1_000_000)),
        longitude: BigInt(Math.round(params.longitude * 1_000_000)),
        rarityTier: params.rarityTier,
        assetType: params.assetType,
        assetAmount: BigInt(params.assetAmount),
        maxClaims: params.maxClaims,
        expiresAt: BigInt(Math.floor(new Date(params.expiresAt).getTime() / 1000)),
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: creator,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();
      const transaction = new VersionedTransaction(message);
      const txBytes = transaction.serialize();

      setCreateState('awaiting_signature');

      let signedTxBytes: Uint8Array;
      try {
        const result = await transact(async (wallet) => {
          await wallet.authorize({ identity: MWA_APP_IDENTITY, chain: 'solana:devnet' });
          const signed = await wallet.signTransactions({
            transactions: [transaction],
          });
          return signed[0];
        });
        signedTxBytes = result.serialize();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Signing cancelled';
        setError(msg);
        setCreateState('error');
        return { success: false, error: msg };
      }

      setCreateState('confirming');

      let txSignature: string;
      try {
        txSignature = await connection.sendRawTransaction(signedTxBytes, {
          skipPreflight: false,
          maxRetries: 3,
        });

        await Promise.race([
          connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, CONFIRM_COMMITMENT),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TX_TIMEOUT')), TX_CONFIRM_TIMEOUT_MS),
          ),
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed';
        setError(msg);
        setCreateState('error');
        return { success: false, error: msg };
      }

      // Write to Supabase
      try {
        await createDropRecord({
          onChainAddress: dropPDA.toBase58(),
          creatorWallet: publicKey,
          ...params,
        });
      } catch {
        // Non-fatal
      }

      setCreateState('success');
      queryClient.invalidateQueries({ queryKey: ['nearby-drops'] });
      queryClient.invalidateQueries({ queryKey: ['global-drops'] });

      return { success: true };
    },
    [publicKey, authToken, queryClient],
  );

  return { createDrop, createState, error };
}
