import Constants from 'expo-constants';

/** Solana RPC endpoint URL */
export const SOLANA_RPC_URL: string =
  Constants.expoConfig?.extra?.solanaRpcUrl ??
  'https://api.devnet.solana.com';

/** Deployed Anchor program ID */
export const PROGRAM_ID: string =
  Constants.expoConfig?.extra?.programId ??
  'LootXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

/** Solana cluster identifier */
export const SOLANA_CLUSTER: 'devnet' | 'mainnet-beta' =
  (Constants.expoConfig?.extra?.solanaCluster as 'devnet' | 'mainnet-beta') ??
  'devnet';

/** Commitment level for on-chain reads */
export const READ_COMMITMENT = 'confirmed' as const;

/** Commitment level for transaction confirmation */
export const CONFIRM_COMMITMENT = 'confirmed' as const;

/** Transaction confirmation timeout in milliseconds */
export const TX_CONFIRM_TIMEOUT_MS = 30_000;

/** MWA app identity for wallet authorization */
export const MWA_APP_IDENTITY = {
  name: 'LootDrop',
  uri: 'https://lootdrop.app',
  icon: 'favicon.png',
} as const;
