import { PinataSDK } from 'pinata';

// Initialize Pinata SDK with JWT from environment
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "example-gateway.mypinata.cloud"
});

export interface SignedUploadResult {
  url: string;
  expires: number;
}

export async function createSignedUploadUrl(
  expires: number = 3600,
  mimeTypes?: string[]
): Promise<SignedUploadResult> {
  try {
    const options: any = {
      expires
    };

    if (mimeTypes && mimeTypes.length > 0) {
      options.mimeTypes = mimeTypes;
    }

    // Use the correct method for creating signed URLs
    const url = await pinata.upload.createSignedURL(options);
    
    return {
      url,
      expires
    };
  } catch (error) {
    console.error('Error creating signed upload URL:', error);
    throw new Error('Failed to create signed upload URL');
  }
}