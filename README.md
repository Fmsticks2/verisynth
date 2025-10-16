# VeriSynth — Synthetic Data Integrity and Marketplace

VeriSynth is a platform for generating, registering, and verifying synthetic datasets with on-chain provenance and decentralized storage. It combines deterministic data generation, cryptographic hashing, and IPFS to ensure integrity, traceability, and repeatability.

## Overview

- Deterministic synthetic data generation with seeds and topic templates
- On-chain registration of dataset metadata and content identifiers (CIDs)
- Integrity verification via SHA-256 and CID existence checks
- IPFS uploads via a secure serverless proxy (Netlify Function)
- Wallet connection and transaction flow via RainbowKit and Wagmi
- Modern frontend built with React, TypeScript, Tailwind, and Vite

## Architecture

### Smart Contracts
- DatasetRegistry: Registers datasets with `modelVersion`, `seed`, `dataHash`, and `cid`; exposes querying and verification methods; emits `DatasetRegistered` and `DatasetVerified` events.
- DatasetMarketplace: Lists datasets with pricing and license metadata; enables purchase flows and license tracking.
- Governance: Simple proposal creation and voting for platform parameters and upgrades.

Contracts are authored in Solidity (0.8.x) and prepared for deployment to the 0G Galileo Testnet, with local Hardhat and EVM testnets available for development.

### Frontend
- React + TypeScript with Vite for fast development and builds.
- Wagmi + RainbowKit for wallet connection and chain switching; 0G testnet is the default chain (`chainId: 16602`).
- Tailwind CSS for styling; light theme via RainbowKit.
- Verification panel displays on-chain hash, computed hash, and uploaded IPFS CID with copy actions and gateway links.

### IPFS and Serverless
- Netlify Function (`netlify/functions/pinata-upload.js`) proxies `pinJSONToIPFS` to avoid CORS and protect credentials.
- Client utilities handle JSON-only uploads, secure metadata generation, rate limiting, and optional post-upload verification.
- Pinata SDK used from the client for read-only operations (CID validation, gateway conversions).

## Tech Stack

- Smart contracts: Solidity, Hardhat, OpenZeppelin
- Frontend: React, TypeScript, Vite, Tailwind, Framer Motion
- Web3: Wagmi, RainbowKit, WalletConnect
- Storage: IPFS via Pinata (serverless proxy)
- DevOps: Netlify Functions, Netlify deploy, Node 18

## Implemented Features

- Deterministic dataset generator with topic templates and seed control
- Hash-based integrity: SHA-256 over generated data
- Dataset registration on-chain (DatasetRegistry)
- Marketplace listing and purchase flow (DatasetMarketplace)
- Governance proposals and voting (Governance)
- IPFS upload (JSON) with CID returned and displayed in the UI
- Verification panel with on-chain vs computed hash, CID copy buttons, and gateway links
- Copy-to-clipboard for hashes and CIDs
- Favicon and Open Graph meta tags for professional link previews

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- A Web3 wallet (e.g., MetaMask)

### Install
```bash
git clone <repository-url>
cd verisynth
npm install
cd frontend && npm install
```

### Development

Run the frontend:
```bash
cd frontend
npm run dev
```
The app runs at `http://localhost:3000` (or next available port). 0G Galileo Testnet is the default network.

Optional: run Hardhat for local EVM testing:
```bash
cd contracts
npx hardhat node
```

### Environment

Frontend (`frontend/.env`):
```env
# WalletConnect / RainbowKit
VITE_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>

# 0G Galileo Testnet
VITE_OG_CHAIN_NAME=0G-Galileo-Testnet
VITE_OG_RPC_URL=https://evmrpc-testnet.0g.ai
VITE_OG_BLOCK_EXPLORER_URL=https://chainscan-galileo.0g.ai
VITE_OG_NATIVE_CURRENCY_NAME=OG
VITE_OG_NATIVE_CURRENCY_SYMBOL=OG
VITE_OG_NATIVE_CURRENCY_DECIMALS=18

# Pinata gateway used for reads
VITE_PINATA_GATEWAY_URL=gateway.pinata.cloud

# Optional: contract addresses for other networks
VITE_DATASET_REGISTRY_ADDRESS_OG=<deployed_address_on_0g>
VITE_DATASET_REGISTRY_ADDRESS_SEPOLIA=
VITE_DATASET_REGISTRY_ADDRESS_MUMBAI=
```

Netlify (server-side, set in dashboard):
```text
PINATA_JWT=<pinata_jwt>          # or PINATA_API_KEY and PINATA_SECRET_API_KEY
PINATA_API_KEY=<optional>
PINATA_SECRET_API_KEY=<optional>
PINATA_GATEWAY_URL=gateway.pinata.cloud
```

### IPFS Upload Flow

- Client prepares JSON dataset and metadata.
- Upload request posted to `/.netlify/functions/pinata-upload`.
- Function calls Pinata `pinJSONToIPFS` and returns `{ cid, url, size }`.
- UI displays CID with copy action and gateway link.

