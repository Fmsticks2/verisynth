import * as React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const Governance: React.FC = () => {
  const proposals = [
    { id: 1, title: 'Add quality threshold to marketplace listings', status: 'Upcoming' },
    { id: 2, title: 'Enable revenue sharing for dataset creators', status: 'Discussion' },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-teal-100 to-green-100 p-3 rounded-xl">
            <Icon icon="ph:hand-waving" className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Decentralized Governance</h2>
            <p className="text-gray-500">Proposals, voting, and protocol upgrades</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Create Proposal</h3>
            <p className="text-sm text-gray-600">Future: stake-backed proposal creation with quorum enforcement.</p>
            <button className="btn-secondary mt-3">
              <Icon icon="ph:plus-circle" className="w-5 h-5 mr-2" />
              New Proposal
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Voting</h3>
            <p className="text-sm text-gray-600">Future: weighted voting and on-chain execution.</p>
            <button className="btn-primary mt-3">
              <Icon icon="ph:checks" className="w-5 h-5 mr-2" />
              Vote Now
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="ph:megaphone" className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Proposals</h3>
            <p className="text-sm text-gray-600">Community-driven improvements</p>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {proposals.map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between">
              <span className="text-gray-900 font-medium">{p.title}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{p.status}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default Governance;