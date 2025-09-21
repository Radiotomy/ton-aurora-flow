import { supabase } from '@/integrations/supabase/client';
import { Address } from '@ton/core';

export interface ChainStackTonBalance {
  balance: string;
  formatted: string;
  nanotons: string;
  lastUpdated: string;
  chainstackPowered: boolean;
  network: string;
}

export interface ChainStackTransaction {
  hash: string;
  lt: string;
  account: string;
  timestamp: string | null;
  fee: string;
  value: string;
  source: string;
  destination: string;
  success: boolean;
  inMsg: any;
  outMsgs: any[];
}

export interface ChainStackFeeEstimate {
  estimatedFee: string;
  recommendedFee: string;
  formattedFee: string;
  formattedRecommended: string;
  operationType: string;
  fallback?: boolean;
  chainstackPowered?: boolean;
}

export interface ChainStackMarketData {
  network: {
    name: string;
    isTestnet: boolean;
    blockHeight: number;
    blockTime: number;
    validators?: number;
  };
  market: {
    price: number | null;
    currency: string;
    lastUpdated: string;
  };
  blockchain: {
    avgBlockTime: number;
    tps: number;
    activeAddresses?: number;
    totalTransactions?: number;
  };
  chainstackPowered: boolean;
}

export class ChainStackTonService {
  
  /**
   * Get wallet balance using Chainstack's enhanced TON API
   */
  static async getWalletBalance(
    address: Address | string, 
    isTestnet: boolean = false
  ): Promise<ChainStackTonBalance> {
    const addressString = typeof address === 'string' ? address : address.toString();
    
    const { data, error } = await supabase.functions.invoke('ton-wallet-balance', {
      body: { address: addressString, isTestnet }
    });

    if (error) {
      throw new Error(`Chainstack balance fetch failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get detailed transaction history for an address
   */
  static async getTransactionHistory(
    address: Address | string,
    limit: number = 10,
    offset: number = 0,
    isTestnet: boolean = false
  ): Promise<{ transactions: ChainStackTransaction[]; total: number; address: string }> {
    const addressString = typeof address === 'string' ? address : address.toString();
    
    const { data, error } = await supabase.functions.invoke('ton-transaction-history', {
      body: { address: addressString, limit, offset, isTestnet }
    });

    if (error) {
      throw new Error(`Chainstack transaction history failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Estimate transaction fees using Chainstack's advanced fee estimation
   */
  static async estimateFee(
    fromAddress: Address | string,
    toAddress: Address | string, 
    amount: bigint,
    operationType: string = 'transfer',
    isTestnet: boolean = false
  ): Promise<ChainStackFeeEstimate> {
    const fromAddressString = typeof fromAddress === 'string' ? fromAddress : fromAddress.toString();
    const toAddressString = typeof toAddress === 'string' ? toAddress : toAddress.toString();
    
    const { data, error } = await supabase.functions.invoke('ton-fee-estimation', {
      body: { 
        fromAddress: fromAddressString,
        toAddress: toAddressString,
        amount: amount.toString(),
        operationType,
        isTestnet
      }
    });

    if (error) {
      console.warn('Chainstack fee estimation failed, using fallback:', error);
      return {
        estimatedFee: '50000000', // 0.05 TON
        recommendedFee: '60000000', // 0.06 TON
        formattedFee: '0.050000',
        formattedRecommended: '0.060000',
        operationType,
        fallback: true,
        chainstackPowered: false
      };
    }

    return data;
  }

  /**
   * Get current market data and network statistics
   */
  static async getMarketData(isTestnet: boolean = false): Promise<ChainStackMarketData> {
    const { data, error } = await supabase.functions.invoke('ton-market-data', {
      body: { isTestnet }
    });

    if (error) {
      throw new Error(`Chainstack market data failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if Chainstack services are available
   */
  static async healthCheck(isTestnet: boolean = false): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Use a simple call to test connectivity
      await this.getMarketData(isTestnet);
      const latency = Date.now() - startTime;
      
      return { healthy: true, latency };
    } catch (error) {
      return { 
        healthy: false, 
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Utility: Format nanotons to TON
   */
  static formatNanotons(nanotons: string | bigint): string {
    const amount = typeof nanotons === 'string' ? BigInt(nanotons) : nanotons;
    return (Number(amount) / 1e9).toFixed(6);
  }

  /**
   * Utility: Parse TON to nanotons
   */
  static parseToNanotons(ton: number | string): bigint {
    const tonAmount = typeof ton === 'string' ? parseFloat(ton) : ton;
    return BigInt(Math.floor(tonAmount * 1e9));
  }
}

// Export singleton instance
export const chainstackTonService = new ChainStackTonService();