import * as React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Dataset } from '../types';

interface DatasetCardProps {
  dataset: Dataset;
  onVerify?: (id: number) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onVerify }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string, length: number = 12) => {
    return `${hash.slice(0, length)}...${hash.slice(-4)}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.3 }}
      className="card hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary-100 to-purple-100 p-2 rounded-lg">
            <Icon
              icon="mdi:database"
              className="w-5 h-5 text-primary-600"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Dataset #{dataset.id}
            </h3>
            <p className="text-sm text-gray-500">
              {dataset.modelVersion}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Icon
            icon="ic:baseline-verified"
            className="w-5 h-5 text-green-500"
          />
          <span className="text-sm font-medium text-green-600">
            Verified
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Seed
            </label>
            <p className="text-sm font-mono text-gray-900 mt-1">
              {dataset.seed}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Created
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(dataset.timestamp)}
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Data Hash
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-sm font-mono text-gray-900 flex-1">
              {truncateHash(dataset.dataHash)}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(dataset.dataHash)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy hash"
            >
              <Icon icon="ph:copy" className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            IPFS CID
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-sm font-mono text-gray-900 flex-1">
              {truncateHash(dataset.cid)}
            </p>
            <a
              href={`https://ipfs.io/ipfs/${dataset.cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="View on IPFS"
            >
              <Icon icon="ph:arrow-square-out" className="w-4 h-4 text-gray-500" />
            </a>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Owner
          </label>
          <p className="text-sm font-mono text-gray-900 mt-1">
            {truncateAddress(dataset.owner)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Icon icon="ph:clock" className="w-4 h-4" />
          <span>{formatDate(dataset.timestamp)}</span>
        </div>
        {onVerify && (
          <button
            onClick={() => onVerify(dataset.id)}
            className="btn-secondary text-sm py-2 px-4"
          >
            <Icon icon="ic:baseline-verified" className="w-4 h-4 mr-2" />
            Verify
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default DatasetCard;