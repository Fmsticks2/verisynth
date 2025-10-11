// Contract configuration for VeriSynth
export const CONTRACT_CONFIG = {
  // This will be updated after deployment
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
  
  abi: [
    {
      "inputs": [
        {"internalType": "string", "name": "modelVersion", "type": "string"},
        {"internalType": "string", "name": "seed", "type": "string"},
        {"internalType": "string", "name": "dataHash", "type": "string"},
        {"internalType": "string", "name": "cid", "type": "string"}
      ],
      "name": "registerDataset",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
      "name": "getDataset",
      "outputs": [{
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "string", "name": "modelVersion", "type": "string"},
          {"internalType": "string", "name": "seed", "type": "string"},
          {"internalType": "string", "name": "dataHash", "type": "string"},
          {"internalType": "string", "name": "cid", "type": "string"},
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct DatasetRegistry.Dataset",
        "name": "",
        "type": "tuple"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "string", "name": "computedHash", "type": "string"}
      ],
      "name": "verifyDataset",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
      "name": "getDatasetsByOwner",
      "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
      "name": "datasetExists",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextDatasetId",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
        {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
        {"indexed": false, "internalType": "string", "name": "modelVersion", "type": "string"},
        {"indexed": false, "internalType": "string", "name": "dataHash", "type": "string"},
        {"indexed": false, "internalType": "string", "name": "cid", "type": "string"}
      ],
      "name": "DatasetRegistered",
      "type": "event"
    }
  ] as const
};