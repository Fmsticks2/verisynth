# Netlify Deployment Guide for VeriSynth

This guide explains how to deploy VeriSynth with a secure server-side upload proxy using Netlify Functions.

## Overview

Uploads are performed via a Netlify Function that proxies JSON payloads to Pinata (`pinJSONToIPFS`). This keeps credentials server-side and avoids browser CORS issues.

## Files Created

### 1. Netlify Function
- **`netlify/functions/pinata-upload.js`** - Server-side proxy for `pinJSONToIPFS`
- **`netlify/functions/package.json`** - Dependencies for Netlify Functions

### 2. Configuration Updates
- **`netlify.toml`** - Updated to include functions directory
- **`frontend/src/utils/ipfsUpload.ts`** - Calls the Netlify Function endpoint

## Deployment Steps

### 1. Environment Variables Setup

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```
PINATA_JWT=your_pinata_jwt_token_here
# or
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret
```

**Important**: Use `PINATA_JWT` (not `VITE_PINATA_JWT`) since this runs on the server side.

### 2. Deploy to Netlify

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: Netlify will automatically detect the configuration from `netlify.toml`
3. **Deploy**: The build will include both the frontend and the Netlify Functions

### 3. Verify Deployment

After deployment, your Function endpoint will be available at:
```
https://your-site-name.netlify.app/.netlify/functions/pinata-upload
```

## How It Works

### Development Mode
- Use `netlify dev` to run the Function locally
- Client calls `/.netlify/functions/pinata-upload`
- If the Function is unavailable, upload falls back to simulation

### Production Mode
- Frontend posts JSON payloads to `/.netlify/functions/pinata-upload`
- Netlify Function validates input and uses server credentials to pin JSON
- Returns CID and gateway URL to the client
- No CORS issues since uploads originate from the server

## Security Benefits

1. **API Key Protection**: Credentials remain on the server
2. **CORS Bypass**: Server-side uploads avoid browser CORS
3. **Input Validation**: Function validates JSON payloads and metadata
4. **Controlled Metadata**: Enforces safe defaults and limits key-value metadata

## Testing

### Local Testing
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local development with functions
netlify dev
```

### Production Testing
1. Deploy to Netlify
2. Test dataset generation with real IPFS uploads
3. Monitor function logs in Netlify dashboard

## Troubleshooting

### Common Issues

1. **"PINATA_JWT not found"**
   - Ensure environment variable is set in Netlify dashboard
   - Use `PINATA_JWT` (not `VITE_PINATA_JWT`)

2. **Function timeout**
   - Netlify Functions have a 10-second timeout on free tier
   - Consider upgrading if uploads take longer

3. **CORS errors in development**
   - Use `netlify dev` for local testing with functions
   - Or rely on simulation mode when the Function is not running

### Monitoring

- Check Netlify Function logs in dashboard
- Monitor upload success rates
- Set up error alerts for production issues

## Cost Considerations

- Netlify Functions: 125,000 requests/month on free tier
- Each dataset upload = 1 function call
- Monitor usage in Netlify dashboard

## Next Steps

1. Test the deployment thoroughly
2. Monitor function performance and errors
3. Consider implementing request throttling and caching for frequent uploads
4. Set up monitoring and alerting for production issues