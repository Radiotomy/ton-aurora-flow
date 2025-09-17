/**
 * TON Sites integration hook
 * Handles TON proxy sites, domain resolution, and site configuration
 */

import { useState, useEffect, useCallback } from 'react';
import { tonDnsService } from '@/services/tonDnsService';
import { APP_CONFIG } from '@/config/production';
import { toast } from 'sonner';

interface TonSiteState {
  isTonDomain: boolean;
  currentDomain: string;
  isProxyMode: boolean;
  siteConfig: any;
  isLoading: boolean;
}

export const useTonSites = () => {
  const [siteState, setSiteState] = useState<TonSiteState>({
    isTonDomain: false,
    currentDomain: '',
    isProxyMode: false,
    siteConfig: null,
    isLoading: true
  });

  // Initialize TON Sites functionality
  useEffect(() => {
    const initializeTonSites = async () => {
      try {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
        const isTonDomain = tonDnsService.isTonDomain(currentDomain);
        
        let siteConfig = null;
        if (isTonDomain) {
          siteConfig = await tonDnsService.getTonSiteConfig(currentDomain);
        }

        setSiteState({
          isTonDomain,
          currentDomain,
          isProxyMode: isTonDomain,
          siteConfig,
          isLoading: false
        });

        // Log TON Sites status for debugging
        if (APP_CONFIG.FEATURES.TON_SITES) {
          console.log('TON Sites initialized:', {
            domain: currentDomain,
            isTonDomain,
            hasConfig: !!siteConfig
          });
        }
      } catch (error) {
        console.error('Error initializing TON Sites:', error);
        setSiteState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (APP_CONFIG.FEATURES.TON_SITES) {
      initializeTonSites();
    } else {
      setSiteState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Handle domain navigation for TON sites
  const navigateToTonDomain = useCallback(async (domain: string) => {
    try {
      if (!tonDnsService.isValidTonDomain(domain)) {
        toast.error('Invalid TON domain format');
        return false;
      }

      const siteConfig = await tonDnsService.getTonSiteConfig(domain);
      if (!siteConfig) {
        toast.error('TON domain not found or not configured');
        return false;
      }

      // In a real TON Sites implementation, this would navigate through TON proxy
      // For now, we'll redirect to the fallback URL
      const fallbackUrl = tonDnsService.getWebUrl(domain);
      window.location.href = fallbackUrl;
      
      return true;
    } catch (error) {
      console.error('Error navigating to TON domain:', error);
      toast.error('Failed to navigate to TON domain');
      return false;
    }
  }, []);

  // Check if feature is enabled
  const isEnabled = APP_CONFIG.FEATURES.TON_SITES;

  // Generate TON Sites manifest
  const generateManifest = useCallback(() => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    return {
      url: currentOrigin,
      name: "AudioTon - Web3 Music Platform",
      description: "Stream, discover, and collect music on the TON blockchain",
      iconUrl: `${currentOrigin}/favicon.ico`,
      backgroundColor: "#0A0A0B",
      themeColor: "#8B5CF6",
      tonSite: {
        bagId: APP_CONFIG.TON_SITES?.SITE_BAG_ID,
        proxyUrl: currentOrigin,
        fallbackUrls: APP_CONFIG.TON_SITES?.BACKUP_URLS || []
      }
    };
  }, []);

  // Get the app's TON domain
  const getAppTonDomain = useCallback(() => {
    return APP_CONFIG.TON_SITES?.DOMAIN || 'audioton.ton';
  }, []);

  // Check if current context supports TON Sites
  const getTonSitesSupport = useCallback(() => {
    return {
      enabled: isEnabled,
      proxyMode: siteState.isProxyMode,
      dnsResolution: APP_CONFIG.FEATURES.TON_DNS,
      domainRegistration: APP_CONFIG.FEATURES.TON_DNS
    };
  }, [isEnabled, siteState.isProxyMode]);

  return {
    // State
    ...siteState,
    isEnabled,
    
    // Actions
    navigateToTonDomain,
    generateManifest,
    getAppTonDomain,
    getTonSitesSupport,
    
    // Utilities
    isTonDomain: tonDnsService.isTonDomain,
    isValidTonDomain: tonDnsService.isValidTonDomain,
    resolveDomain: tonDnsService.resolveTonDomain,
  };
};

export default useTonSites;