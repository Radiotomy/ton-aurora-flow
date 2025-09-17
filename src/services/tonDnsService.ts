/**
 * TON DNS Service for resolving .ton domains and TON Sites functionality
 * Integrates with TON blockchain DNS resolution and TON Sites protocol
 */

import { Address } from '@ton/core';

interface TonDnsRecord {
  address?: string;
  site?: string;
  storage?: string;
  wallet?: string;
  next_resolver?: string;
}

interface TonSiteConfig {
  domain: string;
  address: string;
  isActive: boolean;
  expiresAt?: Date;
  metadata?: {
    title: string;
    description: string;
    icon: string;
    keywords: string[];
  };
}

export class TonDnsService {
  private static instance: TonDnsService;
  private apiUrl = 'https://toncenter.com/api/v2';
  private dnsCache = new Map<string, { data: TonDnsRecord; timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TonDnsService {
    if (!TonDnsService.instance) {
      TonDnsService.instance = new TonDnsService();
    }
    return TonDnsService.instance;
  }

  /**
   * Resolve a .ton domain to its DNS records
   */
  async resolveTonDomain(domain: string): Promise<TonDnsRecord | null> {
    try {
      // Normalize domain (remove .ton suffix if present, add it back)
      const normalizedDomain = domain.replace(/\.ton$/, '');
      const fullDomain = `${normalizedDomain}.ton`;
      
      // Check cache first
      const cached = this.dnsCache.get(fullDomain);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // In production, this would call the actual TON DNS resolver
      // For now, we'll simulate with a mock response and check our database
      console.log(`Resolving TON domain: ${fullDomain}`);
      
      // Mock data for development - in production, replace with actual DNS calls
      const mockRecord: TonDnsRecord = {
        address: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
        site: 'https://audioton.ton',
        wallet: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
      };

      // Cache the result
      this.dnsCache.set(fullDomain, {
        data: mockRecord,
        timestamp: Date.now()
      });

      return mockRecord;
    } catch (error) {
      console.error('Error resolving TON domain:', error);
      return null;
    }
  }

  /**
   * Register a .ton domain for a wallet address
   */
  async registerTonDomain(domain: string, walletAddress: string): Promise<boolean> {
    try {
      // Validate wallet address
      Address.parse(walletAddress);
      
      // Normalize domain
      const normalizedDomain = domain.replace(/\.ton$/, '');
      
      // In production, this would interact with TON DNS smart contract
      console.log(`Registering ${normalizedDomain}.ton for ${walletAddress}`);
      
      // For development, we'll just return success
      // In production, implement actual domain registration logic
      return true;
    } catch (error) {
      console.error('Error registering TON domain:', error);
      return false;
    }
  }

  /**
   * Get TON Site configuration for a domain
   */
  async getTonSiteConfig(domain: string): Promise<TonSiteConfig | null> {
    try {
      const dnsRecord = await this.resolveTonDomain(domain);
      if (!dnsRecord?.site) return null;

      return {
        domain,
        address: dnsRecord.address || '',
        isActive: true,
        metadata: {
          title: 'AudioTon - Web3 Music Platform',
          description: 'Stream, discover, and collect music on the TON blockchain',
          icon: '/favicon.ico',
          keywords: ['music', 'web3', 'ton', 'nft', 'streaming']
        }
      };
    } catch (error) {
      console.error('Error getting TON Site config:', error);
      return null;
    }
  }

  /**
   * Check if current domain is a .ton domain
   */
  isTonDomain(domain: string): boolean {
    return domain.endsWith('.ton');
  }

  /**
   * Get the regular web URL for a .ton domain
   */
  getWebUrl(tonDomain: string): string {
    const normalizedDomain = tonDomain.replace(/\.ton$/, '');
    
    // Map known TON domains to their web equivalents
    const domainMap: Record<string, string> = {
      'audioton': 'https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com',
    };

    return domainMap[normalizedDomain] || `https://${normalizedDomain}.lovableproject.com`;
  }

  /**
   * Get TON domain for current app
   */
  getAppTonDomain(): string {
    return 'audioton.ton';
  }

  /**
   * Clear DNS cache
   */
  clearCache(): void {
    this.dnsCache.clear();
  }

  /**
   * Validate TON domain format
   */
  isValidTonDomain(domain: string): boolean {
    const normalizedDomain = domain.replace(/\.ton$/, '');
    
    // Basic validation: alphanumeric and hyphens, 3-63 characters
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/;
    return domainRegex.test(normalizedDomain);
  }
}

// Export singleton instance
export const tonDnsService = TonDnsService.getInstance();

// Utility functions
export const resolveTonDomain = (domain: string) => tonDnsService.resolveTonDomain(domain);
export const registerTonDomain = (domain: string, address: string) => tonDnsService.registerTonDomain(domain, address);
export const isTonDomain = (domain: string) => tonDnsService.isTonDomain(domain);
export const getAppTonDomain = () => tonDnsService.getAppTonDomain();