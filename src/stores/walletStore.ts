import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  wallet_address: string;
  ton_dns_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation_score: number;
}

export interface UserAsset {
  id: string;
  asset_type: 'nft' | 'token' | 'achievement';
  contract_address?: string;
  token_id?: string;
  metadata: any;
}

export interface FanClubMembership {
  id: string;
  artist_id: string;
  membership_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nft_token_id?: string;
  expires_at?: string;
}

interface WalletState {
  // Wallet connection
  isConnected: boolean;
  walletAddress: string | null;
  tonBalance: number;
  
  // User profile and Web3 identity
  profile: UserProfile | null;
  assets: UserAsset[];
  fanClubMemberships: FanClubMembership[];
  
  // UI state
  connectingWallet: boolean;
  loadingProfile: boolean;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setTonBalance: (balance: number) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAssets: (assets: UserAsset[]) => void;
  setFanClubMemberships: (memberships: FanClubMembership[]) => void;
  setConnectingWallet: (connecting: boolean) => void;
  setLoadingProfile: (loading: boolean) => void;
  
  // Web3 actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchUserAssets: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      walletAddress: null,
      tonBalance: 0,
      profile: null,
      assets: [],
      fanClubMemberships: [],
      connectingWallet: false,
      loadingProfile: false,
      
      // Basic setters
      setConnected: (connected) => set({ isConnected: connected }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setTonBalance: (balance) => set({ tonBalance: balance }),
      setProfile: (profile) => set({ profile }),
      setAssets: (assets) => set({ assets }),
      setFanClubMemberships: (memberships) => set({ fanClubMemberships: memberships }),
      setConnectingWallet: (connecting) => set({ connectingWallet: connecting }),
      setLoadingProfile: (loading) => set({ loadingProfile: loading }),
      
      // Web3 actions
      connectWallet: async () => {
        // This will be implemented with TON Connect hooks
        console.log('Connect wallet action');
      },
      
      disconnectWallet: () => {
        set({
          isConnected: false,
          walletAddress: null,
          tonBalance: 0,
          profile: null,
          assets: [],
          fanClubMemberships: [],
        });
      },
      
      fetchUserAssets: async () => {
        // This will fetch user's NFTs and tokens from blockchain
        console.log('Fetch user assets');
      },
      
      updateProfile: async (updates) => {
        const { profile } = get();
        if (profile) {
          set({ profile: { ...profile, ...updates } });
        }
      },
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        isConnected: state.isConnected,
        walletAddress: state.walletAddress,
        profile: state.profile,
      }),
    }
  )
);