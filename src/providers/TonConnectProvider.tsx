import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({ children }) => {
  return (
    <TonConnectUIProvider 
      manifestUrl="https://cpjjaglmqvcwpzrdoyul.supabase.co/storage/v1/object/public/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/your_bot_name'
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};