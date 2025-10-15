import * as React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import DatasetHistory from './DatasetHistory';

const Marketplace: React.FC = () => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 p-3 rounded-xl">
            <Icon icon="ph:storefront" className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
            <p className="text-gray-500">Discover, trade, and curate synthetic datasets</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Curation & Listings</h3>
            <p className="text-sm text-gray-600">Browse curated datasets by topic, quality, and popularity.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Creator Tools</h3>
            <p className="text-sm text-gray-600">Register datasets, set pricing, and define license terms.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Buyer Experience</h3>
            <p className="text-sm text-gray-600">Preview samples, verify hashes, and purchase securely.</p>
          </div>
        </div>
      </motion.div>

      {/* On-chain Catalog (initially reusing History component for discovery) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="ph:squares-four" className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">On-chain Catalog</h3>
            <p className="text-sm text-gray-600">Recent datasets registered on-chain</p>
          </div>
        </div>
        <DatasetHistory />
      </motion.div>
    </div>
  );
};

export default Marketplace;