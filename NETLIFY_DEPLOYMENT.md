# Netlify Deployment Guide for VeriSynth

This guide explains how to deploy VeriSynth with secure server-side API endpoints using Netlify Functions.

## Overview

The application now includes a secure server-side API endpoint for generating Pinata signed URLs, which keeps your API keys safe and avoids CORS issues.

## Files Created

### 1. Netlify Function
- **`netlify/functions/create-signed-url.ts`** - Server-side function for signed URL generation
- **`netlify/functions/package.json`** - Dependencies for Netlify Functions

### 2. Configuration Updates
- **`netlify.toml`** - Updated to include functions directory
- **`frontend/src/api/upload.ts`** - Updated to call production endpoint

## Deployment Steps

### 1. Environment Variables Setup

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```
PINATA_JWT=your_pinata_jwt_token_here
```

**Important**: Use `PINATA_JWT` (not `VITE_PINATA_JWT`) since this runs on the server side.

### 2. Deploy to Netlify

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: Netlify will automatically detect the configuration from `netlify.toml`
3. **Deploy**: The build will include both the frontend and the Netlify Functions

### 3. Verify Deployment

After deployment, your API endpoint will be available at:
```
https://your-site-name.netlify.app/.netlify/functions/create-signed-url
```

## How It Works

### Development Mode
- Uses client-side signed URL creation (may have CORS issues)
- Falls back to simulation mode if signed URL creation fails
- Logs warnings about client-side usage

### Production Mode
- Frontend calls `/.netlify/functions/create-signed-url`
- Netlify Function securely creates signed URLs using server-side API key
- Returns signed URL to frontend for direct IPFS upload
- No CORS issues since the URL is pre-authorized

## Security Benefits

1. **API Key Protection**: Pinata JWT stays secure on the server
2. **CORS Bypass**: Signed URLs eliminate browser CORS restrictions
3. **Time-Limited Access**: URLs expire after specified time (default: 1 hour)
4. **Request Validation**: Server validates all requests before processing

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
   - Or rely on simulation mode for development

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
3. Consider implementing caching for frequently requested signed URLs
4. Set up monitoring and alerting for production issues