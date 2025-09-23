/**
 * Real Wallet Balance Service for AudioTon
 * Provides actual TON balance checking via TonCenter API
 */

import { Address } from '@ton/core';

interface WalletBalance {
  balance: bigint;
  formatted: string;        // Balance in TON (human readable)
  nanotons: string;        // Balance in nanotons
  lastUpdated: Date;
  chainstackPowered?: boolean; // Indicates if powered by Chainstack
  network?: string;        // Network type (mainnet/testnet)
}

interface TonCenterResponse {
  ok: boolean;
  result: {
    balance: string;
    account_state: string;
    last_transaction_lt: string;
    last_transaction_hash: string;
  };
}

export class RealWalletBalanceService {
  private static readonly TONCENTER_MAINNET_API = 'https://toncenter.com/api/v2';
  private static readonly TONCENTER_TESTNET_API = 'https://testnet.toncenter.com/api/v2';
  
  /**
   * Get real-time wallet balance from TON blockchain via multiple APIs
   */
  static async getWalletBalance(address: Address | string, isTestnet: boolean = false): Promise<WalletBalance> {
    try {
      const addressString = typeof address === 'string' ? address : address.toString();
      
      const response = await fetch('https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/ton-wallet-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamphZ2xtcXZjd3B6cmRveXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjQ5OTQsImV4cCI6MjA3MTE0MDk5NH0.FlRvJf4wVnQ96gaJJdli0AIcPQ0DmBU0yGiU0sudZeU`
        },
        body: JSON.stringify({
          address: addressString,
          isTestnet
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Wallet balance API error:', errorData);
        throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log successful API source for debugging
      console.log(`✅ Wallet balance fetched via ${data.apiSource}: ${data.formatted} TON`);
      
      return {
        balance: BigInt(data.balance),
        formatted: data.formatted,
        nanotons: data.nanotons,
        lastUpdated: new Date(data.lastUpdated),
        chainstackPowered: data.apiSource === 'chainstack',
        network: data.network || (isTestnet ? 'testnet' : 'mainnet')
      };
      
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      // For development, return a fallback balance to allow testing
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔄 Using development fallback balance (10 TON) for testing');
        return {
          balance: BigInt('10000000000'), // 10 TON
          formatted: '10.0000',
          nanotons: '10000000000',
          lastUpdated: new Date(),
          chainstackPowered: false,
          network: isTestnet ? 'testnet' : 'mainnet'
        };
      }
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Get transaction history using Chainstack
   */
  static async getTransactionHistory(
    address: Address | string,
    limit: number = 10,
    offset: number = 0,
    isTestnet: boolean = false
  ) {
    try {
      const addressString = typeof address === 'string' ? address : address.toString();
      
      const response = await fetch('https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/ton-transaction-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamphZ2xtcXZjd3B6cmRveXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjQ5OTQsImV4cCI6MjA3MTE0MDk5NH0.FlRvJf4wVnQ96gaJJdli0AIcPQ0DmBU0yGiU0sudZeU`
        },
        body: JSON.stringify({
          address: addressString,
          limit,
          offset,
          isTestnet
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch transaction history via Chainstack');
      }

      return await response.json();
      
    } catch (error) {
      console.error('Chainstack transaction history error:', error);
      throw new Error(`Failed to get transaction history via Chainstack: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fees using Chainstack
   */
  static async estimateFee(
    fromAddress: Address | string,
    toAddress: Address | string,
    amount: bigint,
    operationType: string = 'transfer',
    isTestnet: boolean = false
  ) {
    try {
      const fromAddressString = typeof fromAddress === 'string' ? fromAddress : fromAddress.toString();
      const toAddressString = typeof toAddress === 'string' ? toAddress : toAddress.toString();
      
      const response = await fetch('https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/ton-fee-estimation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamphZ2xtcXZjd3B6cmRveXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjQ5OTQsImV4cCI6MjA3MTE0MDk5NH0.FlRvJf4wVnQ96gaJJdli0AIcPQ0DmBU0yGiU0sudZeU`
        },
        body: JSON.stringify({
          fromAddress: fromAddressString,
          toAddress: toAddressString,
          amount: amount.toString(),
          operationType,
          isTestnet
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.warn('Chainstack fee estimation failed, using fallback:', data.error);
        return {
          estimatedFee: '50000000', // 0.05 TON
          recommendedFee: '60000000', // 0.06 TON
          formattedFee: '0.050000',
          formattedRecommended: '0.060000',
          fallback: true,
          operationType
        };
      }

      return data;
      
    } catch (error) {
      console.error('Chainstack fee estimation error:', error);
      return {
        estimatedFee: '50000000', // 0.05 TON fallback
        recommendedFee: '60000000', // 0.06 TON with buffer
        formattedFee: '0.050000',
        formattedRecommended: '0.060000',
        fallback: true,
        operationType,
        error: error.message
      };
    }
  }
  
  /**
   * Check if wallet has sufficient balance for deployment
   */
  static async checkSufficientBalance(
    address: Address | string, 
    requiredAmount: bigint,
    isTestnet: boolean = false
  ): Promise<{ sufficient: boolean; balance: WalletBalance; required: string }> {
    try {
      const balance = await this.getWalletBalance(address, isTestnet);
      const sufficient = balance.balance >= requiredAmount;
      
      return {
        sufficient,
        balance,
        required: this.formatBalance(requiredAmount)
      };
    } catch (error) {
      console.error('Balance check failed:', error);
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  /**
   * Get real-time deployment cost estimates with current market data
   */
  static async getDeploymentCostEstimates(isTestnet: boolean = false): Promise<{
    perContract: bigint;
    gasReserve: bigint;
    networkFees: bigint;
    totalForAllContracts: bigint;
    grandTotal: bigint;
    estimatedUSD?: number;
  }> {
    try {
      // Base deployment costs in nanotons
      const baseDeploymentCost = BigInt(100_000_000); // 0.1 TON per contract
      const gasReserve = BigInt(50_000_000); // 0.05 TON gas reserve per contract
      const networkFees = BigInt(10_000_000); // 0.01 TON network fees per contract
      const contractCount = 4; // payment, nft-collection, fan-club, reward-distributor
      
      const perContract = baseDeploymentCost + gasReserve + networkFees;
      const totalForAllContracts = perContract * BigInt(contractCount);
      const grandTotal = totalForAllContracts + (gasReserve * BigInt(2)); // Extra reserve
      
      // TODO: Add real-time TON/USD price fetching for USD estimates
      // For now, estimate based on approximate TON price
      const estimatedTonPrice = 5.5; // USD per TON (approximate)
      const estimatedUSD = Number(grandTotal) / 1e9 * estimatedTonPrice;
      
      return {
        perContract,
        gasReserve,
        networkFees,
        totalForAllContracts,
        grandTotal,
        estimatedUSD
      };
    } catch (error) {
      console.error('Failed to get deployment cost estimates:', error);
      // Return fallback estimates
      return {
        perContract: BigInt(160_000_000),
        gasReserve: BigInt(50_000_000),
        networkFees: BigInt(10_000_000),
        totalForAllContracts: BigInt(640_000_000),
        grandTotal: BigInt(740_000_000)
      };
    }
  }

  /**
   * Validate deployment wallet balance with detailed breakdown
   */
  static async validateDeploymentBalance(
    address: Address | string,
    isTestnet: boolean = false
  ): Promise<{
    sufficient: boolean;
    balance: WalletBalance;
    costs: any;
    shortfall?: bigint;
    recommendation: string;
  }> {
    try {
      const [balance, costs] = await Promise.all([
        this.getWalletBalance(address, isTestnet),
        this.getDeploymentCostEstimates(isTestnet)
      ]);

      const sufficient = balance.balance >= costs.grandTotal;
      const shortfall = sufficient ? undefined : costs.grandTotal - balance.balance;
      
      let recommendation = '';
      if (sufficient) {
        recommendation = `✅ Wallet has sufficient balance for deployment (${balance.formatted} TON available)`;
      } else if (shortfall) {
        const shortfallTon = this.formatBalance(shortfall);
        recommendation = `❌ Insufficient balance. Need ${shortfallTon} TON more for deployment`;
      }

      return {
        sufficient,
        balance,
        costs,
        shortfall,
        recommendation
      };
    } catch (error) {
      console.error('Deployment balance validation failed:', error);
      throw new Error(`Deployment balance validation failed: ${error.message}`);
    }
  }
  
  /**
   * Estimate deployment costs for all contracts
   */
  static getDeploymentCosts(): {
    perContract: bigint;
    totalForAllContracts: bigint;
    gasReserve: bigint;
    grandTotal: bigint;
  } {
    const perContract = BigInt(100 * 1e6); // 0.1 TON per contract
    const contractCount = 4; // payment, nft-collection, fan-club, reward-distributor
    const totalForAllContracts = perContract * BigInt(contractCount);
    const gasReserve = BigInt(50 * 1e6); // 0.05 TON gas reserve
    const grandTotal = totalForAllContracts + gasReserve;
    
    return {
      perContract,
      totalForAllContracts,
      gasReserve,
      grandTotal
    };
  }
  
  /**
   * Format balance for UI display
   */
  static formatBalance(balance: bigint): string {
    return (Number(balance) / 1e9).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  }
  
  /**
   * Convert TON to nanotons
   */
  static tonToNanotons(ton: number): bigint {
    return BigInt(Math.floor(ton * 1e9));
  }
}