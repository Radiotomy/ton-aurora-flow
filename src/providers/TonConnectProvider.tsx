import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { APP_CONFIG } from '@/config/production';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Check if we're actually on a TON domain (not just feature enabled)
  const isTonSite = typeof window !== 'undefined' && 
    window.location.hostname.endsWith('.ton');
  
  // Use dynamic Supabase edge function manifest that adapts to deployment environment
  // Pass the current origin as a parameter to ensure correct domain matching
  const manifestUrl = `https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/tonconnect-manifest?origin=${encodeURIComponent(currentOrigin)}`;
  
  // For TON Sites, we also generate a TON Site specific manifest
  const tonSiteManifestUrl = `https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/ton-site-manifest?origin=${encodeURIComponent(currentOrigin)}&ton=true`;
  
  // Add error handling for TON Connect
  React.useEffect(() => {
    const handleTonConnectError = (event: ErrorEvent) => {
      if (event.message?.includes('postMessage') || event.message?.includes('target origin')) {
        // Suppress TON Connect postMessage errors that don't affect functionality
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleTonConnectError);
    return () => window.removeEventListener('error', handleTonConnectError);
  }, []);

  // Log TON Sites status for debugging
  React.useEffect(() => {
    if (APP_CONFIG.FEATURES?.TON_SITES) {
      console.log('TON Connect initialized with TON Sites support:', {
        isTonSite,
        manifest: manifestUrl,
        tonSiteManifest: isTonSite ? tonSiteManifestUrl : undefined,
        origin: currentOrigin
      });
    }
  }, [isTonSite, manifestUrl, tonSiteManifestUrl, currentOrigin]);
  
  return (
    <TonConnectUIProvider 
      manifestUrl={isTonSite ? tonSiteManifestUrl : manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: currentOrigin as `${string}://${string}`
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};