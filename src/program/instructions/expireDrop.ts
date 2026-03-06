import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { PROGRAM_ID } from '../../constants/solana';
import { findVaultPDA } from '../accounts/Drop';

/**
 * Builds a raw `expire_drop` transaction instruction for the LootDrop program.
 *
 * @param creator - The drop creator's public key (signer)
 * @param dropPDA - The Drop account public key
 * @returns A `TransactionInstruction` ready to include in a VersionedTransaction
 */
export async function buildExpireDropInstruction(
  creator: PublicKey,
  dropPDA: PublicKey,
): Promise<TransactionInstruction> {
  const programId = new PublicKey(PROGRAM_ID);
  const [vaultPDA] = await findVaultPDA(dropPDA);

  // Anchor instruction discriminator for "expire_drop"
  const discriminator = Buffer.from([214, 30, 178, 74, 48, 197, 101, 176]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: dropPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(discriminator),
  });
}
