import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../../constants/solana';

/**
 * Derives the ClaimRecord PDA address for a given drop and claimer.
 *
 * @param dropPDA - The Drop account public key
 * @param claimer - The claimer's public key
 * @returns The ClaimRecord PDA public key and bump seed
 */
export function findClaimRecordPDA(
  dropPDA: PublicKey,
  claimer: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), dropPDA.toBuffer(), claimer.toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
}

/** Raw on-chain ClaimRecord account data layout */
export interface ClaimRecordAccountData {
  drop: PublicKey;
  claimer: PublicKey;
  claimedAt: bigint;
  /** Distance in centimetres at claim time */
  distanceCm: number;
}
