# Pinata IPFS Setup Instructions

## Environment Variables Required

VeriSynth uses a Netlify Function proxy for uploads. Configure variables as follows:

Client (`frontend/.env`):
```env
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

Server (Netlify dashboard → Site settings → Environment variables):
```text
# Choose ONE auth method
PINATA_JWT=your_pinata_jwt_token_here
# or
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key

# Optional (for building public URLs)
PINATA_GATEWAY_URL=gateway.pinata.cloud
```

## How to Get Your Pinata JWT Token

1. Go to [Pinata.cloud](https://pinata.cloud) and create an account
2. Navigate to the API Keys section
3. Create a new API key or JWT with permissions:
   - `pinJSONToIPFS` (required)
   - `pinFileToIPFS` (optional, not used by client)
   - `unpin` (optional)
4. Add credentials to your Netlify site’s environment variables (not the client `.env`)

## Testing the Upload

1. Configure Netlify environment variables as above
2. Start the development server: `npm run dev`
3. Navigate to the Generate Panel
4. Fill in the form (seed, topic, record count)
5. Click "Generate Data" to create synthetic data
6. Click "Upload & Register" to test the real IPFS upload

## Fallback Behavior

The application includes intelligent fallback behavior:
- If server credentials are missing/invalid, upload falls back to simulation
- If upload fails, it retries with simulation and surfaces error details
- Clear user feedback and structured error messages

## Upload Process

1. **Server Proxy Upload**: Netlify Function posts JSON to Pinata (`pinJSONToIPFS`)
2. **Metadata**: Includes dataset metadata (model version, seed, topic, etc.)
3. **CID Return**: Returns the IPFS Content Identifier (CID) and gateway URL
4. **Smart Contract**: Registers the CID on-chain for verification

The uploaded data can be accessed via: `https://gateway.pinata.cloud/ipfs/{CID}`