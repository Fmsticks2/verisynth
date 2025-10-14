# Pinata IPFS Setup Instructions

## Environment Variables Required

To enable real IPFS uploads using Pinata, you need to set up the following environment variables in your `.env` file:

```env
# Pinata Configuration
VITE_PINATA_JWT=your_pinata_jwt_token_here
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

## How to Get Your Pinata JWT Token

1. Go to [Pinata.cloud](https://pinata.cloud) and create an account
2. Navigate to the API Keys section in your dashboard
3. Create a new API key with the following permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS` 
   - `unpin` (optional)
4. Copy the JWT token and add it to your `.env` file

## Testing the Upload

1. Make sure your environment variables are set correctly
2. Start the development server: `npm run dev`
3. Navigate to the Generate Panel
4. Fill in the form (seed, topic, record count)
5. Click "Generate Data" to create synthetic data
6. Click "Upload & Register" to test the real IPFS upload

## Fallback Behavior

The application includes intelligent fallback behavior:
- If Pinata credentials are missing or invalid, it will fall back to simulation mode
- If the upload fails, it will retry with simulation
- All uploads include proper error handling and user feedback

## Upload Process

1. **Real Upload**: Uses Pinata SDK to upload JSON data to IPFS
2. **Metadata**: Includes dataset metadata (model version, seed, topic, etc.)
3. **CID Return**: Returns the actual IPFS Content Identifier (CID)
4. **Smart Contract**: Registers the CID on the blockchain for verification

The uploaded data can be accessed via: `https://gateway.pinata.cloud/ipfs/{CID}`