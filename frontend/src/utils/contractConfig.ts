// Contract configuration for VeriSynth

// Network configurations
export const NETWORK_CONFIG = {
  localhost: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: import.meta.env.VITE_LOCALHOST_RPC_URL || 'http://127.0.0.1:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'http://localhost:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || '',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  mumbai: {
    chainId: 80001,
    name: 'Mumbai',
    rpcUrl: import.meta.env.VITE_MUMBAI_RPC_URL || '',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorer: 'https://mumbai.polygonscan.com',
  },
  ogTestnet: {
    chainId: 16602,
    name: import.meta.env.VITE_OG_CHAIN_NAME || '0G-Galileo-Testnet',
    rpcUrl: import.meta.env.VITE_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
    nativeCurrency: {
      name: import.meta.env.VITE_OG_NATIVE_CURRENCY_NAME || 'OG',
      symbol: import.meta.env.VITE_OG_NATIVE_CURRENCY_SYMBOL || 'OG',
      decimals: parseInt(import.meta.env.VITE_OG_NATIVE_CURRENCY_DECIMALS || '18'),
    },
    blockExplorer: import.meta.env.VITE_OG_BLOCK_EXPLORER_URL || 'https://chainscan-galileo.0g.ai',
    indexerUrl: import.meta.env.VITE_OG_INDEXER_URL || 'https://indexer-testnet.0g.ai',
    storageUrl: import.meta.env.VITE_OG_STORAGE_URL || 'https://rpc-storage-testnet.0g.ai',
  },
} as const;

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  localhost: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
  sepolia: (import.meta.env.VITE_DATASET_REGISTRY_ADDRESS_SEPOLIA || '') as `0x${string}`,
  mumbai: (import.meta.env.VITE_DATASET_REGISTRY_ADDRESS_MUMBAI || '') as `0x${string}`,
  ogTestnet: (import.meta.env.VITE_DATASET_REGISTRY_ADDRESS_OG || '0xdc6c396319895dA489b0Cd145A4c5D660b9e10F6') as `0x${string}`,
} as const;

// Function to get contract address based on network
export const getContractAddress = (network: keyof typeof CONTRACT_ADDRESSES): `0x${string}` => {
  return CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.localhost;
};

export const CONTRACT_CONFIG = {
  address: getContractAddress('ogTestnet'),
  abi: [
    {
      "type": "constructor",
      "inputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "datasetExists",
      "inputs": [
        {
          "name": "datasetId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "datasets",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "id",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "modelVersion",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "seed",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "dataHash",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "cid",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getDataset",
      "inputs": [
        {
          "name": "datasetId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct DatasetRegistry.Dataset",
          "components": [
            {
              "name": "id",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "modelVersion",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "seed",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "dataHash",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "cid",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "owner",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "timestamp",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getDatasetsByOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getTotalDatasets",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "nextDatasetId",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "ownerDatasets",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "registerDataset",
      "inputs": [
        {
          "name": "modelVersion",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "seed",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "dataHash",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "cid",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "verifyDataset",
      "inputs": [
        {
          "name": "datasetId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "providedDataHash",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "DatasetRegistered",
      "inputs": [
        {
          "name": "datasetId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "owner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "modelVersion",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "seed",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "dataHash",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "DatasetVerified",
      "inputs": [
        {
          "name": "datasetId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "isValid",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "verifier",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    }
  ] as const
};

// Function to get contract config with dynamic address based on network
export const getContractConfig = (network: keyof typeof CONTRACT_ADDRESSES) => ({
  address: getContractAddress(network),
  abi: CONTRACT_CONFIG.abi
});