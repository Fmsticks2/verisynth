// API endpoint for creating signed upload URLs
// This would typically be deployed as a serverless function or API route

import { createSignedUploadUrl } from './pinata';

export interface CreateSignedUrlRequest {
  expires?: number;
  mimeTypes?: string[];
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
 * API handler for creating signed upload URLs
 * This should be deployed as a serverless function to keep API keys secure
 */
export async function handleCreateSignedUrl(
  request: CreateSignedUrlRequest
): Promise<CreateSignedUrlResponse> {
  try {
    const { expires = 3600, mimeTypes } = request;

    // Validate expires time (max 24 hours for security)
    if (expires > 86400) {
      return {
        success: false,
        error: 'Expires time cannot exceed 24 hours (86400 seconds)'
      };
    }

    const result = await createSignedUploadUrl(expires, mimeTypes);

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

// For use in Vite/development environment
export async function getSignedUploadUrl(
  expires: number = 3600,
  mimeTypes?: string[]
): Promise<string> {
  try {
    // Check if we're in a development environment
    if (import.meta.env.DEV) {
      // In development, try to create signed URL directly (may fail due to CORS)
      // This is a fallback approach for development
      console.warn('Creating signed URL in client-side development mode. In production, this should be done server-side.');
      
      try {
        const result = await createSignedUploadUrl(expires, mimeTypes);
        return result.url;
      } catch (error) {
        console.warn('Client-side signed URL creation failed:', error);
        throw new Error('Signed URL creation failed. Please configure a server-side endpoint for production use.');
      }
    } else {
      // In production, make an HTTP request to the Netlify Function
      const response = await fetch('/.netlify/functions/create-signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires,
          mimeTypes
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create signed URL');
      }

      return data.data.url;
    }
  } catch (error) {
    console.error('Failed to get signed upload URL:', error);
    throw error;
  }
}