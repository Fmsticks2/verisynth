import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useContractRead } from 'wagmi';
import { computeDataHash } from '../utils/dataGenerator';
import { Dataset, VerificationResult, GeneratedDataset } from '../types';
import { CONTRACT_CONFIG } from '../utils/contractConfig';
import Modal from './Modal';

interface VerifyPanelProps {
  initialDatasetId?: number;
  initialDataHash?: string;
  initialDatasetJson?: GeneratedDataset | null;
  onVerified?: (verified: boolean) => void;
}

const VerifyPanel: React.FC<VerifyPanelProps> = ({
  initialDatasetId,
  initialDataHash,
  initialDatasetJson,
  onVerified,
}) => {
  const [datasetId, setDatasetId] = useState<string>(initialDatasetId ? String(initialDatasetId) : '');
  const [dataHash, setDataHash] = useState<string>(initialDataHash || '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [attachedDataset, setAttachedDataset] = useState<GeneratedDataset | null>(initialDatasetJson || null);
  const [useAttached, setUseAttached] = useState<boolean>(Boolean(initialDatasetJson));
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

  useEffect(() => {
    // Sync local state with incoming props when provided
    if (initialDatasetId) setDatasetId(String(initialDatasetId));
    if (typeof initialDataHash === 'string') setDataHash(initialDataHash);
    setAttachedDataset(initialDatasetJson || null);
    setUseAttached(Boolean(initialDatasetJson));
  }, [initialDatasetId, initialDataHash, initialDatasetJson]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setVerificationResult(null);
    }
  };

  const handleVerify = async () => {
    // Must have either attached dataset or an uploaded file
    if (!attachedDataset && !uploadedFile) {
      setModalContent({
        type: 'error',
        title: 'Missing Dataset',
        message: 'Attach a dataset from Recent Datasets or upload a JSON file.',
      });
      setShowModal(true);
      return;
    }

    setIsVerifying(true);
    
    try {
      // Acquire JSON source
      let parsedData: unknown;
      if (useAttached && attachedDataset) {
        parsedData = attachedDataset.data;
      } else if (uploadedFile) {
        const fileContent = await uploadedFile.text();
        try {
          parsedData = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error('Invalid JSON file format');
        }
      }

      // Compute hash of provided data (supports full dataset JSON with metadata)
      const computedHash = await computeDataHash(
        useAttached && attachedDataset ? attachedDataset : parsedData
      );

      // Optional: Fetch dataset from blockchain if ID provided
      let onChainDataset: Dataset | null = null;
      if (datasetId) {
        await refetchDataset();
        if (!datasetError && datasetData) {
          onChainDataset = {
            id: Number(datasetData.id),
            modelVersion: datasetData.modelVersion,
            seed: datasetData.seed,
            dataHash: datasetData.dataHash,
            cid: datasetData.cid,
            owner: datasetData.owner,
            timestamp: Number(datasetData.timestamp),
          };
        }
      }

      // Evaluate matches
      const providedHashMatch = dataHash ? dataHash === computedHash : null;
      const onChainMatch = onChainDataset ? onChainDataset.dataHash === computedHash : null;

      // Determine overall verification outcome
      const verified = onChainDataset ? Boolean(onChainMatch) : Boolean(providedHashMatch);

      const result: VerificationResult = {
        verified,
        onChainHash: onChainDataset?.dataHash || dataHash || '',
        computedHash,
        dataset: onChainDataset || undefined,
      };
      
      setVerificationResult(result);
      
      setModalContent({
        type: verified ? 'success' : 'error',
        title: verified ? 'Verification Successful' : 'Verification Failed',
        message: verified 
          ? 'The dataset matches the expected hash.'
          : 'The dataset does not match the expected hash. Ensure you used the correct JSON and hash.',
      });
      setShowModal(true);
      onVerified?.(verified);
      
    } catch (error) {
      setModalContent({
        type: 'error',
        title: 'Verification Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred during verification.',
      });
      setShowModal(true);
      onVerified?.(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset ID (optional)
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
                Data Hash (optional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={dataHash}
                  onChange={(e) => setDataHash(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Paste the data hash here"
                />
                <button
                  onClick={() => navigator.clipboard.readText().then(text => setDataHash(text)).catch(() => {})}
                  className="btn-secondary text-sm px-3"
                  title="Paste from clipboard"
                >
                  <Icon icon="ph:clipboard-text" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Source
            </label>
            {attachedDataset ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon icon="ph:link" className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Using dataset from Recent Datasets</span>
                  </div>
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAttached}
                      onChange={(e) => setUseAttached(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Use attached dataset</span>
                  </label>
                </div>
                {!useAttached && (
                  <div className="mt-4">
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
                )}
              </div>
            ) : (
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
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleVerify}
              disabled={(useAttached ? !attachedDataset : !uploadedFile) || isVerifying}
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
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-gray-600 break-all">
                    {verificationResult.computedHash}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(verificationResult.computedHash)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy computed hash"
                  >
                    <Icon icon="ph:copy" className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
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