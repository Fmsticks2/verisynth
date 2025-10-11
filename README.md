# VeriSynth - Synthetic Data Verification Platform

VeriSynth is a blockchain-based platform for generating, registering, and verifying synthetic datasets. It combines deterministic data generation with cryptographic hashing and IPFS storage to ensure data integrity and provenance.

## 🌟 Features

- **Deterministic Data Generation**: Generate reproducible synthetic datasets using seeded random number generation
- **Blockchain Registry**: Register datasets on-chain with immutable metadata and ownership tracking
- **Cryptographic Verification**: Verify dataset integrity using SHA-256 hashing
- **IPFS Integration**: Decentralized storage simulation for dataset content
- **Web3 Wallet Integration**: Connect with MetaMask and other Web3 wallets using RainbowKit
- **Modern UI**: Beautiful, responsive interface built with React, TypeScript, and Tailwind CSS

## 🏗️ Architecture

### Smart Contract
- **DatasetRegistry.sol**: Manages dataset registration, verification, and ownership
- Built with Solidity ^0.8.20 and OpenZeppelin contracts
- Deployed on local Hardhat network for development

### Frontend
- **React + TypeScript**: Modern web application framework
- **Wagmi + RainbowKit**: Web3 integration and wallet connection
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Smooth animations and transitions
- **Vite**: Fast development build tool

### Data Generation
- **Seeded Random Generation**: Reproducible synthetic data creation
- **Multiple Data Types**: Support for various synthetic data templates
- **Hash-based Verification**: SHA-256 hashing for data integrity

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd verisynth
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install contract dependencies
   cd contracts
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Development Setup

1. **Start the Hardhat local network**
   ```bash
   cd contracts
   npx hardhat node
   ```
   This will start a local Ethereum network with 20 pre-funded accounts.

2. **Deploy the smart contract**
   ```bash
   # In a new terminal, from the contracts directory
   npx hardhat run scripts/deploy.js --network localhost
   ```
   The contract will be deployed and the address will be saved to the frontend configuration.

3. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

4. **Configure MetaMask**
   - Add the local Hardhat network to MetaMask:
     - Network Name: Hardhat Local
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH
   - Import one of the test accounts using the private keys shown in the Hardhat node output

## 📖 Usage Guide

### Generating Datasets

1. **Connect your wallet** using the "Connect Wallet" button in the header
2. **Navigate to the Generate tab**
3. **Fill in the dataset parameters**:
   - Model Version: Version identifier for your data model
   - Seed: Numeric seed for reproducible generation
   - Topic: Subject matter for the synthetic data
   - Record Count: Number of records to generate (1-1000)
4. **Click "Generate Dataset"** to create and register the dataset
5. **Confirm the transaction** in your wallet
6. **View the generated dataset** in the results section

### Verifying Datasets

1. **Navigate to the Verify tab**
2. **Enter the Dataset ID** you want to verify
3. **Upload a JSON file** containing the dataset to verify
4. **Click "Verify Dataset"** to check integrity
5. **View the verification results** showing whether the data matches the registered hash

### Viewing Documentation

The **Docs tab** contains comprehensive information about:
- How VeriSynth works
- Technical implementation details
- API reference
- Best practices for synthetic data generation

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

The test suite covers:
- Contract deployment and initialization
- Dataset registration functionality
- Data verification processes
- Owner-based dataset queries
- Access control and permissions

### Frontend Testing

The frontend can be tested manually by:
1. Connecting different wallet accounts
2. Generating datasets with various parameters
3. Verifying datasets with correct and incorrect data
4. Testing the responsive UI across different screen sizes

## 📁 Project Structure

```
verisynth/
├── contracts/                 # Smart contract code
│   ├── contracts/
│   │   └── DatasetRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── DatasetRegistry.test.js
│   └── hardhat.config.js
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript type definitions
│   │   └── contracts/        # Contract ABI and addresses
│   ├── public/               # Static assets
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
```

### Contract Configuration

The contract address and ABI are automatically updated in `frontend/src/utils/contractConfig.ts` when you deploy the contract.

## 🛠️ Development

### Adding New Data Templates

To add new synthetic data templates:

1. Edit `frontend/src/utils/dataGenerator.ts`
2. Add your template to the `DATA_TEMPLATES` object
3. Update the topic selection in the Generate panel

### Modifying the Smart Contract

1. Edit `contracts/contracts/DatasetRegistry.sol`
2. Recompile: `npx hardhat compile`
3. Run tests: `npx hardhat test`
4. Redeploy: `npx hardhat run scripts/deploy.js --network localhost`

### Styling Changes

The project uses Tailwind CSS. Modify styles by:
1. Editing component classes directly
2. Updating `tailwind.config.js` for theme customization
3. Adding custom CSS in `frontend/src/index.css`

## 🔐 Security Considerations

- **Private Keys**: Never commit private keys or mnemonics to version control
- **Network Security**: Use secure RPC endpoints for production deployments
- **Input Validation**: All user inputs are validated both client-side and on-chain
- **Access Control**: Dataset ownership is enforced by the smart contract

## 🚀 Deployment

### Production Deployment

1. **Deploy to a testnet or mainnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

2. **Update frontend configuration** with the new contract address

3. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

4. **Deploy the built files** to your hosting provider

### Supported Networks

- Hardhat Local (development)
- Ethereum Sepolia (testnet)
- Ethereum Mainnet (production)
- Polygon Mumbai (testnet)
- Polygon Mainnet (production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Join our community discussions

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- RainbowKit for excellent Web3 wallet integration
- The Ethereum and Web3 community for inspiration and tools

---

**VeriSynth** - Ensuring synthetic data integrity through blockchain technology.