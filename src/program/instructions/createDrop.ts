import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID } from '../../constants/solana';
import { findDropPDA, findVaultPDA } from '../accounts/Drop';

export interface CreateDropArgs {
  uuid: Uint8Array;
  title: string;
  description: string;
  /** Latitude multiplied by 1_000_000 */
  latitude: bigint;
  /** Longitude multiplied by 1_000_000 */
  longitude: bigint;
  rarityTier: number;
  assetType: number;
  assetAmount: bigint;
  maxClaims: number;
  expiresAt: bigint;
}

/**
 * Derives the Drop and Vault PDAs for a `create_drop` instruction.
 */
export async function resolveCreateDropAccounts(
  creator: PublicKey,
  uuid: Uint8Array,
): Promise<{ dropPDA: PublicKey; vaultPDA: PublicKey }> {
  const [dropPDA] = await findDropPDA(creator, uuid);
  const [vaultPDA] = await findVaultPDA(dropPDA);
  return { dropPDA, vaultPDA };
}

/**
 * Builds a raw `create_drop` transaction instruction for the LootDrop program.
 */
export function buildCreateDropInstruction(
  creator: PublicKey,
  dropPDA: PublicKey,
  vaultPDA: PublicKey,
  args: CreateDropArgs,
): TransactionInstruction {
  const programId = new PublicKey(PROGRAM_ID);

  // Anchor instruction discriminator for "create_drop"
  const discriminator = Buffer.from([122, 174, 197, 53, 129, 9, 165, 132]);

  // Encode args as Anchor-serialized bytes
  const uuidBuf = Buffer.from(args.uuid);
  const titleBuf = Buffer.from(args.title, 'utf8');
  const titleLenBuf = Buffer.alloc(4);
  titleLenBuf.writeUInt32LE(titleBuf.length, 0);
  const descBuf = Buffer.from(args.description, 'utf8');
  const descLenBuf = Buffer.alloc(4);
  descLenBuf.writeUInt32LE(descBuf.length, 0);

  const latBuf = Buffer.alloc(8);
  latBuf.writeBigInt64LE(args.latitude, 0);
  const lngBuf = Buffer.alloc(8);
  lngBuf.writeBigInt64LE(args.longitude, 0);

  const rarityBuf = Buffer.from([args.rarityTier]);
  const assetTypeBuf = Buffer.from([args.assetType]);

  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(args.assetAmount, 0);

  const maxClaimsBuf = Buffer.alloc(2);
  maxClaimsBuf.writeUInt16LE(args.maxClaims, 0);

  const expiresAtBuf = Buffer.alloc(8);
  expiresAtBuf.writeBigInt64LE(args.expiresAt, 0);

  const data = Buffer.concat([
    discriminator,
    uuidBuf,
    titleLenBuf, titleBuf,
    descLenBuf, descBuf,
    latBuf, lngBuf,
    rarityBuf, assetTypeBuf,
    amountBuf,
    maxClaimsBuf,
    expiresAtBuf,
  ]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: dropPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}
