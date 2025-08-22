import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <TonConnectUIProvider 
      manifestUrl={`${currentOrigin}/tonconnect-manifest.json`}
      actionsConfiguration={{
        twaReturnUrl: currentOrigin as `${string}://${string}`
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};