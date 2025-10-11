import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { hardhat, sepolia, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    hardhat,
    sepolia,
    polygonMumbai,
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'VeriSynth',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };