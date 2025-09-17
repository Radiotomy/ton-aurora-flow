/**
 * TON Sites Router Component
 * Handles routing and redirects for TON domains and TON Sites functionality
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTonSites } from '@/hooks/useTonSites';
import { tonDnsService } from '@/services/tonDnsService';
import { toast } from 'sonner';

interface TonSitesRouterProps {
  children: React.ReactNode;
}

export const TonSitesRouter: React.FC<TonSitesRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTonDomain, currentDomain, isEnabled } = useTonSites();

  useEffect(() => {
    if (!isEnabled) return;

    const handleTonSiteRouting = async () => {
      try {
        // Handle .ton domain detection and routing
        if (isTonDomain) {
          console.log(`TON Site detected: ${currentDomain}`);
          
          // Verify the TON site configuration
          const siteConfig = await tonDnsService.getTonSiteConfig(currentDomain);
          if (!siteConfig) {
            console.warn(`No configuration found for TON site: ${currentDomain}`);
            toast.error('TON site configuration not found');
            return;
          }

          // TON Sites typically load with different parameters
          // Handle any special routing logic here
          if (location.pathname === '/' && location.search.includes('ton-site=true')) {
            // This is a TON Site entry point
            toast.success(`Welcome to ${currentDomain}! 🎵`, {
              description: 'You are now browsing via TON blockchain'
            });
          }
        }

        // Handle TON domain redirects from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const tonDomainRedirect = urlParams.get('ton-domain');
        
        if (tonDomainRedirect) {
          console.log(`Redirecting to TON domain: ${tonDomainRedirect}`);
          
          if (tonDnsService.isValidTonDomain(tonDomainRedirect)) {
            // In production, this would redirect through TON proxy
            const webUrl = tonDnsService.getWebUrl(tonDomainRedirect);
            window.location.href = `${webUrl}${location.pathname}${location.search.replace(/[?&]ton-domain=[^&]*/, '')}`;
          } else {
            toast.error('Invalid TON domain format');
            // Remove the invalid parameter
            navigate(location.pathname, { replace: true });
          }
        }

        // Handle fallback URLs for TON Sites
        const tonFallback = urlParams.get('ton-fallback');
        if (tonFallback === 'true' && !isTonDomain) {
          toast.info('Loaded fallback version', {
            description: 'TON Site unavailable, using web version'
          });
        }

      } catch (error) {
        console.error('Error in TON Sites routing:', error);
      }
    };

    handleTonSiteRouting();
  }, [location, isTonDomain, currentDomain, isEnabled, navigate]);

  // Provide TON Sites context to child components
  return <>{children}</>;
};

export default TonSitesRouter;