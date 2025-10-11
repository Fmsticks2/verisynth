import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractRead } from 'wagmi';
import { computeDataHash } from '../utils/dataGenerator';
import { Dataset, VerificationResult } from '../types';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import Modal from './Modal';

const VerifyPanel: React.FC = () => {
  const [datasetId, setDatasetId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ type: 'info', title: '', message: '' });

  // Fetch dataset from contract
  const { data: datasetData, isError: datasetError, refetch: refetchDataset } = useContractRead({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getDataset',
    args: datasetId ? [BigInt(parseInt(datasetId))] : undefined,
    enabled: Boolean(datasetId && !isNaN(parseInt(datasetId))),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setVerificationResult(null);
    }
  };

  const handleVerify = async () => {
    if (!datasetId || !uploadedFile) {
      setModalContent({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide both dataset ID and upload a file.',
      });
      setShowModal(true);
      return;
    }

    setIsVerifying(true);
    
    try {
      // Read and parse the uploaded file
      const fileContent = await uploadedFile.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON file format');
      }

      // Compute hash of uploaded data
      const computedHash = computeDataHash(parsedData);
      
      // Fetch dataset from blockchain
      await refetchDataset();
      
      if (datasetError || !datasetData) {
        throw new Error('Dataset not found on blockchain');
      }

      // Convert contract data to Dataset type
      const dataset: Dataset = {
        id: Number(datasetData.id),
        modelVersion: datasetData.modelVersion,
        seed: datasetData.seed,
        dataHash: datasetData.dataHash,
        cid: datasetData.cid,
        owner: datasetData.owner,
        timestamp: Number(datasetData.timestamp),
      };

      // Compare hashes
      const verified = dataset.dataHash === computedHash;
      
      const result: VerificationResult = {
        verified,
        onChainHash: dataset.dataHash,
        computedHash,
        dataset,
      };
      
      setVerificationResult(result);
      
      setModalContent({
        type: verified ? 'success' : 'error',
        title: verified ? 'Verification Successful' : 'Verification Failed',
        message: verified 
          ? 'The dataset matches the on-chain hash perfectly!'
          : 'The dataset does not match the on-chain hash. The data may have been modified.',
      });
      setShowModal(true);
      
    } catch (error) {
      setModalContent({
        type: 'error',
        title: 'Verification Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during verification.',
      });
      setShowModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const truncateHash = (hash: string, length: number = 12) => {
    return `${hash.slice(0, length)}...${hash.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-xl">
            <Icon icon="ic:baseline-verified" className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Verify Dataset</h2>
            <p className="text-gray-500">Verify the integrity of your synthetic dataset</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset ID
            </label>
            <input
              type="number"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="input-field"
              placeholder="Enter dataset ID (e.g., 1)"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Dataset File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <Icon icon="ph:upload-simple" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadedFile ? uploadedFile.name : 'Click to upload JSON file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JSON files only
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleVerify}
              disabled={!datasetId || !uploadedFile || isVerifying}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Icon icon="ph:spinner" className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Icon icon="ph:check-circle-bold" className="w-5 h-5 mr-2" />
                  Verify Dataset
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Verification Result */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-3 rounded-xl ${
              verificationResult.verified 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              <Icon 
                icon={verificationResult.verified ? 'ph:check-circle-bold' : 'ph:x-circle-bold'}
                className={`w-6 h-6 ${
                  verificationResult.verified 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verification Result
              </h3>
              <p className={`text-sm ${
                verificationResult.verified 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {verificationResult.verified ? '✅ Verified' : '❌ Mismatch'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">On-Chain Hash</h4>
                <p className="text-sm font-mono text-gray-600 break-all">
                  {verificationResult.onChainHash}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Computed Hash</h4>
                <p className="text-sm font-mono text-gray-600 break-all">
                  {verificationResult.computedHash}
                </p>
              </div>
            </div>

            {verificationResult.dataset && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Dataset Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 font-semibold">{verificationResult.dataset.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <span className="ml-2 font-semibold">{verificationResult.dataset.modelVersion}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Seed:</span>
                    <span className="ml-2 font-mono">{verificationResult.dataset.seed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <span className="ml-2 font-mono">
                      {`${verificationResult.dataset.owner.slice(0, 6)}...${verificationResult.dataset.owner.slice(-4)}`}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">IPFS CID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">
                        {truncateHash(verificationResult.dataset.cid)}
                      </span>
                      <a
                        href={`https://ipfs.io/ipfs/${verificationResult.dataset.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="View on IPFS"
                      >
                        <Icon icon="ph:arrow-square-out" className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        type={modalContent.type}
      >
        <p className="text-gray-600">{modalContent.message}</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowModal(false)}
            className="btn-primary"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VerifyPanel;