## Usage

- Generate: choose topic, seed, and record count; compute hash and preview.
- Register: submit on-chain transaction to register dataset with hash and CID.
- Verify: upload JSON and compare computed hash with on-chain hash; confirm CID existence.
- Marketplace: list datasets with price and license CID; purchase from connected wallet.
- Governance: create proposals and vote.

## Testing

Contracts:
```bash
cd contracts
npx hardhat test
```

Frontend:
- Manual flows across Generate, Register, Verify, Marketplace, and Governance
- Optional: run `netlify dev` to test serverless function locally

## Project Structure

```
verisynth/
├── contracts/
│   ├── contracts/
│   │   ├── DatasetRegistry.sol
│   │   ├── DatasetMarketplace.sol
│   │   └── Governance.sol
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GeneratePanel.tsx
│   │   │   ├── VerifyPanel.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   └── Governance.tsx
│   │   ├── utils/
│   │   │   ├── ipfsUpload.ts
│   │   │   ├── ipfsVerification.ts
│   │   │   ├── pinataGroups.ts
│   │   │   ├── contractConfig.ts
│   │   │   └── dataGenerator.ts
│   │   ├── wagmi.ts
│   │   └── contracts/
│   ├── public/
│   └── index.html
├── netlify/
│   └── functions/
│       └── pinata-upload.js
└── README.md
```

## Configuration Notes

- `frontend/src/wagmi.ts` sets 0G Galileo Testnet as the default chain (16602).
- `frontend/src/utils/contractConfig.ts` reads addresses from `VITE_DATASET_REGISTRY_ADDRESS_*` envs.
- IPFS uploads are JSON-only via the server proxy; provide a JSON object or a JSON file.

## Security

- Never expose admin credentials in client env; use server-side envs in Netlify.
- Validate file size and MIME type before uploads; JSON-only enforced client-side.
- Rate limiting applied to client IPFS operations to prevent abuse.
- On-chain ownership and event logs provide provenance.

## Deployment

- Netlify builds the frontend (`frontend/dist`) and exposes functions at `/.netlify/functions/*`.
- Set Netlify envs for Pinata credentials and gateway host.
- Update `VITE_DATASET_REGISTRY_ADDRESS_OG` after contract deployment to 0G.

### Supported Networks
- 0G Galileo Testnet (default)
- Hardhat (local dev)
- Ethereum Sepolia
- Polygon Mumbai

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Add tests where applicable
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Join our community discussions

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- RainbowKit for excellent Web3 wallet integration
- The Ethereum and Web3 community for inspiration and tools

---

**VeriSynth** - Ensuring synthetic data integrity through blockchain technology.

## Implementation Status (Phase 1 & Phase 3)

### Phase 1: Enhanced AI Integration — Implemented
- Integration with 0G AI computation layer for entropy: dataset generation can pull on-chain block-derived randomness to ensure distinct outputs even with similar seeds.
- Advanced synthetic data generation algorithms: toggle in Generate panel enables entropy-driven shuffling and mutation for higher diversity.
- Real-time data quality assessment: quality metrics computed at generation (record count, duplicate ratio, null ratio, numeric stats, composite score) and displayed in the UI.
- Multi-format exports: CSV, NDJSON, and HuggingFace-compatible JSON for direct use with major AI/ML tooling.

### Phase 3: Ecosystem Expansion — Initial Scaffold
- Marketplace: new tab showcasing on-chain catalog (reusing history) and marketplace feature cards for curation, creator tools, and buyer UX.
- Analytics Dashboard: session-level metrics (total datasets, avg records, last quality score, topic) with enterprise metrics roadmap.
- Governance: proposal and voting placeholders with UI components for future on-chain governance.
- Framework integration: HuggingFace JSON export, plus CSV/NDJSON for standard pipelines.

## Upcoming Work

### Phase 1 Next Steps
- Connect remote 0G compute jobs for model-assisted generation when available.
- Add optimizer presets to tailor datasets for specific AI training tasks.

### Phase 3 Next Steps
- Full marketplace backend with listing, pricing, licensing, and payments.
- Organization-wide analytics pulling on-chain/IPFS telemetry and quality trends.
- Decentralized governance contracts for proposals, voting, execution, and treasury.

## Where to Look in Code
- `frontend/src/utils/ogCompute.ts`: 0G entropy and remote compute hook.
- `frontend/src/utils/dataQuality.ts`: quality metrics calculation.
- `frontend/src/utils/dataGenerator.ts`: entropy-aware generation and hashing.
- `frontend/src/components/GeneratePanel.tsx`: UI toggles, quality display, export buttons.
- `frontend/src/components/Marketplace.tsx`: marketplace UI scaffold.
- `frontend/src/components/Analytics.tsx`: analytics dashboard scaffold.
- `frontend/src/components/Governance.tsx`: governance UI scaffold.