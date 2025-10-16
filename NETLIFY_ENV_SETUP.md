# Netlify Environment Variables Setup for VeriSynth

This document provides instructions for configuring environment variables in Netlify for deploying the VeriSynth frontend to work with the 0G testnet.

## Setting Up Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your VeriSynth site
3. Navigate to **Site settings** > **Environment variables**
4. Add the following environment variables:

### Required 0G Network Configuration

```
VITE_OG_RPC_URL = https://evmrpc-testnet.0g.ai
VITE_OG_CHAIN_ID = 16602
VITE_OG_INDEXER_URL = https://indexer-testnet.0g.ai
VITE_OG_STORAGE_URL = https://rpc-storage-testnet.0g.ai
VITE_OG_BLOCK_EXPLORER_URL = https://chainscan-galileo.0g.ai
VITE_OG_CHAIN_NAME = 0G-Galileo-Testnet
VITE_OG_NATIVE_CURRENCY_NAME = OG
VITE_OG_NATIVE_CURRENCY_SYMBOL = OG
VITE_OG_NATIVE_CURRENCY_DECIMALS = 18
```

### Required Application Configuration

```
VITE_WALLETCONNECT_PROJECT_ID = your_walletconnect_project_id_here
VITE_APP_NAME = VeriSynth
VITE_APP_DESCRIPTION = Verifiable Synthetic Data Generation and Verification
VITE_NODE_ENV = production
VITE_PINATA_GATEWAY_URL = https://gateway.pinata.cloud
```

### Contract Addresses (Update after deployment)

```
VITE_DATASET_REGISTRY_ADDRESS = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_DATASET_REGISTRY_ADDRESS_OG = your_deployed_contract_address_on_0g_testnet
```

## Deployment Steps

1. **Deploy Smart Contract to 0G Testnet:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network ogTestnet
   ```

2. **Update Contract Address:**
   - Copy the deployed contract address
   - Update `VITE_DATASET_REGISTRY_ADDRESS_OG` in Netlify environment variables
   - Alternatively, configure addresses in `frontend/src/utils/contractConfig.ts`

3. **Deploy Frontend:**
   - Push your code to your connected Git repository
   - Netlify will automatically build and deploy using the configuration in `netlify.toml`

## Build Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Node.js version: 18
- SPA redirect rules
- Functions directory: `netlify/functions`

## Important Notes

- Never commit sensitive keys or private keys to your repository
- The WalletConnect Project ID is required for wallet connections
- Update contract addresses after deploying to 0G testnet
- Client-visible variables must be prefixed with `VITE_` (e.g., `VITE_PINATA_GATEWAY_URL`).
- Server-only variables for uploads must NOT be prefixed with `VITE_` and should be configured in Netlify:
  - `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_SECRET_API_KEY`