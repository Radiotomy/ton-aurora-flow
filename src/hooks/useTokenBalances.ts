import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3 } from './useWeb3';
import { TokenType, TokenBalance, UnifiedPaymentService } from '@/services/unifiedPaymentService';

interface UseTokenBalancesReturn {
  balances: TokenBalance[];
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getBalance: (token: TokenType) => number;
  totalValueInTon: number;
}

export const useTokenBalances = (): UseTokenBalancesReturn => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useWeb3();

  const fetchBalances = useCallback(async () => {
    if (!profile?.id) {
      setBalances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchedBalances = await UnifiedPaymentService.getTokenBalances(profile.id);
      
      // Ensure we have entries for both tokens
      const tokenTypes: TokenType[] = ['TON', 'AUDIO'];
      const completeBalances = tokenTypes.map(tokenType => {
        const existing = fetchedBalances.find(b => b.token === tokenType);
        return existing || {
          token: tokenType,
          balance: 0,
          lastUpdated: new Date()
        };
      });

      setBalances(completeBalances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Set up real-time subscription for balance changes
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('token-balances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'token_balances',
          filter: `profile_id=eq.${profile.id}`
        },
        () => {
          fetchBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchBalances]);

  const getBalance = useCallback((token: TokenType): number => {
    const balance = balances.find(b => b.token === token);
    return balance?.balance || 0;
  }, [balances]);

  const totalValueInTon = useCallback(async () => {
    const tonBalance = getBalance('TON');
    const audioBalance = getBalance('AUDIO');
    
    if (audioBalance > 0) {
      const conversionRate = await UnifiedPaymentService.getConversionRate('AUDIO', 'TON');
      return tonBalance + (audioBalance * conversionRate);
    }
    
    return tonBalance;
  }, [balances, getBalance]);

  // Calculate total value synchronously for now (could be async if needed)
  const [totalValue, setTotalValue] = useState(0);
  useEffect(() => {
    totalValueInTon().then(setTotalValue);
  }, [totalValueInTon]);

  return {
    balances,
    loading,
    error,
    refreshBalances: fetchBalances,
    getBalance,
    totalValueInTon: totalValue
  };
};