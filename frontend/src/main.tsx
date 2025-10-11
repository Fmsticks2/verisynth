import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { wagmiConfig, chains } from './wagmi.ts'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} theme={lightTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
)