import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../../constants/solana';

/**
 * Derives the Drop PDA address for a given creator and UUID.
 *
 * @param creator - Creator's public key
 * @param uuid - 16-byte UUID buffer
 * @returns The Drop PDA public key and bump seed
 */
export async function findDropPDA(
  creator: PublicKey,
  uuid: Uint8Array,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('drop'), creator.toBuffer(), uuid],
    new PublicKey(PROGRAM_ID),
  );
}

/**
 * Derives the Vault PDA address for a given drop.
 *
 * @param dropPDA - The Drop account public key
 * @returns The Vault PDA public key and bump seed
 */
export async function findVaultPDA(
  dropPDA: PublicKey,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), dropPDA.toBuffer()],
    new PublicKey(PROGRAM_ID),
  );
}

/** Raw on-chain Drop account data layout */
export interface DropAccountData {
  creator: PublicKey;
  title: string;
  description: string;
  /** Stored as lat * 1_000_000 */
  latitude: bigint;
  /** Stored as lng * 1_000_000 */
  longitude: bigint;
  rarityTier: number;
  assetType: number;
  assetAmount: bigint;
  mintAddress: PublicKey | null;
  maxClaims: number;
  currentClaims: number;
  expiresAt: bigint;
  isActive: boolean;
  vaultBump: number;
  bump: number;
}
