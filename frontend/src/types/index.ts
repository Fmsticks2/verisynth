export interface Dataset {
  id: number;
  modelVersion: string;
  seed: string;
  dataHash: string;
  cid: string;
  owner: string;
  timestamp: number;
}

export interface GeneratedDataset {
  data: any[];
  hash: string;
  metadata: {
    modelVersion: string;
    seed: string;
    topic: string;
    recordCount: number;
    generatedAt: number;
    actualCID?: string;
    transactionHash?: string;
    blockchainTimestamp?: number;
  };
}

export interface ContractAddresses {
  DatasetRegistry: string;
}

export interface VerificationResult {
  verified: boolean;
  onChainHash: string;
  computedHash: string;
  dataset?: Dataset;
}