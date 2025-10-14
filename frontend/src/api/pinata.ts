import { PinataSDK } from 'pinata';

// Frontend Pinata client using VITE environment variable
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud',
});

export interface SignedUrlResponse {
  url: string;
  expires: number;
}

/**
 * Create a signed upload URL for Pinata directly in the frontend
 * Uses the public method which is safe for client-side usage
 */
export async function createSignedUploadUrl(
  expires: number = 3600, // 1 hour default
  mimeTypes?: string[],
  maxFileSize?: number
): Promise<SignedUrlResponse> {
  try {
    // Check if Pinata JWT is configured
    const jwt = import.meta.env.VITE_PINATA_JWT;
    if (!jwt || jwt === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT environment variable.');
    }

    const signedUrl = await pinata.upload.public.createSignedURL({
      expires,
      mimeTypes: mimeTypes || ['application/json', 'text/plain', 'image/*', '*/*'],
      maxFileSize: maxFileSize || 10 * 1024 * 1024 // 10MB default
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