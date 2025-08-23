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