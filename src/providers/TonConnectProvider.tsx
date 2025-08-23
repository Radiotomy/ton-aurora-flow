import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Use dynamic Supabase edge function manifest that adapts to deployment environment
  // Pass the current origin as a parameter to ensure correct domain matching
  const manifestUrl = `https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/tonconnect-manifest?origin=${encodeURIComponent(currentOrigin)}`;
  
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
  
  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: currentOrigin as `${string}://${string}`
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};