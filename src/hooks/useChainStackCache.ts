import { useState, useEffect, useCallback, useRef } from 'react';
import { ChainStackTonService } from '@/services/chainstackTonService';
import type { ChainStackTonBalance, ChainStackTransaction, ChainStackFeeEstimate, ChainStackMarketData } from '@/services/chainstackTonService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  balanceTTL: number;      // 10 seconds
  transactionsTTL: number; // 60 seconds
  feesTTL: number;        // 15 seconds
  marketDataTTL: number;  // 30 seconds
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  balanceTTL: 10 * 1000,
  transactionsTTL: 60 * 1000,
  feesTTL: 15 * 1000,
  marketDataTTL: 30 * 1000,
};

class ChainStackCache {
  private cache = new Map<string, CacheEntry<any>>();
  private activeRequests = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) return cached;

    // Check if request is already in progress
    const activeRequest = this.activeRequests.get(key);
    if (activeRequest) return activeRequest;

    // Make new request
    const request = fetchFn().then(data => {
      this.set(key, data, ttl);
      this.activeRequests.delete(key);
      return data;
    }).catch(error => {
      this.activeRequests.delete(key);
      throw error;
    });

    this.activeRequests.set(key, request);
    return request;
  }

  clear(): void {
    this.cache.clear();
    this.activeRequests.clear();
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

const chainStackCache = new ChainStackCache();

export const useChainStackCache = (config: Partial<CacheConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  const [stats, setStats] = useState(chainStackCache.getStats());
  
  const updateStats = useCallback(() => {
    setStats(chainStackCache.getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const getWalletBalance = useCallback(async (address: string, isTestnet = false): Promise<ChainStackTonBalance> => {
    const key = `balance:${address}:${isTestnet}`;
    return chainStackCache.getOrFetch(
      key,
      () => ChainStackTonService.getWalletBalance(address, isTestnet),
      fullConfig.balanceTTL
    );
  }, [fullConfig.balanceTTL]);

  const getTransactionHistory = useCallback(async (
    address: string, 
    limit = 10, 
    offset = 0, 
    isTestnet = false
  ) => {
    const key = `transactions:${address}:${limit}:${offset}:${isTestnet}`;
    return chainStackCache.getOrFetch(
      key,
      () => ChainStackTonService.getTransactionHistory(address, limit, offset, isTestnet),
      fullConfig.transactionsTTL
    );
  }, [fullConfig.transactionsTTL]);

  const estimateFee = useCallback(async (
    fromAddress: string,
    toAddress: string,
    amount: bigint,
    operationType = 'transfer',
    isTestnet = false
  ): Promise<ChainStackFeeEstimate> => {
    const key = `fee:${fromAddress}:${toAddress}:${amount}:${operationType}:${isTestnet}`;
    return chainStackCache.getOrFetch(
      key,
      () => ChainStackTonService.estimateFee(fromAddress, toAddress, amount, operationType, isTestnet),
      fullConfig.feesTTL
    );
  }, [fullConfig.feesTTL]);

  const getMarketData = useCallback(async (isTestnet = false): Promise<ChainStackMarketData> => {
    const key = `market:${isTestnet}`;
    return chainStackCache.getOrFetch(
      key,
      () => ChainStackTonService.getMarketData(isTestnet),
      fullConfig.marketDataTTL
    );
  }, [fullConfig.marketDataTTL]);

  const healthCheck = useCallback(async (isTestnet = false) => {
    // Health checks shouldn't be cached too aggressively
    const key = `health:${isTestnet}`;
    return chainStackCache.getOrFetch(
      key,
      () => ChainStackTonService.healthCheck(isTestnet),
      5000 // 5 seconds only
    );
  }, []);

  return {
    getWalletBalance,
    getTransactionHistory,
    estimateFee,
    getMarketData,
    healthCheck,
    clearCache: chainStackCache.clear.bind(chainStackCache),
    stats,
  };
};