import { useEffect, useCallback, useState, useRef } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Address, fromNano } from '@ton/core';
import { useNavigationStability } from '@/hooks/useNavigationStability';

// Performance optimization: debounce hook
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

export const useWeb3 = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [balance, setBalance] = useState<string>('0');
  const [tonDnsName, setTonDnsName] = useState<string | null>(null);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const lastConnectedAddress = useRef<string | null>(null);
  const hasShownWelcomeToast = useRef<boolean>(false);
  const connectionToastId = useRef<string | null>(null);
  const isProcessingConnection = useRef<boolean>(false);
  
  // Debounce wallet address changes to prevent excessive updates
  const debouncedWalletAddress = useDebounce(wallet?.account.address || null, 200);
  const { isNavigating, createStableCallback } = useNavigationStability();
  
  // Use a try-catch wrapper for the store to prevent crashes
  const storeState = (() => {
    try {
      return useWalletStore();
    } catch (error) {
      console.error('Wallet store access error:', error);
      // Return default state if store is not accessible
      return {
        isConnected: false,
        walletAddress: null,
        profile: null,
        connectingWallet: false,
        loadingProfile: false,
        setConnected: () => {},
        setWalletAddress: () => {},
        setProfile: () => {},
        setConnectingWallet: () => {},
        setLoadingProfile: () => {},
        disconnectWallet: () => {},
      };
    }
  })();

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
  } = storeState;

  // Refs to store functions to prevent circular dependencies
  const setConnectedRef = useRef(setConnected);
  const setWalletAddressRef = useRef(setWalletAddress);
  const setProfileRef = useRef(setProfile);
  const setLoadingProfileRef = useRef(setLoadingProfile);

  // Update refs when functions change
  useEffect(() => {
    setConnectedRef.current = setConnected;
    setWalletAddressRef.current = setWalletAddress;
    setProfileRef.current = setProfile;
    setLoadingProfileRef.current = setLoadingProfile;
  }, [setConnected, setWalletAddress, setProfile, setLoadingProfile]);

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
    setLoadingProfileRef.current(true);
    
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
        setProfileRef.current(existingProfile);
        if (existingProfile.ton_dns_name) {
          setTonDnsName(existingProfile.ton_dns_name);
        }
        
        // Only show welcome toast for new connections, not reconnections
        if (!hasShownWelcomeToast.current && lastConnectedAddress.current !== address) {
          hasShownWelcomeToast.current = true;
          toast.success(`Welcome back, ${existingProfile.display_name}! 👋`);
        }
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
            // Profile already exists, fetching existing profile
            const { data: existingProfile, error: refetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('wallet_address', address)
              .single();
            
            if (refetchError) {
              console.error('Error refetching existing profile:', refetchError);
              throw new Error('Profile exists but failed to fetch it');
            }
            
            setProfileRef.current(existingProfile);
            if (existingProfile.ton_dns_name) {
              setTonDnsName(existingProfile.ton_dns_name);
            }
            
            // Only show welcome toast for new connections, not reconnections
            if (!hasShownWelcomeToast.current && lastConnectedAddress.current !== address) {
              hasShownWelcomeToast.current = true;
              toast.success(`Welcome back, ${existingProfile.display_name}! 👋`);
            }
            return;
          }
          
          console.error('Error creating profile:', createError);
          throw new Error('Failed to create new profile');
        }

        setProfileRef.current(createdProfile);
        
        // Only show welcome toast for first-time users
        if (!hasShownWelcomeToast.current) {
          hasShownWelcomeToast.current = true;
          toast.success('Welcome to Web3 Music! 🎵 Complete your setup in Dashboard.');
        }
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      toast.error(error.message || "Failed to load your profile");
      
      // Set basic profile even on error to prevent blocking the UI
      const fallbackProfile = {
        id: '',
        wallet_address: address,
        display_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        reputation_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfileRef.current(fallbackProfile);
    } finally {
      setLoadingProfileRef.current(false);
    }
  }, []);

  // Handle wallet connection state changes with navigation stability
  useEffect(() => {
    // Don't process wallet changes during navigation or if already processing
    if (isNavigating || isProcessingConnection.current) return;
    
    const processWalletConnection = async () => {
      if (debouncedWalletAddress && wallet?.account) {
        const currentAddress = debouncedWalletAddress;
        
        // Only proceed if this is a new connection or different address
        if (lastConnectedAddress.current !== currentAddress) {
          isProcessingConnection.current = true;
          
          // Only reset welcome toast for actually different addresses
          const shouldResetToast = lastConnectedAddress.current && lastConnectedAddress.current !== currentAddress;
          if (shouldResetToast) {
            hasShownWelcomeToast.current = false;
          }
          
          lastConnectedAddress.current = currentAddress;
          
          // Use the refs to avoid circular dependencies
          setConnectedRef.current(true);
          setWalletAddressRef.current(currentAddress);
          
          // Process profile loading asynchronously
          try {
            await Promise.all([
              loadUserProfile(currentAddress),
              loadWalletBalance(currentAddress),
              checkTonDnsName(currentAddress)
            ]);
          } catch (error) {
            console.error('Error processing wallet connection:', error);
          } finally {
            isProcessingConnection.current = false;
          }
        }
      } else if (!connectingWallet && lastConnectedAddress.current !== null) {
        // Reset state when wallet disconnects
        lastConnectedAddress.current = null;
        hasShownWelcomeToast.current = false;
        isProcessingConnection.current = false;
        
        setConnectedRef.current(false);
        setWalletAddressRef.current(null);
        setProfileRef.current(null);
        setBalance('0');
        setTonDnsName(null);
      }
    };

    processWalletConnection();
  }, [debouncedWalletAddress, wallet?.account, isNavigating, connectingWallet, loadUserProfile, loadWalletBalance, checkTonDnsName]);

  // Enhanced wallet connection with better UX
  const connectWallet = useCallback(async () => {
    if (connectingWallet) return;
    
    setConnectingWallet(true);
    
    try {
      // Check if TON Connect UI is properly initialized
      if (!tonConnectUI) {
        throw new Error('TON Connect UI not initialized');
      }

      // Dismiss any existing connection toasts
      if (connectionToastId.current) {
        toast.dismiss(connectionToastId.current);
      }

      // Show connecting toast and store the ID
      connectionToastId.current = String(toast.loading('Connecting wallet... Please approve the connection in your TON wallet'));
      
      // Set up connection timeout (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - please try again')), 30000);
      });
      
      const connectionPromise = tonConnectUI.connectWallet();
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      // Dismiss connecting toast
      if (connectionToastId.current) {
        toast.dismiss(connectionToastId.current);
        connectionToastId.current = null;
      }
      
      // Don't show success toast here - it will be shown in loadUserProfile
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Dismiss connecting toast
      if (connectionToastId.current) {
        toast.dismiss(connectionToastId.current);
        connectionToastId.current = null;
      }
      
      let errorMessage = "Failed to connect your TON wallet";
      
      if (error.message.includes('timeout')) {
        errorMessage = "Connection timeout. Please check your wallet and try again.";
      } else if (error.message.includes('rejected') || error.message.includes('cancelled') || error.message.includes('not connected')) {
        return; // Don't show error toast for user cancellation
      } else if (error.message.includes('manifest')) {
        errorMessage = "Configuration error. Please contact support.";
      } else if (error.message.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast.error(errorMessage);
    } finally {
      setConnectingWallet(false);
    }
  }, [tonConnectUI, connectingWallet, setConnectingWallet]);

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      // Check if TON Connect UI is properly initialized
      if (!tonConnectUI) {
        console.warn('TON Connect UI not initialized, clearing local state only');
        storeDisconnectWallet();
        toast.success('Wallet disconnected successfully');
        return;
      }

      // Show loading state while disconnecting
      const disconnectToastId = String(toast.loading('Disconnecting wallet...'));
      
      try {
        // Attempt to disconnect from TON Connect
        await tonConnectUI.disconnect();
        
        // Clear local state
        storeDisconnectWallet();
        
        // Reset internal state
        lastConnectedAddress.current = null;
        hasShownWelcomeToast.current = false;
        isProcessingConnection.current = false;
        setBalance('0');
        setTonDnsName(null);
        
        // Dismiss loading toast and show success
        toast.dismiss(disconnectToastId);
        toast.success('Wallet disconnected successfully');
        
      } catch (disconnectError) {
        // Dismiss loading toast
        toast.dismiss(disconnectToastId);
        
        // Even if TON Connect disconnect fails, clear local state
        console.warn('TON Connect disconnect failed, clearing local state:', disconnectError);
        storeDisconnectWallet();
        
        // Reset internal state
        lastConnectedAddress.current = null;  
        hasShownWelcomeToast.current = false;
        isProcessingConnection.current = false;
        setBalance('0');
        setTonDnsName(null);
        
        toast.success('Wallet disconnected successfully');
      }
      
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      toast.error('Failed to disconnect wallet completely. Please refresh the page if issues persist.');
    }
  }, [tonConnectUI, storeDisconnectWallet]);

  // Enhanced transaction handling
  const sendTransaction = useCallback(async (transaction: any, options?: { 
    showToast?: boolean;
    toastTitle?: string;
    toastDescription?: string;
  }) => {
    if (!wallet) {
      toast.error('Please connect your TON wallet first');
      return null;
    }

    const { showToast = true, toastTitle = "Sending Transaction...", toastDescription = "Please confirm in your wallet" } = options || {};

    try {
      if (showToast) {
        toast.loading(`${toastTitle} ${toastDescription}`);
      }

      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (showToast) {
        toast.success('Transaction sent! ✅ Your transaction has been submitted to the network');
      }

      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      
      let errorMessage = "Failed to send transaction";
      
      if (error.message.includes('insufficient')) {
        errorMessage = "Insufficient balance. You don't have enough TON to complete this transaction";
      } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
        return null; // Don't show error for user cancellation
      } else if (error.message.includes('network')) {
        errorMessage = "Network error occurred. Please try again";
      }
      
      toast.error(errorMessage);
      
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
      
      toast.success(`TON DNS updated to ${dnsName}`);

      return true;
    } catch (error) {
      console.error('Error updating TON DNS:', error);
      toast.error('Failed to update your TON DNS name');
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