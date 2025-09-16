import { useState, useCallback } from 'react';
import { CrossChainBridge, BridgeTransaction } from '@/services/crossChainBridge';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from '@/hooks/use-toast';

export const useCrossChainBridge = () => {
  const { profile } = useAuth();
  const { walletAddress } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTransaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const fetchExchangeRates = useCallback(async () => {
    try {
      const rates = await CrossChainBridge.getExchangeRates();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }, []);

  const fetchBridgeHistory = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const history = await CrossChainBridge.getBridgeHistory(profile.id);
      setBridgeHistory(history);
    } catch (error) {
      console.error('Error fetching bridge history:', error);
    }
  }, [profile?.id]);

  const estimateBridge = useCallback(async (
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: number
  ) => {
    try {
      setLoading(true);
      
      // Validate parameters
      const validation = CrossChainBridge.validateBridgeParams(
        fromChain, toChain, fromToken, toToken, amount
      );
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const estimate = await CrossChainBridge.estimateBridge(
        fromChain, toChain, fromToken, toToken, amount
      );

      return estimate;
    } catch (error) {
      console.error('Error estimating bridge:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateBridge = useCallback(async (
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: number,
    toAddress: string
  ) => {
    if (!profile?.id || !walletAddress) {
      throw new Error('Profile and wallet connection required');
    }

    try {
      setLoading(true);

      const transaction = await CrossChainBridge.initiateBridge(
        profile.id,
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        walletAddress,
        toAddress
      );

      toast({
        title: "Bridge Initiated",
        description: `Bridge transaction started. ID: ${transaction.id}`,
      });

      // Refresh history
      fetchBridgeHistory();

      return transaction;
    } catch (error) {
      toast({
        title: "Bridge Failed",
        description: error instanceof Error ? error.message : "Failed to initiate bridge",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profile?.id, walletAddress, fetchBridgeHistory]);

  const checkBridgeStatus = useCallback(async (transactionId: string) => {
    try {
      const status = await CrossChainBridge.getBridgeStatus(transactionId);
      
      // Update the transaction in history
      setBridgeHistory(prev => 
        prev.map(tx => tx.id === transactionId ? status : tx)
      );

      return status;
    } catch (error) {
      console.error('Error checking bridge status:', error);
      throw error;
    }
  }, []);

  const getSupportedRoutes = useCallback(() => {
    return CrossChainBridge.getSupportedRoutes();
  }, []);

  return {
    loading,
    bridgeHistory,
    exchangeRates,
    estimateBridge,
    initiateBridge,
    checkBridgeStatus,
    getSupportedRoutes,
    fetchBridgeHistory,
    fetchExchangeRates,
  };
};