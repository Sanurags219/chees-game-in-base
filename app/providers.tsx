'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { type ReactNode, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

export function Providers(props: { children: ReactNode }) {
  const [config] = useState(() => 
    createConfig({
      chains: [base],
      connectors: [
        coinbaseWallet({
          appName: 'BaseChess',
          preference: 'smartWalletOnly',
        }),
      ],
      ssr: true,
      transports: {
        [base.id]: http(),
      },
    })
  );
  
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {props.children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
