import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UnifiedProfile {
  id: string;
  auth_user_id?: string;
  wallet_address?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  ton_dns_name?: string;
  reputation_score?: number;
  created_at: string;
  updated_at: string;
}

interface UnifiedAuthState {
  // Authentication state
  isAuthenticated: boolean;
  authMethod: 'email' | 'wallet' | null;
  
  // User data
  user: User | null;
  session: Session | null;
  profile: UnifiedProfile | null;
  
  // Wallet data
  walletAddress: string | null;
  walletBalance: string;
  tonDnsName: string | null;
  
  // Loading states
  loading: boolean;
  connectingWallet: boolean;
  
  // Methods
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  connectWallet: () => Promise<void>;
  linkWalletToAccount: () => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

/**
 * Unified authentication hook that supports both email and wallet authentication
 * Prioritizes wallet-first approach while maintaining email auth compatibility
 */
export const useUnifiedAuth = (): UnifiedAuthState => {
  const [authMethod, setAuthMethod] = useState<'email' | 'wallet' | null>(null);
  const [unifiedProfile, setUnifiedProfile] = useState<UnifiedProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { toast } = useToast();
  
  // Use existing auth hooks
  const emailAuth = useAuth();
  const walletAuth = useWeb3();
  
  // Determine primary authentication method and profile
  useEffect(() => {
    if (!isInitialized && (!emailAuth.loading && !walletAuth.loadingProfile)) {
      const hasWallet = walletAuth.isConnected && walletAuth.walletAddress;
      const hasEmail = emailAuth.isAuthenticated && emailAuth.user;
      
      if (hasWallet && hasEmail) {
        // Both connected - prioritize wallet but use email profile if available
        setAuthMethod('wallet');
        const profile = walletAuth.profile || emailAuth.profile;
        if (profile) {
          setUnifiedProfile({
            ...profile,
            created_at: (profile as any).created_at || new Date().toISOString(),
            updated_at: (profile as any).updated_at || new Date().toISOString()
          });
        }
      } else if (hasWallet) {
        // Wallet only
        setAuthMethod('wallet');
        if (walletAuth.profile) {
          setUnifiedProfile({
            ...walletAuth.profile,
            created_at: (walletAuth.profile as any).created_at || new Date().toISOString(),
            updated_at: (walletAuth.profile as any).updated_at || new Date().toISOString()
          });
        }
      } else if (hasEmail) {
        // Email only
        setAuthMethod('email');
        if (emailAuth.profile) {
          setUnifiedProfile({
            ...emailAuth.profile,
            created_at: (emailAuth.profile as any).created_at || new Date().toISOString(),
            updated_at: (emailAuth.profile as any).updated_at || new Date().toISOString()
          });
        }
      } else {
        // Neither connected
        setAuthMethod(null);
        setUnifiedProfile(null);
      }
      
      setIsInitialized(true);
    }
  }, [
    emailAuth.loading, 
    emailAuth.isAuthenticated, 
    emailAuth.user, 
    emailAuth.profile,
    walletAuth.loadingProfile,
    walletAuth.isConnected, 
    walletAuth.walletAddress, 
    walletAuth.profile,
    isInitialized
  ]);
  
  // Link wallet to existing email account
  const linkWalletToAccount = useCallback(async (): Promise<boolean> => {
    if (!emailAuth.user || !walletAuth.walletAddress) {
      toast({
        title: "Link Failed",
        description: "Please ensure both email and wallet are connected",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Update email profile with wallet address
      const { error } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: walletAuth.walletAddress,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', emailAuth.user.id);
      
      if (error) throw error;
      
      // Update unified profile
      const updatedProfile: UnifiedProfile = {
        ...emailAuth.profile,
        wallet_address: walletAuth.walletAddress,
        created_at: (emailAuth.profile as any)?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUnifiedProfile(updatedProfile);
      
      toast({
        title: "Wallet Linked Successfully! 🎉",
        description: "Your TON wallet is now connected to your account"
      });
      
      return true;
    } catch (error) {
      console.error('Error linking wallet:', error);
      toast({
        title: "Link Failed",
        description: "Failed to link wallet to your account",
        variant: "destructive"
      });
      return false;
    }
  }, [emailAuth.user, emailAuth.profile, walletAuth.walletAddress, toast]);
  
  // Enhanced sign out that handles both auth methods
  const signOut = useCallback(async () => {
    try {
      // Sign out from both systems
      await Promise.allSettled([
        emailAuth.signOut(),
        walletAuth.disconnectWallet()
      ]);
      
      // Reset unified state
      setAuthMethod(null);
      setUnifiedProfile(null);
      setIsInitialized(false);
      
      toast({
        title: "Signed out successfully",
        description: "See you next time! 👋"
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed", 
        description: "There was an issue signing out",
        variant: "destructive"
      });
    }
  }, [emailAuth, walletAuth, toast]);
  
  return {
    // Authentication state  
    isAuthenticated: authMethod !== null,
    authMethod,
    
    // User data - prioritize wallet profile, fallback to email profile
    user: emailAuth.user,
    session: emailAuth.session,
    profile: unifiedProfile,
    
    // Wallet data
    walletAddress: walletAuth.walletAddress,
    walletBalance: walletAuth.balance,
    tonDnsName: walletAuth.tonDnsName,
    
    // Loading states
    loading: emailAuth.loading || walletAuth.loadingProfile || !isInitialized,
    connectingWallet: walletAuth.connectingWallet,
    
    // Methods
    signInWithEmail: emailAuth.signIn,
    signUpWithEmail: emailAuth.signUp,
    connectWallet: walletAuth.connectWallet,
    linkWalletToAccount,
    signOut,
    resetPassword: emailAuth.resetPassword,
  };
};