import { supabase } from '@/integrations/supabase/client';

export interface BridgeTransaction {
  id: string;
  from_chain: 'ethereum' | 'solana' | 'ton';
  to_chain: 'ethereum' | 'solana' | 'ton';
  from_token: string;
  to_token: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fees: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  from_tx_hash?: string;
  to_tx_hash?: string;
  profile_id: string;
  created_at: string;
  completed_at?: string;
}

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: string;
  audioContract?: string;
}

export class CrossChainBridge {
  private static readonly SUPPORTED_CHAINS: Record<string, ChainConfig> = {
    ethereum: {
      name: 'Ethereum',
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/',
      explorerUrl: 'https://etherscan.io',
      nativeToken: 'ETH',
      audioContract: '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998', // $AUDIO on Ethereum
    },
    solana: {
      name: 'Solana',
      chainId: 101,
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      nativeToken: 'SOL',
      audioContract: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247aBqdiPEcF', // $AUDIO on Solana
    },
    ton: {
      name: 'TON',
      chainId: -239,
      rpcUrl: 'https://toncenter.com/api/v2/jsonRPC',
      explorerUrl: 'https://tonviewer.com',
      nativeToken: 'TON',
    }
  };

  /**
   * Get supported bridge routes
   */
  static getSupportedRoutes(): Array<{
    from: string;
    to: string;
    fromToken: string;
    toToken: string;
    minAmount: number;
    maxAmount: number;
    estimatedTime: string;
  }> {
    return [
      {
        from: 'ethereum',
        to: 'ton',
        fromToken: 'AUDIO',
        toToken: 'AUDIO-TON',
        minAmount: 1,
        maxAmount: 100000,
        estimatedTime: '5-10 minutes'
      },
      {
        from: 'solana',
        to: 'ton',
        fromToken: 'AUDIO',
        toToken: 'AUDIO-TON',
        minAmount: 1,
        maxAmount: 100000,
        estimatedTime: '3-5 minutes'
      },
      {
        from: 'ton',
        to: 'ethereum',
        fromToken: 'AUDIO-TON',
        toToken: 'AUDIO',
        minAmount: 1,
        maxAmount: 100000,
        estimatedTime: '10-15 minutes'
      },
      {
        from: 'ton',
        to: 'solana',
        fromToken: 'AUDIO-TON',
        toToken: 'AUDIO',
        minAmount: 1,
        maxAmount: 100000,
        estimatedTime: '5-10 minutes'
      }
    ];
  }

  /**
   * Get current exchange rates
   */
  static async getExchangeRates(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase.functions.invoke('bridge-exchange-rates');
      
      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch rates');
      }

      return data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return default rates as fallback
      return {
        'AUDIO-ETH': 1.0,
        'AUDIO-SOL': 1.0,
        'AUDIO-TON': 1.0,
        'TON-AUDIO': 1.0,
      };
    }
  }

  /**
   * Estimate bridge transaction
   */
  static async estimateBridge(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<{
    toAmount: number;
    fees: number;
    exchangeRate: number;
    estimatedTime: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('bridge-estimate', {
        body: { fromChain, toChain, fromToken, toToken, amount }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to estimate bridge');
      }

      return data.estimate;
    } catch (error) {
      console.error('Error estimating bridge:', error);
      
      // Fallback estimation
      const baseFee = amount * 0.003; // 0.3% fee
      const exchangeRate = 1.0; // 1:1 for same token
      
      return {
        toAmount: amount - baseFee,
        fees: baseFee,
        exchangeRate,
        estimatedTime: '5-10 minutes'
      };
    }
  }

  /**
   * Initiate bridge transaction
   */
  static async initiateBridge(
    profileId: string,
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: number,
    fromAddress: string,
    toAddress: string
  ): Promise<BridgeTransaction> {
    try {
      const { data, error } = await supabase.functions.invoke('bridge-initiate', {
        body: {
          profileId,
          fromChain,
          toChain,
          fromToken,
          toToken,
          amount,
          fromAddress,
          toAddress
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to initiate bridge');
      }

      return data.transaction;
    } catch (error) {
      console.error('Error initiating bridge:', error);
      throw error;
    }
  }

  /**
   * Get bridge transaction status
   */
  static async getBridgeStatus(transactionId: string): Promise<BridgeTransaction> {
    try {
      const { data, error } = await supabase.functions.invoke('bridge-status', {
        body: { transactionId }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to get bridge status');
      }

      return data.transaction;
    } catch (error) {
      console.error('Error getting bridge status:', error);
      throw error;
    }
  }

  /**
   * Get user's bridge transaction history
   */
  static async getBridgeHistory(profileId: string, limit = 20): Promise<BridgeTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('cross_token_transactions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching bridge history:', error);
      return [];
    }
  }

  /**
   * Get supported chains configuration
   */
  static getChainConfig(chainName: string): ChainConfig | null {
    return this.SUPPORTED_CHAINS[chainName] || null;
  }

  /**
   * Validate bridge parameters
   */
  static validateBridgeParams(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: number
  ): { valid: boolean; error?: string } {
    // Check if chains are supported
    if (!this.SUPPORTED_CHAINS[fromChain]) {
      return { valid: false, error: `Unsupported source chain: ${fromChain}` };
    }

    if (!this.SUPPORTED_CHAINS[toChain]) {
      return { valid: false, error: `Unsupported destination chain: ${toChain}` };
    }

    // Check if same chain
    if (fromChain === toChain) {
      return { valid: false, error: 'Source and destination chains cannot be the same' };
    }

    // Check amount
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    // Check supported route
    const routes = this.getSupportedRoutes();
    const routeExists = routes.some(route => 
      route.from === fromChain && 
      route.to === toChain && 
      route.fromToken === fromToken && 
      route.toToken === toToken
    );

    if (!routeExists) {
      return { valid: false, error: 'Bridge route not supported' };
    }

    return { valid: true };
  }
}