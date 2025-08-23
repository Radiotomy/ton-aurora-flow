import { useEffect, useCallback, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Address, fromNano } from '@ton/core';

export const useWeb3 = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [balance, setBalance] = useState<string>('0');
  const [tonDnsName, setTonDnsName] = useState<string | null>(null);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  
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
      loadWalletBalance(wallet.account.address);
      checkTonDnsName(wallet.account.address);
    } else {
      setConnected(false);
      setWalletAddress(null);
      setProfile(null);
      setBalance('0');
      setTonDnsName(null);
    }
  }, [wallet]);

  // Load wallet balance
  const loadWalletBalance = useCallback(async (address: string) => {
    try {
      // This would typically call TON API to get balance
      // For now, we'll simulate with a mock value
      // In production, you'd call: https://toncenter.com/api/v2/getAddressInformation
      setBalance('12.5'); // Mock balance
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance('0');
    }
  }, []);

  // Check for TON DNS name
  const checkTonDnsName = useCallback(async (address: string) => {
    setIsCheckingDns(true);
    try {
      // This would typically resolve TON DNS
      // For now, we'll check our database for stored DNS names
      const { data: dnsRecord } = await supabase
        .from('profiles')
        .select('ton_dns_name')
        .eq('wallet_address', address)
        .maybeSingle();
      
      if (dnsRecord?.ton_dns_name) {
        setTonDnsName(dnsRecord.ton_dns_name);
      }
    } catch (error) {
      console.error('Error checking DNS:', error);
    } finally {
      setIsCheckingDns(false);
    }
  }, []);

  // Enhanced profile loading with better error handling
  const loadUserProfile = useCallback(async (address: string) => {
    setLoadingProfile(true);
    
    try {
      // Validate address format
      try {
        Address.parse(address);
      } catch (e) {
        throw new Error('Invalid wallet address format');
      }

      // Try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        throw new Error('Failed to fetch profile from database');
      }

      if (existingProfile) {
        setProfile(existingProfile);
        if (existingProfile.ton_dns_name) {
          setTonDnsName(existingProfile.ton_dns_name);
        }
        
        toast({
          title: "Welcome back! 👋",
          description: `Connected as ${existingProfile.display_name}`,
        });
      } else {
        // Create new profile for this wallet
        const newProfile = {
          wallet_address: address,
          display_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
          reputation_score: 0,
          created_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          // If it's a duplicate key error, the profile already exists - fetch it instead
          if (createError.code === '23505') {
            console.log('Profile already exists, fetching existing profile');
            const { data: existingProfile, error: refetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('wallet_address', address)
              .single();
            
            if (refetchError) {
              console.error('Error refetching existing profile:', refetchError);
              throw new Error('Profile exists but failed to fetch it');
            }
            
            setProfile(existingProfile);
            if (existingProfile.ton_dns_name) {
              setTonDnsName(existingProfile.ton_dns_name);
            }
            
            toast({
              title: "Welcome back! 👋",
              description: `Connected as ${existingProfile.display_name}`,
            });
            return;
          }
          
          console.error('Error creating profile:', createError);
          throw new Error('Failed to create new profile');
        }

        setProfile(createdProfile);
        
        toast({
          title: "Welcome to Web3 Music! 🎵",
          description: "Your profile has been created. Complete your setup in Dashboard.",
        });
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      toast({
        title: "Profile Error",
        description: error.message || "Failed to load your profile",
        variant: "destructive",
      });
      
      // Set basic profile even on error to prevent blocking the UI
      const fallbackProfile = {
        id: '',
        wallet_address: address,
        display_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        reputation_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
    } finally {
      setLoadingProfile(false);
    }
  }, [setProfile, setLoadingProfile]);

  // Enhanced wallet connection with better UX
  const connectWallet = useCallback(async () => {
    if (connectingWallet) return;
    
    console.log('🔵 Starting enhanced wallet connection...');
    setConnectingWallet(true);
    
    try {
      // Check if TON Connect UI is properly initialized
      if (!tonConnectUI) {
        throw new Error('TON Connect UI not initialized');
      }

      // Show connecting toast
      toast({
        title: "Connecting Wallet...",
        description: "Please approve the connection in your TON wallet",
      });
      
      // Set up connection timeout (60 seconds for better UX)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - please try again')), 60000);
      });
      
      const connectionPromise = tonConnectUI.connectWallet();
      
      console.log('🔵 Waiting for wallet connection...');
      await Promise.race([connectionPromise, timeoutPromise]);
      
      console.log('🟢 Wallet connected successfully');
      
      toast({
        title: "Wallet Connected! 🎉",
        description: "Your TON wallet has been successfully connected",
      });
      
    } catch (error) {
      console.error('🔴 Wallet connection error:', error);
      
      let errorTitle = "Connection Failed";
      let errorMessage = "Failed to connect your TON wallet";
      
      if (error.message.includes('timeout')) {
        errorTitle = "Connection Timeout";
        errorMessage = "The connection took too long. Please check your wallet and try again.";
      } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
        errorTitle = "Connection Cancelled";
        errorMessage = "Wallet connection was cancelled by user.";
        return; // Don't show error toast for user cancellation
      } else if (error.message.includes('manifest')) {
        errorTitle = "Configuration Error";
        errorMessage = "There's an issue with the wallet configuration. Please contact support.";
      } else if (error.message.includes('network')) {
        errorTitle = "Network Error";
        errorMessage = "Please check your internet connection and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🔵 Connection attempt finished');
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

  // Enhanced transaction handling
  const sendTransaction = useCallback(async (transaction: any, options?: { 
    showToast?: boolean;
    toastTitle?: string;
    toastDescription?: string;
  }) => {
    if (!wallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your TON wallet first",
        variant: "destructive",
      });
      return null;
    }

    const { showToast = true, toastTitle = "Sending Transaction...", toastDescription = "Please confirm in your wallet" } = options || {};

    try {
      if (showToast) {
        toast({
          title: toastTitle,
          description: toastDescription,
        });
      }

      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (showToast) {
        toast({
          title: "Transaction Sent! ✅",
          description: "Your transaction has been submitted to the network",
        });
      }

      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      
      let errorTitle = "Transaction Failed";
      let errorMessage = "Failed to send transaction";
      
      if (error.message.includes('insufficient')) {
        errorTitle = "Insufficient Balance";
        errorMessage = "You don't have enough TON to complete this transaction";
      } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "Transaction was cancelled by user";
        return null; // Don't show error for user cancellation
      } else if (error.message.includes('network')) {
        errorTitle = "Network Error";
        errorMessage = "Network error occurred. Please try again";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [wallet, tonConnectUI]);

  // Update TON DNS name
  const updateTonDnsName = useCallback(async (dnsName: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          ton_dns_name: dnsName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setTonDnsName(dnsName);
      setProfile({ ...profile, ton_dns_name: dnsName });
      
      toast({
        title: "TON DNS Updated",
        description: `Your TON DNS name has been set to ${dnsName}`,
      });

      return true;
    } catch (error) {
      console.error('Error updating TON DNS:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your TON DNS name",
        variant: "destructive",
      });
      return false;
    }
  }, [profile]);

  // Get wallet type info
  const getWalletInfo = useCallback(() => {
    if (!wallet) return null;

    return {
      name: wallet.device.appName || 'Unknown Wallet',
      version: wallet.device.appVersion || 'Unknown',
      platform: wallet.device.platform || 'Unknown',
      features: wallet.device.features || [],
    };
  }, [wallet]);

  return {
    // State
    isConnected,
    walletAddress,
    profile,
    connectingWallet,
    loadingProfile,
    wallet,
    balance,
    tonDnsName,
    isCheckingDns,
    
    // Actions
    connectWallet,
    disconnectWallet,
    sendTransaction,
    updateTonDnsName,
    loadWalletBalance,
    checkTonDnsName,
    
    // Computed
    isLoading: connectingWallet || loadingProfile,
    shortAddress: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null,
    formattedBalance: balance ? `${parseFloat(balance).toFixed(2)} TON` : '0 TON',
    walletInfo: getWalletInfo(),
  };
};