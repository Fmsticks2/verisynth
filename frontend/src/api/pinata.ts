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

export interface SignedUrlOptions {
  expires?: number;
  mimeTypes?: string[];
  maxFileSize?: number;
  groupId?: string;
  keyvalues?: Record<string, string | number>;
}

/**
 * Create a signed upload URL for Pinata directly in the frontend
 * Uses the public method which is safe for client-side usage
 */
export async function createSignedUploadUrl(options: SignedUrlOptions = {}): Promise<SignedUrlResponse> {
  try {
    // Check if Pinata JWT is configured
    const jwt = import.meta.env.VITE_PINATA_JWT;
    if (!jwt || jwt === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT environment variable.');
    }

    const signedUrlOptions: any = {
      expires: options.expires || 3600, // 1 hour default
      mimeTypes: options.mimeTypes || ['application/json', 'text/plain', 'image/*', '*/*'],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
    };

    // Add optional parameters if provided
    if (options.groupId) {
      signedUrlOptions.groupId = options.groupId;
    }
    
    if (options.keyvalues) {
      signedUrlOptions.keyvalues = options.keyvalues;
    }

    const signedUrl = await pinata.upload.public.createSignedURL(signedUrlOptions);

    return {
      url: signedUrl,
      expires: signedUrlOptions.expires
    };
  } catch (error) {
    console.error('Failed to create signed upload URL:', error);
    throw new Error(`Failed to create signed upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}