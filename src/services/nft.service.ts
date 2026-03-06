import Constants from 'expo-constants';
import type { InventoryItem } from '../types/nft.types';

const HELIUS_API_KEY: string =
  Constants.expoConfig?.extra?.heliusApiKey ??
  process.env.EXPO_PUBLIC_HELIUS_API_KEY ??
  '';

const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const DEVNET_HELIUS_RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const cluster: string =
  Constants.expoConfig?.extra?.solanaCluster ?? 'devnet';

const DAS_URL = cluster === 'mainnet-beta' ? HELIUS_RPC_URL : DEVNET_HELIUS_RPC_URL;

interface HeliusDASAsset {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string; description?: string };
    links?: { image?: string };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  creators?: Array<{ address: string; share: number; verified: boolean }>;
}

interface HeliusDASResponse {
  result?: {
    items?: HeliusDASAsset[];
    total?: number;
  };
}

/**
 * Fetches all NFTs owned by a wallet using the Helius DAS API.
 *
 * @param walletAddress - Base58 wallet public key
 * @returns Array of raw DAS asset objects
 */
export async function fetchWalletNFTs(walletAddress: string): Promise<HeliusDASAsset[]> {
  const response = await fetch(DAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'lootdrop-inventory',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 1000,
        displayOptions: { showFungible: false, showNativeBalance: false },
      },
    }),
  });

  if (!response.ok) throw new Error(`Helius DAS request failed: ${response.status}`);

  const json = (await response.json()) as HeliusDASResponse;
  return json.result?.items ?? [];
}

/**
 * Maps a Helius DAS asset to the app's `InventoryItem` model.
 */
export function mapDASAssetToInventoryItem(asset: HeliusDASAsset): InventoryItem {
  return {
    mintAddress: asset.id,
    name: asset.content?.metadata?.name ?? 'Unknown',
    symbol: asset.content?.metadata?.symbol ?? '',
    imageUri: asset.content?.links?.image ?? '',
  };
}
