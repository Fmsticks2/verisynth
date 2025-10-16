import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction, useAccount, usePublicClient } from 'wagmi';
import { generateSyntheticData } from '../utils/dataGenerator';
import { uploadDatasetToIPFS } from '../utils/ipfsUpload';
import { getOgEntropy } from '../utils/ogCompute';
import { assessQuality } from '../utils/dataQuality';
import { assessTopicCompliance } from '../utils/topicCompliance';
import { GeneratedDataset } from '../types';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import Modal from './Modal';

interface GeneratePanelProps {
  onDatasetGenerated?: (dataset: GeneratedDataset) => void;
}

const GeneratePanel: React.FC<GeneratePanelProps> = ({ onDatasetGenerated }) => {
  const { isConnected } = useAccount();
  
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
  const [useOgEntropy, setUseOgEntropy] = useState<boolean>(true);
  const [useAdvancedAlgo, setUseAdvancedAlgo] = useState<boolean>(true);
  const publicClient = usePublicClient();
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

  // Track if we've already initiated the transaction
  const [hasInitiatedTransaction, setHasInitiatedTransaction] = useState(false);

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

      let extraEntropy = '';
      if (useOgEntropy && publicClient) {
        extraEntropy = await getOgEntropy(publicClient as any);
      }

      const dataset = await generateSyntheticData(
        formData.modelVersion,
        formData.seed,
        formData.topic,
        formData.recordCount,
        { extraEntropy, algorithm: useAdvancedAlgo ? 'advanced' : 'basic' }
      );

      // Assess quality metrics and topic compliance, then attach
      const quality = assessQuality(dataset.data);
      const topicCompliance = assessTopicCompliance(formData.topic, dataset.data);
      const withMetrics: GeneratedDataset = {
        ...dataset,
        metadata: {
          ...dataset.metadata,
          quality,
          topicCompliance,
        },
      };

      setGeneratedDataset(withMetrics);
      onDatasetGenerated?.(withMetrics);
      
      setModalContent({
        type: 'success',
        title: 'Dataset Generated',
        message: `Successfully generated ${withMetrics.data.length} records with hash: ${withMetrics.hash.slice(0, 12)}...`,
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

  const handleDownloadDataset = () => {
    if (!generatedDataset) return;

    const dataStr = JSON.stringify(generatedDataset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_${generatedDataset.metadata.seed}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setModalContent({
      type: 'success',
      title: 'Download Started',
      message: 'Dataset JSON file download has started.',
    });
    setShowModal(true);
  };

  const handleDownloadCSV = () => {
    if (!generatedDataset) return;
    const rows = generatedDataset.data;
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(rows.map((r: any) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_${generatedDataset.metadata.seed}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadNDJSON = () => {
    if (!generatedDataset) return;
    const ndjson = generatedDataset.data.map((r) => JSON.stringify(r)).join('\n');
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_${generatedDataset.metadata.seed}_${Date.now()}.ndjson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHFDataset = () => {
    if (!generatedDataset) return;
    const payload = {
      dataset: generatedDataset.data,
      dataset_info: {
        description: `VeriSynth synthetic dataset generated with model ${generatedDataset.metadata.modelVersion}`,
        features: Object.keys(generatedDataset.data[0] || {}).map((k) => ({ name: k, dtype: 'auto' })),
        size: generatedDataset.data.length,
        seed: generatedDataset.metadata.seed,
        topic: generatedDataset.metadata.topic,
        recordCount: generatedDataset.metadata.recordCount,
        generatedAt: generatedDataset.metadata.generatedAt,
        hash: generatedDataset.hash,
        cid: generatedDataset.metadata.actualCID || '',
        topicCompliance: generatedDataset.metadata.topicCompliance || undefined,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huggingface_dataset_${generatedDataset.metadata.seed}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadAndRegister = async () => {
    if (!generatedDataset || !isConnected || hasInitiatedTransaction) return;

    // Gate by topic compliance: require at least 80% required field coverage
    const complianceScore = generatedDataset.metadata.topicCompliance?.score ?? 0;
    const canonical = generatedDataset.metadata.topicCompliance?.canonicalTopic ?? 'unknown';
    if (canonical === 'unknown' || complianceScore < 80) {
      setModalContent({
        type: 'error',
        title: 'Topic Compliance Required',
        message: `Dataset does not sufficiently match the requested topic (canonical: ${canonical}, score: ${Math.round(complianceScore)}). Please refine your topic or re-generate for better alignment.`,
      });
      setShowModal(true);
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload dataset to IPFS via signed URL flow
      const result = await uploadDatasetToIPFS(generatedDataset);
      const cid = result.cid;
      setUploadedCID(cid);
      
      // Trigger the contract write only once
      if (write && !hasInitiatedTransaction) {
        setHasInitiatedTransaction(true);
        write();
      }
      
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

  // Trigger contract write when CID becomes available and config is ready
  React.useEffect(() => {
    if (generatedDataset && uploadedCID && isConnected && write && !hasInitiatedTransaction) {
      setHasInitiatedTransaction(true);
      write();
    }
  }, [generatedDataset, uploadedCID, isConnected, write, hasInitiatedTransaction]);

  // Handle transaction success
  React.useEffect(() => {
    if (isSuccess && data?.hash) {
      setIsUploading(false);
      
      // Update the generated dataset with actual blockchain values
      if (generatedDataset) {
        const updatedDataset = {
          ...generatedDataset,
          metadata: {
            ...generatedDataset.metadata,
            actualCID: uploadedCID,
            transactionHash: data.hash,
            blockchainTimestamp: Date.now(),
          }
        };
        setGeneratedDataset(updatedDataset);
        onDatasetGenerated?.(updatedDataset);
      }
      
      setModalContent({
        type: 'success',
        title: 'Dataset Registered',
        message: `Dataset successfully registered on-chain! Transaction: ${data.hash.slice(0, 12)}...`,
      });
      setShowModal(true);
      
      // Reset form after a delay to allow user to see the updated values
      setTimeout(() => {
        setGeneratedDataset(null);
        setUploadedCID('');
        setHasInitiatedTransaction(false); // Reset transaction flag
        setFormData({
          modelVersion: 'v1.0.0',
          seed: '',
          topic: '',
          recordCount: 100,
        });
      }, 3000);
    }
  }, [isSuccess, data?.hash, generatedDataset, uploadedCID, onDatasetGenerated]);

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

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Use 0G entropy</p>
                <p className="text-xs text-gray-500">Fetch randomness from 0G chain to diversify data.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOgEntropy}
                  onChange={(e) => setUseOgEntropy(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Advanced algorithm</p>
                <p className="text-xs text-gray-500">Shuffle and mutate records using entropy-driven logic.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAdvancedAlgo}
                  onChange={(e) => setUseAdvancedAlgo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
              </label>
            </div>
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
              <button
                onClick={() => navigator.clipboard.writeText(generatedDataset.hash)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy data hash"
              >
                <Icon icon="ph:copy" className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
              <div>
                <span className="text-gray-500">Generated:</span>
                <span className="ml-2 font-semibold">
                  {new Date(generatedDataset.metadata.generatedAt).toLocaleString()}
                </span>
              </div>
              {generatedDataset.metadata.actualCID && (
                <div className="col-span-2">
                  <span className="text-gray-500">IPFS CID:</span>
                  <span className="ml-2 font-mono text-xs break-all">{generatedDataset.metadata.actualCID}</span>
                </div>
              )}
              {generatedDataset.metadata.transactionHash && (
                <div className="col-span-2">
                  <span className="text-gray-500">Transaction:</span>
                  <span className="ml-2 font-mono text-xs break-all">{generatedDataset.metadata.transactionHash}</span>
                </div>
              )}
            </div>
          </div>

          {generatedDataset.metadata.quality && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Icon icon="ph:gauge" className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Data Quality</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Quality Score:</span>
                  <span className="ml-2 font-semibold">{Math.round((generatedDataset.metadata.quality.score || 0) * 100) / 100}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duplicates:</span>
                  <span className="ml-2 font-semibold">{Math.round(generatedDataset.metadata.quality.duplicateRatio * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Nulls:</span>
                  <span className="ml-2 font-semibold">{Math.round(generatedDataset.metadata.quality.nullRatio * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Records:</span>
                  <span className="ml-2 font-semibold">{generatedDataset.metadata.quality.recordCount}</span>
                </div>
            </div>
            {/* Show a couple of numeric field summaries if available */}
            {generatedDataset.metadata.quality.numericFieldStats && Object.keys(generatedDataset.metadata.quality.numericFieldStats).length > 0 && (
              <div className="mt-3 text-xs text-gray-700">
                <p className="font-medium">Numeric field stats:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {Object.entries(generatedDataset.metadata.quality.numericFieldStats).slice(0, 2).map(([k, v]) => {
                    const stat = v as { min: number; max: number; mean: number };
                    return (
                      <div key={k} className="p-2 bg-white rounded-lg border">
                        <span className="font-semibold">{k}</span>
                        <span className="ml-2">mean {stat.mean.toFixed(2)}, min {stat.min}, max {stat.max}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {generatedDataset.metadata.topicCompliance && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Icon icon="ph:target" className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Topic Compliance</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Compliance Score:</span>
                  <span className="ml-2 font-semibold">{Math.round((generatedDataset.metadata.topicCompliance.score || 0) * 100) / 100}</span>
                </div>
                <div>
                  <span className="text-gray-600">Required Coverage:</span>
                  <span className="ml-2 font-semibold">{Math.round((generatedDataset.metadata.topicCompliance.requiredCoverage || 0))}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Canonical Topic:</span>
                  <span className="ml-2 font-semibold">{generatedDataset.metadata.topicCompliance.canonicalTopic}</span>
                </div>
              </div>
              {(generatedDataset.metadata.topicCompliance.canonicalTopic === 'unknown' || (generatedDataset.metadata.topicCompliance.score || 0) < 80) && (
                <p className="mt-3 text-xs text-red-700">
                  Upload is disabled until compliance is at least 80% and topic is recognized.
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <pre className="text-green-400 text-xs overflow-x-auto">
              {JSON.stringify(generatedDataset.data.slice(0, 3), null, 2)}
              {generatedDataset.data.length > 3 && '\n... and more records'}
            </pre>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDownloadCSV}
              className="btn-secondary"
            >
              <Icon icon="ph:file-csv" className="w-5 h-5 mr-2" />
              Download CSV
            </button>
            <button
              onClick={handleDownloadNDJSON}
              className="btn-secondary"
            >
              <Icon icon="ph:brackets-curly" className="w-5 h-5 mr-2" />
              Download NDJSON
            </button>
            <button
              onClick={handleDownloadHFDataset}
              className="btn-secondary"
            >
              <Icon icon="ph:brain" className="w-5 h-5 mr-2" />
              HuggingFace JSON
            </button>
            <button
              onClick={handleDownloadDataset}
              className="btn-secondary"
            >
              <Icon icon="ph:download" className="w-5 h-5 mr-2" />
              Download JSON
            </button>
            <button
              onClick={handleUploadAndRegister}
              disabled={!isConnected || isUploading || isTransactionLoading || ((generatedDataset.metadata.topicCompliance?.score ?? 0) < 80)}
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