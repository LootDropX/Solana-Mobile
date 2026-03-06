import { useQuery } from '@tanstack/react-query';
import { useWalletStore } from '../stores/wallet.store';
import { fetchWalletNFTs, mapDASAssetToInventoryItem } from '../services/nft.service';
import { fetchClaimsByWallet } from '../services/drops.service';
import type { InventoryItem } from '../types/nft.types';

export interface UseInventoryReturn {
  nfts: InventoryItem[];
  solEarned: number;
  totalClaims: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches the user's on-chain NFT inventory via Helius DAS, enriched
 * with off-chain claim metadata from Supabase.
 *
 * @returns Inventory items, earnings summary, loading/error states
 */
export function useInventory(): UseInventoryReturn {
  const publicKey = useWalletStore((s) => s.publicKey);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', publicKey],
    queryFn: async (): Promise<{
      nfts: InventoryItem[];
      solEarned: number;
      totalClaims: number;
    }> => {
      if (!publicKey) return { nfts: [], solEarned: 0, totalClaims: 0 };

      const [dasAssets, claimRecords] = await Promise.all([
        fetchWalletNFTs(publicKey),
        fetchClaimsByWallet(publicKey),
      ]);

      // Map DAS assets to inventory items
      const items = dasAssets.map((asset) => {
        const base = mapDASAssetToInventoryItem(asset);
        // Enrich with claim metadata if available
        const claim = claimRecords.find((c) => c.dropId === asset.id);
        return {
          ...base,
          dropId: claim?.dropId,
          claimedAt: claim?.claimedAt,
          txSignature: claim?.txSignature,
          distanceAtClaim: claim?.distance,
        };
      });

      return {
        nfts: items,
        solEarned: 0, // TODO: aggregate from SOL drop claims
        totalClaims: claimRecords.length,
      };
    },
    enabled: !!publicKey,
    staleTime: 60_000,
  });

  return {
    nfts: data?.nfts ?? [],
    solEarned: data?.solEarned ?? 0,
    totalClaims: data?.totalClaims ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
