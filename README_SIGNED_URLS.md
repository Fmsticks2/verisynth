# Pinata Signed URLs Implementation

This document explains the implementation of Pinata signed URLs to avoid CORS restrictions when uploading files directly from the browser.

## Overview

<mcreference link="https://docs.pinata.cloud/files/presigned-urls" index="5">Pinata signed URLs allow client-side file uploads without exposing API keys</mcreference> <mcreference link="https://docs.pinata.cloud/sdk/upload/private/create-signed-url" index="2">by creating temporary upload URLs on the server side</mcreference>.

## Implementation Details

### Files Created/Modified

1. **`src/api/pinata.ts`** - Server-side utility for creating signed URLs
2. **`src/api/upload.ts`** - API endpoint handler for signed URL generation
3. **`src/utils/ipfsUpload.ts`** - Updated to use signed URLs instead of direct API calls

### How It Works

1. **Client Request**: The frontend requests a signed upload URL
2. **Server Generation**: The server creates a temporary signed URL using the Pinata API
3. **Client Upload**: The frontend uses the signed URL to upload files directly to Pinata
4. **CORS Avoidance**: <mcreference link="https://docs.pinata.cloud/files/uploading-files" index="1">Signed URLs bypass CORS restrictions since they're pre-authorized</mcreference>

### Development vs Production

#### Development Mode
- Signed URLs are created client-side (may still have CORS issues)
- Falls back to simulation mode if signed URL creation fails
- Logs warnings about client-side signed URL creation

#### Production Mode
- Requires a server-side endpoint to create signed URLs securely
- API keys remain protected on the server
- Better security and reliability

## Deployment Requirements

### For Production Deployment

1. **Server-Side Endpoint**: Create an API endpoint that calls `handleCreateSignedUrl()`
   ```typescript
   // Example: /api/create-signed-url
   export async function POST(request: Request) {
     const body = await request.json();
     return await handleCreateSignedUrl(body);
   }
   ```

2. **Environment Variables**: Set `PINATA_JWT` on your server (not `VITE_PINATA_JWT`)

3. **Update Client Code**: Modify `getSignedUploadUrl()` to call your production API endpoint

### Recommended Deployment Platforms

- **Vercel**: Create API routes in `pages/api/` or `app/api/`
- **Netlify**: Use Netlify Functions
- **AWS Lambda**: Deploy as serverless functions
- **Express.js**: Add as a regular API endpoint

## Security Benefits

1. **API Key Protection**: <mcreference link="https://docs.pinata.cloud/files/uploading-files" index="1">Admin API keys stay safe behind the server</mcreference>
2. **Time-Limited URLs**: Signed URLs expire after a specified time (default: 1 hour)
3. **File Type Restrictions**: Can specify allowed MIME types
4. **Size Limitations**: Can set maximum file sizes

## Error Handling

The implementation includes comprehensive error handling:

- **SIGNED_URL_ERROR**: Issues with creating signed URLs
- **NETWORK_ERROR**: Network connectivity problems
- **Fallback Mode**: Automatically falls back to simulation if real uploads fail

## Testing

The current implementation will:
1. Attempt to create signed URLs in development mode
2. Fall back to simulation mode if signed URL creation fails
3. Log appropriate warnings and errors for debugging

## Next Steps for Production

1. Deploy a server-side API endpoint for signed URL generation
2. Update the client-side code to call the production endpoint
3. Test the full upload flow in production environment
4. Monitor upload success rates and error logs