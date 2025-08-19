import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  return (
    <TonConnectUIProvider 
      manifestUrl="https://082eb0ee-579e-46a8-a35f-2d335fe4e344.sandbox.lovable.dev/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: 'https://082eb0ee-579e-46a8-a35f-2d335fe4e344.sandbox.lovable.dev'
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};