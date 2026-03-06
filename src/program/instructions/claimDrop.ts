import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID } from '../../constants/solana';
import { findDropPDA, findVaultPDA } from '../accounts/Drop';
import { findClaimRecordPDA } from '../accounts/ClaimRecord';

export interface ClaimDropInstructionAccounts {
  drop: PublicKey;
  claimRecord: PublicKey;
  vault: PublicKey;
  claimer: PublicKey;
}

/**
 * Builds a raw `claim_drop` transaction instruction for the LootDrop program.
 *
 * @param accounts - Pre-derived PDA accounts for the instruction
 * @param distanceCm - Distance in centimetres from the drop center at claim time
 * @returns A `TransactionInstruction` ready to include in a VersionedTransaction
 */
export function buildClaimDropInstruction(
  accounts: ClaimDropInstructionAccounts,
  distanceCm: number,
): TransactionInstruction {
  const programId = new PublicKey(PROGRAM_ID);

  // Anchor instruction discriminator for "claim_drop"
  // sha256("global:claim_drop")[0..8]
  const discriminator = Buffer.from([62, 199, 214, 228, 76, 85, 213, 32]);

  // Encode distanceCm as little-endian u32
  const distanceBuffer = Buffer.alloc(4);
  distanceBuffer.writeUInt32LE(distanceCm, 0);

  const data = Buffer.concat([discriminator, distanceBuffer]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: accounts.drop, isSigner: false, isWritable: true },
      { pubkey: accounts.claimRecord, isSigner: false, isWritable: true },
      { pubkey: accounts.vault, isSigner: false, isWritable: true },
      { pubkey: accounts.claimer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Derives all required PDAs for a `claim_drop` instruction.
 *
 * @param dropPDA - The Drop account public key
 * @param claimer - The claimer's public key
 * @returns Fully resolved accounts object
 */
export async function resolveClaimDropAccounts(
  dropPDA: PublicKey,
  claimer: PublicKey,
): Promise<ClaimDropInstructionAccounts> {
  const [vault] = await findVaultPDA(dropPDA);
  const [claimRecord] = findClaimRecordPDA(dropPDA, claimer);

  return {
    drop: dropPDA,
    claimRecord,
    vault,
    claimer,
  };
}
