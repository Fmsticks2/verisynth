import type { PublicClient } from 'wagmi';
import { NETWORK_CONFIG, CONTRACT_CONFIG } from './contractConfig';

// Fetch entropy from 0G network by reading latest block hash and timestamp.
// Optionally mixes in on-chain state to diversify entropy.
export async function getOgEntropy(publicClient: PublicClient): Promise<string> {
  try {
    const block = await publicClient.getBlock();
    const parts = [
      block.hash ?? '',
      String(block.number ?? ''),
      String(block.timestamp ?? ''),
      NETWORK_CONFIG.ogTestnet.chainId.toString(),
    ];

    // Mix in contract state when available for additional variability
    try {
      const total = await publicClient.readContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'getTotalDatasets',
      });
      parts.push(String(total));
    } catch (_) {
      // ignore if contract call fails
    }

    return parts.join(':');
  } catch (err) {
    // Fallback to time-based entropy if block fetch fails
    return `${Date.now()}:${Math.random()}:${NETWORK_CONFIG.ogTestnet.chainId}`;
  }
}

// Optional remote advanced generation hook. If VITE_OG_COMPUTE_URL is set,
// we will attempt to call it with payload; otherwise returns null.
export async function invokeOgAdvancedGenerate(payload: Record<string, unknown>): Promise<any | null> {
  const url = (import.meta as any)?.env?.VITE_OG_COMPUTE_URL || '';
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}