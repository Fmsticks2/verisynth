import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { generateSyntheticData, computeDataHash, mockIPFSUpload } from '../utils/dataGenerator';
import { Dataset, GeneratedDataset } from '../types';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import Modal from './Modal';

interface GeneratePanelProps {
  onDatasetGenerated?: (dataset: GeneratedDataset) => void;
}

const GeneratePanel: React.FC<GeneratePanelProps> = ({ onDatasetGenerated }) => {
  const { address, isConnected } = useAccount();
  
  const [formData, setFormData] = useState({
    modelVersion: 'v1.0.0',
    seed: '',
    topic: '',
    recordCount: 100,
  });
  
  const [generatedDataset, setGeneratedDataset] = useState<GeneratedDataset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCID, setUploadedCID] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ type: 'info', title: '', message: '' });

  // Prepare contract write
  const { config } = usePrepareContractWrite({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'registerDataset',
    args: generatedDataset && uploadedCID ? [
      formData.modelVersion,
      formData.seed,
      generatedDataset.hash,
      uploadedCID
    ] : undefined,
    enabled: Boolean(generatedDataset && uploadedCID && isConnected),
  });

  const { data, write } = useContractWrite(config);

  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'recordCount' ? parseInt(value) || 100 : value,
    }));
  };

  const handleGenerate = async () => {
    if (!formData.seed || !formData.topic) {
      setModalContent({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide both seed and data topic.',
      });
      setShowModal(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const dataset = generateSyntheticData(
        formData.modelVersion,
        formData.seed,
        formData.topic,
        formData.recordCount
      );
      
      setGeneratedDataset(dataset);
      onDatasetGenerated?.(dataset);
      
      setModalContent({
        type: 'success',
        title: 'Dataset Generated',
        message: `Successfully generated ${dataset.data.length} records with hash: ${dataset.hash.slice(0, 12)}...`,
      });
      setShowModal(true);
    } catch (error) {
      setModalContent({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate dataset. Please try again.',
      });
      setShowModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadAndRegister = async () => {
    if (!generatedDataset || !isConnected) return;

    setIsUploading(true);
    
    try {
      // Mock IPFS upload
      const cid = await mockIPFSUpload(generatedDataset);
      setUploadedCID(cid);
      
      // Wait a moment for the contract write to be prepared
      setTimeout(() => {
        if (write) {
          write();
        }
      }, 500);
      
    } catch (error) {
      setModalContent({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload dataset to IPFS. Please try again.',
      });
      setShowModal(true);
      setIsUploading(false);
    }
  };

  // Handle transaction success
  React.useEffect(() => {
    if (isSuccess) {
      setIsUploading(false);
      setModalContent({
        type: 'success',
        title: 'Dataset Registered',
        message: `Dataset successfully registered on-chain! Transaction: ${data?.hash}`,
      });
      setShowModal(true);
      
      // Reset form
      setGeneratedDataset(null);
      setUploadedCID('');
      setFormData({
        modelVersion: 'v1.0.0',
        seed: '',
        topic: '',
        recordCount: 100,
      });
    }
  }, [isSuccess, data?.hash]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-primary-100 to-purple-100 p-3 rounded-xl">
            <Icon icon="material-symbols:cloud-upload" className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Dataset</h2>
            <p className="text-gray-500">Create synthetic data with verifiable properties</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Version
            </label>
            <input
              type="text"
              name="modelVersion"
              value={formData.modelVersion}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., v1.0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seed
            </label>
            <input
              type="text"
              name="seed"
              value={formData.seed}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 12345"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Topic
            </label>
            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              rows={3}
              className="textarea-field"
              placeholder="e.g., users, products, sales, financial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Count
            </label>
            <input
              type="number"
              name="recordCount"
              value={formData.recordCount}
              onChange={handleInputChange}
              min="10"
              max="1000"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.seed || !formData.topic}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Icon icon="ph:spinner" className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon icon="ph:magic-wand" className="w-5 h-5 mr-2" />
                Generate Data
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Generated Dataset Preview */}
      {generatedDataset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Dataset</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Icon icon="ph:hash" className="w-4 h-4" />
              <span className="font-mono">{generatedDataset.hash.slice(0, 12)}...</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Records:</span>
                <span className="ml-2 font-semibold">{generatedDataset.data.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Model:</span>
                <span className="ml-2 font-semibold">{generatedDataset.metadata.modelVersion}</span>
              </div>
              <div>
                <span className="text-gray-500">Seed:</span>
                <span className="ml-2 font-mono">{generatedDataset.metadata.seed}</span>
              </div>
              <div>
                <span className="text-gray-500">Topic:</span>
                <span className="ml-2 font-semibold">{generatedDataset.metadata.topic}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <pre className="text-green-400 text-xs overflow-x-auto">
              {JSON.stringify(generatedDataset.data.slice(0, 3), null, 2)}
              {generatedDataset.data.length > 3 && '\n... and more records'}
            </pre>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUploadAndRegister}
              disabled={!isConnected || isUploading || isTransactionLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading || isTransactionLoading ? (
                <>
                  <Icon icon="ph:spinner" className="w-5 h-5 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Registering...'}
                </>
              ) : (
                <>
                  <Icon icon="ph:upload" className="w-5 h-5 mr-2" />
                  Upload & Register
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Connection Warning */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Icon icon="ph:warning-circle" className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              Please connect your wallet to register datasets on-chain.
            </p>
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

export default GeneratePanel;