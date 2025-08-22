import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Use static manifest for now - dynamic endpoint can be added later if needed
  const manifestUrl = `${currentOrigin}/tonconnect-manifest.json`;
  
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