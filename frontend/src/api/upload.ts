// Direct Pinata SDK usage for creating signed upload URLs in the frontend

import { createSignedUploadUrl } from './pinata';

export interface CreateSignedUrlRequest {
  expires?: number;
  mimeTypes?: string[];
  maxFileSize?: number;
}

export interface CreateSignedUrlResponse {
  success: boolean;
  data?: {
    url: string;
    expires: number;
  };
  error?: string;
}

/**
 * Create signed upload URL directly using Pinata SDK
 * Now safe to use in frontend with pinata.upload.public.createSignedURL
 */
export async function handleCreateSignedUrl(
  request: CreateSignedUrlRequest
): Promise<CreateSignedUrlResponse> {
  try {
    const { expires = 3600, mimeTypes, maxFileSize } = request;

    // Validate expires time (max 24 hours for security)
    if (expires > 86400) {
      return {
        success: false,
        error: 'Expires time cannot exceed 24 hours (86400 seconds)'
      };
    }

    const result = await createSignedUploadUrl(expires, mimeTypes, maxFileSize);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get signed upload URL directly using Pinata SDK
 * No longer requires server-side endpoint or Netlify functions
 */
export async function getSignedUploadUrl(
  expires: number = 3600,
  mimeTypes?: string[],
  maxFileSize?: number
): Promise<string> {
  try {
    const result = await createSignedUploadUrl(expires, mimeTypes, maxFileSize);
    return result.url;
  } catch (error) {
    console.error('Failed to get signed upload URL:', error);
    throw error;
  }
}