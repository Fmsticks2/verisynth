/// <reference types="vite/client" />

interface ImportMetaEnv {
  // WalletConnect Configuration
  readonly VITE_WALLETCONNECT_PROJECT_ID: string

  // Contract Addresses
  readonly VITE_DATASET_REGISTRY_ADDRESS: string
  readonly VITE_DATASET_REGISTRY_ADDRESS_SEPOLIA: string
  readonly VITE_DATASET_REGISTRY_ADDRESS_MUMBAI: string
  readonly VITE_DATASET_REGISTRY_ADDRESS_OG: string

  // 0G Network Configuration
  readonly VITE_OG_RPC_URL: string
  readonly VITE_OG_CHAIN_ID: string
  readonly VITE_OG_INDEXER_URL: string
  readonly VITE_OG_STORAGE_URL: string
  readonly VITE_OG_BLOCK_EXPLORER_URL: string
  readonly VITE_OG_CHAIN_NAME: string
  readonly VITE_OG_NATIVE_CURRENCY_NAME: string
  readonly VITE_OG_NATIVE_CURRENCY_SYMBOL: string
  readonly VITE_OG_NATIVE_CURRENCY_DECIMALS: string

  // Network RPC URLs
  readonly VITE_LOCALHOST_RPC_URL: string
  readonly VITE_SEPOLIA_RPC_URL: string
  readonly VITE_MUMBAI_RPC_URL: string

  // Chain IDs
  readonly VITE_LOCALHOST_CHAIN_ID: string
  readonly VITE_SEPOLIA_CHAIN_ID: string
  readonly VITE_MUMBAI_CHAIN_ID: string

  // IPFS Configuration
  readonly VITE_IPFS_GATEWAY_URL: string

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}