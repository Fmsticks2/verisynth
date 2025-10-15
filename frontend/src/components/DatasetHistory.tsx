import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAccount, useContractRead, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import { Dataset } from '../types';

const DatasetHistory: React.FC = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get dataset IDs for the connected user
  const { data: datasetIds, isError, isLoading: isLoadingIds } = useContractRead({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getDatasetsByOwner',
    args: address ? [address] : undefined,
    enabled: Boolean(address && isConnected),
  });

  // Fetch individual dataset details
  useEffect(() => {
    const fetchDatasetDetails = async () => {
      if (!datasetIds || !Array.isArray(datasetIds) || datasetIds.length === 0) {
        setDatasets([]);
        return;
      }

      setIsLoading(true);
      try {
        const datasetPromises = (datasetIds as bigint[]).map(async (id: bigint) => {
          try {
            const result: any = await publicClient.readContract({
              address: CONTRACT_CONFIG.address,
              abi: CONTRACT_CONFIG.abi,
              functionName: 'getDataset',
              args: [id],
            });
            return {
              id: Number(result.id ?? id),
              modelVersion: String(result.modelVersion ?? ''),
              seed: String(result.seed ?? ''),
              dataHash: String(result.dataHash ?? ''),
              cid: String(result.cid ?? ''),
              owner: String(result.owner ?? address ?? ''),
              timestamp: Number(result.timestamp ?? Date.now()),
            } as Dataset;
          } catch (err) {
            console.error('Failed to read dataset', id, err);
            return {
              id: Number(id),
              modelVersion: '',
              seed: '',
              dataHash: '',
              cid: '',
              owner: address || '',
              timestamp: Date.now(),
            } as Dataset;
          }
        });
        
        const fetchedDatasets = await Promise.all(datasetPromises);
        setDatasets(fetchedDatasets);
      } catch (error) {
        console.error('Error fetching dataset details:', error);
        setDatasets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasetDetails();
  }, [datasetIds, address]);

  const handleDownloadDataset = (dataset: Dataset) => {
    // Create a downloadable JSON file with dataset info
    const dataStr = JSON.stringify(dataset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_${dataset.id}_${dataset.seed}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewOnIPFS = (cid: string) => {
    window.open(`https://gateway.pinata.cloud/ipfs/${cid}`, '_blank');
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center py-8">
          <Icon icon="ph:wallet" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500">
            Please connect your wallet to view your dataset history.
          </p>
        </div>
      </motion.div>
    );
  }

  if (isLoadingIds || isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center py-8">
          <Icon icon="ph:spinner" className="w-8 h-8 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading your datasets...</p>
        </div>
      </motion.div>
    );
  }

  if (isError || datasets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center py-8">
          <Icon icon="ph:database" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Datasets Found</h3>
          <p className="text-gray-500">
            You haven't generated any datasets yet. Create your first dataset to get started!
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-xl">
          <Icon icon="ph:clock-clockwise" className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Dataset History</h2>
          <p className="text-gray-500">View and manage your previously generated datasets</p>
        </div>
      </div>

      <div className="grid gap-4">
        {datasets.map((dataset) => (
          <motion.div
            key={dataset.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card hover:shadow-xl transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg">
                    <Icon icon="ph:database" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dataset #{dataset.id}</h3>
                    <p className="text-sm text-gray-500">
                      Generated on {new Date(dataset.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <span className="ml-2 font-semibold">{dataset.modelVersion}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Seed:</span>
                    <span className="ml-2 font-mono text-xs">{dataset.seed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Hash:</span>
                    <span className="ml-2 font-mono text-xs">{dataset.dataHash.slice(0, 12)}...</span>
                  </div>
                  <div>
                    <span className="text-gray-500">IPFS:</span>
                    <span className="ml-2 font-mono text-xs">{dataset.cid.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleViewOnIPFS(dataset.cid)}
                  className="btn-secondary text-sm px-3 py-2"
                  title="View on IPFS"
                >
                  <Icon icon="ph:eye" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadDataset(dataset)}
                  className="btn-secondary text-sm px-3 py-2"
                  title="Download JSON"
                >
                  <Icon icon="ph:download" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DatasetHistory;