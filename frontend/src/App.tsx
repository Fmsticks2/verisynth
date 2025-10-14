import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import GeneratePanel from './components/GeneratePanel';
import VerifyPanel from './components/VerifyPanel';
import DatasetCard from './components/DatasetCard';
import { Dataset, GeneratedDataset } from './types';

type ActiveTab = 'generate' | 'verify' | 'docs';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  const handleDatasetGenerated = (generatedDataset: GeneratedDataset) => {
    // Convert GeneratedDataset to Dataset format for display
    const dataset: Dataset = {
      id: Date.now(), // Temporary ID until blockchain registration
      modelVersion: generatedDataset.metadata.modelVersion,
      seed: generatedDataset.metadata.seed,
      dataHash: generatedDataset.hash,
      cid: '', // Will be set after IPFS upload
      owner: '', // Will be set after blockchain registration
      timestamp: generatedDataset.metadata.generatedAt,
    };
    setDatasets(prev => [dataset, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return (
          <div className="space-y-8">
            <GeneratePanel onDatasetGenerated={handleDatasetGenerated} />
            
            {datasets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Datasets</h2>
                    <p className="text-gray-500">Your generated synthetic datasets</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {datasets.map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );
      
      case 'verify':
        return <VerifyPanel />;
      
      case 'docs':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card max-w-4xl mx-auto"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Documentation</h2>
                <p className="text-gray-500">Learn how to use VeriSynth</p>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What is VeriSynth?</h3>
              <p className="text-gray-600 mb-6">
                VeriSynth is a blockchain-based platform for generating, storing, and verifying synthetic datasets built on the 0G Network. 
                It leverages 0G's AI-native infrastructure to ensure data integrity through cryptographic hashing and provides immutable proof of dataset authenticity with high-performance storage and data availability.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Generate Datasets</h3>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <ol className="list-decimal list-inside space-y-3 text-gray-600">
                  <li>Connect your wallet using the "Connect Wallet" button</li>
                  <li>Navigate to the "Generate" tab</li>
                  <li>Fill in the dataset parameters:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li><strong>Model Version:</strong> Version identifier for your model (e.g., v1.0.0)</li>
                      <li><strong>Seed:</strong> Random seed for reproducible generation</li>
                      <li><strong>Topic:</strong> Subject matter for the synthetic data</li>
                      <li><strong>Record Count:</strong> Number of records to generate (1-1000)</li>
                    </ul>
                  </li>
                  <li>Click "Generate Dataset" to create and register your dataset</li>
                  <li>The dataset will be uploaded to 0G Storage Network and registered on the blockchain</li>
                </ol>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Verify Datasets</h3>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <ol className="list-decimal list-inside space-y-3 text-gray-600">
                  <li>Navigate to the "Verify" tab</li>
                  <li>Enter the Dataset ID you want to verify</li>
                  <li>Upload the JSON file containing the dataset</li>
                  <li>Click "Verify Dataset" to check integrity</li>
                  <li>The system will compare the uploaded data hash with the on-chain hash</li>
                  <li>Results will show whether the dataset is authentic and unmodified</li>
                </ol>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <ul className="space-y-3 text-gray-600">
                  <li><strong>Blockchain:</strong> 0G Network (0G-Galileo-Testnet) - AI-native Layer 1 blockchain optimized for AI applications</li>
                  <li><strong>Performance:</strong> 2,500+ TPS with optimized CometBFT consensus mechanism</li>
                  <li><strong>Storage:</strong> 0G Storage Network with Proof of Random Access (PoRA) consensus for decentralized data storage</li>
                  <li><strong>Data Availability:</strong> 0G DA layer with quorum-based architecture for infinite scalability</li>
                  <li><strong>Consensus:</strong> Byzantine Fault Tolerant (BFT) with modular architecture separating consensus from execution</li>
                  <li><strong>Hashing:</strong> SHA-256 for data integrity verification</li>
                  <li><strong>Smart Contract:</strong> Solidity-based registry for dataset metadata with EVM compatibility</li>
                  <li><strong>Frontend:</strong> React with TypeScript, Tailwind CSS, Framer Motion, and Wagmi for Web3 integration</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                <ul className="space-y-3 text-gray-600">
                  <li>✅ <strong>Immutable Records:</strong> Dataset metadata stored permanently on 0G blockchain</li>
                  <li>✅ <strong>Cryptographic Verification:</strong> SHA-256 hashing ensures data integrity</li>
                  <li>✅ <strong>Decentralized Storage:</strong> 0G Storage Network with PoRA consensus prevents single points of failure</li>
                  <li>✅ <strong>High Performance:</strong> 2,500+ TPS with optimized consensus for AI workloads</li>
                  <li>✅ <strong>Ownership Tracking:</strong> Clear provenance and ownership records</li>
                  <li>✅ <strong>Reproducible Generation:</strong> Seeded random generation for consistency</li>
                  <li>✅ <strong>AI-Native Infrastructure:</strong> Built specifically for AI applications and data-intensive workloads</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Technology Stack</h3>
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Blockchain Layer</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• 0G Network (Chain ID: 16602)</li>
                      <li>• CometBFT consensus mechanism</li>
                      <li>• EVM-compatible smart contracts</li>
                      <li>• Byzantine Fault Tolerant validation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Storage & Data</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• 0G Storage Network with PoRA</li>
                      <li>• 0G Data Availability layer</li>
                      <li>• Decentralized storage at $10/TB</li>
                      <li>• Infinite scalability architecture</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Frontend Stack</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• React 18 with TypeScript</li>
                      <li>• Tailwind CSS for styling</li>
                      <li>• Framer Motion animations</li>
                      <li>• Wagmi for Web3 integration</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Development Tools</h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      <li>• Vite for build tooling</li>
                      <li>• RainbowKit wallet connector</li>
                      <li>• Phosphor Icons library</li>
                      <li>• Environment-based configuration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Roadmap</h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🚀 Phase 1: Enhanced AI Integration</h4>
                    <ul className="space-y-1 text-gray-600 text-sm ml-4">
                      <li>• AI model training dataset optimization</li>
                      <li>• Advanced synthetic data generation algorithms</li>
                      <li>• Integration with 0G's AI computation layer</li>
                      <li>• Real-time data quality assessment</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🔧 Phase 2: Advanced Features</h4>
                    <ul className="space-y-1 text-gray-600 text-sm ml-4">
                      <li>• Multi-format dataset support (images, audio, video)</li>
                      <li>• Collaborative dataset creation tools</li>
                      <li>• Advanced privacy-preserving techniques</li>
                      <li>• Cross-chain interoperability</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🌐 Phase 3: Ecosystem Expansion</h4>
                    <ul className="space-y-1 text-gray-600 text-sm ml-4">
                      <li>• Marketplace for synthetic datasets</li>
                      <li>• Integration with major AI/ML frameworks</li>
                      <li>• Enterprise-grade analytics dashboard</li>
                      <li>• Decentralized governance mechanisms</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                VeriSynth
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 VeriSynth. Secure synthetic data generation and verification.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;