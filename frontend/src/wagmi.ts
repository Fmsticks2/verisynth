import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { hardhat, sepolia, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { NETWORK_CONFIG } from './utils/contractConfig';

// Define 0G custom chain
const ogTestnet = {
  id: NETWORK_CONFIG.ogTestnet.chainId,
  name: NETWORK_CONFIG.ogTestnet.name,
  network: '0g-testnet',
  nativeCurrency: NETWORK_CONFIG.ogTestnet.nativeCurrency,
  rpcUrls: {
    default: {
      http: [NETWORK_CONFIG.ogTestnet.rpcUrl],
    },
    public: {
      http: [NETWORK_CONFIG.ogTestnet.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: NETWORK_CONFIG.ogTestnet.blockExplorer,
    },
  },
  testnet: true,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    ogTestnet, // Put 0G first to make it the default
    hardhat,
    sepolia,
    polygonMumbai,
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'VeriSynth',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };