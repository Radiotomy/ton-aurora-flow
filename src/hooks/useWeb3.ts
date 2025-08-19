import { useEffect, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useWeb3 = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  
  const {
    isConnected,
    walletAddress,
    profile,
    connectingWallet,
    loadingProfile,
    setConnected,
    setWalletAddress,
    setProfile,
    setConnectingWallet,
    setLoadingProfile,
    disconnectWallet: storeDisconnectWallet,
  } = useWalletStore();

  // Handle wallet connection state changes
  useEffect(() => {
    if (wallet?.account) {
      setConnected(true);
      setWalletAddress(wallet.account.address);
      loadUserProfile(wallet.account.address);
    } else {
      setConnected(false);
      setWalletAddress(null);
      setProfile(null);
    }
  }, [wallet]);

  // Load or create user profile from database
  const loadUserProfile = useCallback(async (address: string) => {
    setLoadingProfile(true);
    
    try {
      // Note: For RLS, we'll use the wallet address directly in queries

      // Try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        toast({
          title: "Error loading profile",
          description: "Failed to load your Web3 profile",
          variant: "destructive",
        });
        return;
      }

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // Create new profile for this wallet
        const newProfile = {
          wallet_address: address,
          display_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
          reputation_score: 0,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          toast({
            title: "Error creating profile",
            description: "Failed to create your Web3 profile",
            variant: "destructive",
          });
          return;
        }

        setProfile(createdProfile);
        toast({
          title: "Welcome to Web3 Music!",
          description: "Your profile has been created",
        });
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      toast({
        title: "Connection error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  }, [setProfile, setLoadingProfile]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    if (connectingWallet) return;
    
    setConnectingWallet(true);
    
    try {
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect your TON wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  }, [tonConnectUI, connectingWallet, setConnectingWallet]);

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
      storeDisconnectWallet();
      toast({
        title: "Wallet disconnected",
        description: "Your TON wallet has been disconnected",
      });
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  }, [tonConnectUI, storeDisconnectWallet]);

  // Send transaction function
  const sendTransaction = useCallback(async (transaction: any) => {
    if (!wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your TON wallet first",
        variant: "destructive",
      });
      return null;
    }

    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction failed",
        description: "Failed to send transaction",
        variant: "destructive",
      });
      return null;
    }
  }, [wallet, tonConnectUI]);

  return {
    // State
    isConnected,
    walletAddress,
    profile,
    connectingWallet,
    loadingProfile,
    wallet,
    
    // Actions
    connectWallet,
    disconnectWallet,
    sendTransaction,
    
    // Computed
    isLoading: connectingWallet || loadingProfile,
    shortAddress: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null,
  };
};