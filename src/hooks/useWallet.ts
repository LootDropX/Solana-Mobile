import { useEffect, useCallback } from 'react';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useWalletStore } from '../stores/wallet.store';
import { MWA_APP_IDENTITY } from '../constants/solana';

const STORAGE_KEY_PUBKEY = '@lootdrop/wallet_pubkey';
const STORAGE_KEY_AUTH_TOKEN = '@lootdrop/auth_token';

// Temporary storage shim to keep build compatibility without native AsyncStorage.
// Data lasts for app process lifetime only.
const memoryStorage = new Map<string, string>();
const storage = {
  getItem: async (key: string): Promise<string | null> => memoryStorage.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    memoryStorage.delete(key);
  },
};

export interface UseWalletReturn {
  publicKey: string | null;
  isConnected: boolean;
  isRestoring: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Manages the MWA wallet session including connection, disconnection,
 * and session restoration from local storage.
 *
 * @returns Wallet state and connect/disconnect actions
 */
export function useWallet(): UseWalletReturn {
  const { publicKey, authToken, isRestoring, setWallet, clearWallet, setRestoring } =
    useWalletStore();

  // Restore persisted session on app launch
  useEffect(() => {
    async function restoreSession(): Promise<void> {
      try {
        const [pk, token] = await Promise.all([
          storage.getItem(STORAGE_KEY_PUBKEY),
          storage.getItem(STORAGE_KEY_AUTH_TOKEN),
        ]);
        if (pk && token) {
          setWallet(pk, token);
        }
      } catch {
        // Ignore storage errors; user will see connect screen
      } finally {
        setRestoring(false);
      }
    }
    restoreSession();
  }, [setWallet, setRestoring]);

  const connect = useCallback(async (): Promise<void> => {
    await transact(async (wallet) => {
      const authResult = await wallet.authorize({
        identity: MWA_APP_IDENTITY,
        chain: 'solana:devnet',
      });

      const pk = authResult.accounts[0]?.address ?? '';
      const token = authResult.auth_token;

      setWallet(pk, token);

      await Promise.all([
        storage.setItem(STORAGE_KEY_PUBKEY, pk),
        storage.setItem(STORAGE_KEY_AUTH_TOKEN, token),
      ]);
    });
  }, [setWallet]);

  const disconnect = useCallback(async (): Promise<void> => {
    clearWallet();
    await Promise.all([
      storage.removeItem(STORAGE_KEY_PUBKEY),
      storage.removeItem(STORAGE_KEY_AUTH_TOKEN),
    ]);
  }, [clearWallet]);

  return {
    publicKey,
    isConnected: publicKey !== null,
    isRestoring,
    connect,
    disconnect,
  };
}
