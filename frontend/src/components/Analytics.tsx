import * as React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Dataset, GeneratedDataset } from '../types';

interface AnalyticsProps {
  datasets: Dataset[];
  lastGenerated?: GeneratedDataset | null;
}

const Analytics: React.FC<AnalyticsProps> = ({ datasets, lastGenerated }) => {
  const totalDatasets = datasets.length;
  const avgRecords = lastGenerated ? lastGenerated.metadata.recordCount : 0;
  const qualityScore = lastGenerated?.metadata.quality?.score ?? null;
  const topic = lastGenerated?.metadata.topic ?? 'n/a';

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