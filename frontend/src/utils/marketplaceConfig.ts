// Auto-generated via Hardhat deploy script; Ensure DatasetMarketplace.json exists
import marketplaceDeployed from '../contracts/DatasetMarketplace.json';

const marketplaceAddressEnv = import.meta.env.VITE_DATASET_MARKETPLACE_ADDRESS_OG as `0x${string}` | undefined;

export const MARKETPLACE_CONFIG = {
  address: (marketplaceAddressEnv || (marketplaceDeployed as any).address) as `0x${string}`,
  abi: (marketplaceDeployed as any).abi as readonly string[],
} as const;