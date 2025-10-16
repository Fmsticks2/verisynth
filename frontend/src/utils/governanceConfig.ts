// Auto-generated via Hardhat deploy script; Ensure Governance.json exists
import governanceDeployed from '../contracts/Governance.json';

const governanceAddressEnv = import.meta.env.VITE_GOVERNANCE_ADDRESS_OG as `0x${string}` | undefined;

export const GOVERNANCE_CONFIG = {
  address: (governanceAddressEnv || (governanceDeployed as any).address) as `0x${string}`,
  abi: (governanceDeployed as any).abi as readonly string[],
} as const;