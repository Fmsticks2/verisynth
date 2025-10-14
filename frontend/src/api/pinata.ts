import { PinataSDK } from 'pinata';

// Server-side Pinata client (uses different env var for security)
const pinata = new PinataSDK({
  pinataJwt: (typeof process !== 'undefined' ? process.env.PINATA_JWT : undefined) || import.meta.env.VITE_PINATA_JWT,
  pinataGateway: 'gateway.pinata.cloud',
});

export interface SignedUrlResponse {
  url: string;
  expires: number;
}

/**
 * Create a signed upload URL for Pinata
 * This should be called from a server-side endpoint to keep API keys secure
 */
export async function createSignedUploadUrl(
  expires: number = 3600, // 1 hour default
  mimeTypes?: string[]
): Promise<SignedUrlResponse> {
  try {
    // Check if Pinata JWT is configured
    const jwt = (typeof process !== 'undefined' ? process.env.PINATA_JWT : undefined) || import.meta.env.VITE_PINATA_JWT;
    if (!jwt || jwt === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set PINATA_JWT environment variable.');
    }

    const signedUrl = await pinata.upload.private.createSignedURL({
      expires,
      mimeTypes: mimeTypes || ['application/json', 'text/plain', '*/*']
    });

    return {
      url: signedUrl,
      expires
    };
  } catch (error) {
    console.error('Failed to create signed upload URL:', error);
    throw new Error(`Failed to create signed upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}