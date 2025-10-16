// Auto-generated via Hardhat deploy script; Ensure Governance.json exists
import governanceDeployed from '../contracts/Governance.json';

export const GOVERNANCE_CONFIG = {
  address: (governanceDeployed as any).address as `0x${string}`,
  abi: (governanceDeployed as any).abi as readonly string[],
} as const;