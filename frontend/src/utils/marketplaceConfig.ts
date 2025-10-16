// Auto-generated via Hardhat deploy script; Ensure DatasetMarketplace.json exists
import marketplaceDeployed from '../contracts/DatasetMarketplace.json';

export const MARKETPLACE_CONFIG = {
  address: (marketplaceDeployed as any).address as `0x${string}`,
  abi: (marketplaceDeployed as any).abi as readonly string[],
} as const;