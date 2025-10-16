import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Dataset, GeneratedDataset } from '../types';
import { useContractRead, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import { MARKETPLACE_CONFIG } from '../utils/marketplaceConfig';
import { GOVERNANCE_CONFIG } from '../utils/governanceConfig';

interface AnalyticsProps {
  datasets: Dataset[];
  lastGenerated?: GeneratedDataset | null;
}

const Analytics: React.FC<AnalyticsProps> = ({ datasets, lastGenerated }) => {
  const totalDatasets = datasets.length;
  const avgRecords = lastGenerated ? lastGenerated.metadata.recordCount : 0;
  const qualityScore = lastGenerated?.metadata.quality?.score ?? null;
  const topic = lastGenerated?.metadata.topic ?? 'n/a';

  // On-chain metrics
  const publicClient = usePublicClient();
  const { data: chainTotalDatasets } = useContractRead({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getTotalDatasets',
  });

  const { data: proposalCount } = useContractRead({
    address: GOVERNANCE_CONFIG.address,
    abi: GOVERNANCE_CONFIG.abi as any,
    functionName: 'getProposalCount',
  });

  const [onChainStats, setOnChainStats] = useState({
    totalOnChain: 0,
    activeListings: 0,
    totalPurchases: 0,
    proposals: 0,
    activeProposals: 0,
    lastDatasetTs: 0,
  });

  useEffect(() => {
    async function loadChainStats() {
      try {
        const total = Number(chainTotalDatasets || 0);
        const proposals = Number(proposalCount || 0);
        let activeListings = 0;
        let totalPurchases = 0;
        let lastDatasetTs = 0;

        // Fetch last dataset timestamp if any
        if (total > 0) {
          try {
            const last = await publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'getDataset',
              args: [BigInt(total)],
            });
            // last.timestamp at index 6 in struct order
            lastDatasetTs = Number((last as any).timestamp ?? 0);
          } catch (_) {}
        }

        // Loop through datasets to aggregate marketplace metrics (small N on testnet)
        for (let i = 1; i <= total && i <= 200; i++) {
          try {
            const listed = await publicClient.readContract({
              address: MARKETPLACE_CONFIG.address,
              abi: MARKETPLACE_CONFIG.abi as any,
              functionName: 'isListed',
              args: [BigInt(i)],
            });
            if (listed) activeListings += 1;
          } catch (_) {}
          try {
            const purchaseCount = await publicClient.readContract({
              address: MARKETPLACE_CONFIG.address,
              abi: MARKETPLACE_CONFIG.abi as any,
              functionName: 'getPurchaseCount',
              args: [BigInt(i)],
            });
            totalPurchases += Number(purchaseCount || 0);
          } catch (_) {}
        }

        // Governance: count active proposals
        let activeProposals = 0;
        for (let p = 1; p <= proposals && p <= 200; p++) {
          try {
            const prop = await publicClient.readContract({
              address: GOVERNANCE_CONFIG.address,
              abi: GOVERNANCE_CONFIG.abi as any,
              functionName: 'getProposal',
              args: [BigInt(p)],
            });
            if (prop && !(prop as any).closed) activeProposals += 1;
          } catch (_) {}
        }

        setOnChainStats({
          totalOnChain: total,
          activeListings,
          totalPurchases,
          proposals,
          activeProposals,
          lastDatasetTs,
        });
      } catch (err) {
        // swallow errors
      }
    }
    loadChainStats();
  }, [publicClient, chainTotalDatasets, proposalCount]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-xl">
            <Icon icon="ph:chart-bar" className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-500">Insights across synthetic datasets</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Total datasets (session)</p>
            <p className="text-2xl font-bold text-gray-900">{totalDatasets}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Avg records (last)</p>
            <p className="text-2xl font-bold text-gray-900">{avgRecords}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Quality score (last)</p>
            <p className="text-2xl font-bold text-gray-900">{qualityScore !== null ? qualityScore.toFixed(2) : '—'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Topic (last)</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{topic}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 p-3 rounded-xl">
            <Icon icon="ph:gauge" className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">On-chain Metrics</h2>
            <p className="text-gray-500">Live telemetry from 0G testnet</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Total datasets (on-chain)</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.totalOnChain}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Active listings</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.activeListings}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Total purchases</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.totalPurchases}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Proposals</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.proposals}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Active proposals</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.activeProposals}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">Last dataset (timestamp)</p>
            <p className="text-2xl font-bold text-gray-900">{onChainStats.lastDatasetTs ? new Date(onChainStats.lastDatasetTs * 1000).toLocaleString() : '—'}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="ph:trend-up" className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enterprise Metrics</h3>
            <p className="text-sm text-gray-600">Future: organization-wide KPIs and on-chain telemetry</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Dataset throughput, latency, and availability</li>
          <li>• Topic distribution and usage patterns</li>
          <li>• Quality trends and anomaly detection</li>
          <li>• Governance activity and marketplace performance</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default Analytics;