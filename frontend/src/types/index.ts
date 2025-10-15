export interface Dataset {
  id: number;
  modelVersion: string;
  seed: string;
  dataHash: string;
  cid: string;
  owner: string;
  timestamp: number;
  verified?: boolean;
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
    extraEntropy?: string;
    actualCID?: string;
    transactionHash?: string;
    blockchainTimestamp?: number;
    quality?: QualityMetrics;
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

export interface QualityMetrics {
  recordCount: number;
  duplicateRatio: number;
  nullRatio: number;
  numericFieldStats: Record<string, { min: number; max: number; mean: number }>;
  categoricalUniques: Record<string, number>;
  score: number; // 0-100 simple quality score
}