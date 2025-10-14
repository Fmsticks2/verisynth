import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSignedUploadUrl } from './pinata-utils';

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

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST requests are supported'
      }),
    };
  }

  try {
    // Parse the request body
    let requestBody: CreateSignedUrlRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }),
      };
    }

    // Validate and set defaults
    const { expires = 3600, mimeTypes } = requestBody;

    // Validate expires time (max 24 hours for security)
    if (expires > 86400) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Expires time cannot exceed 24 hours (86400 seconds)'
        }),
      };
    }

    // Create signed URL
    const result = await createSignedUploadUrl(expires, mimeTypes);
    
    const response: CreateSignedUrlResponse = {
      success: true,
      data: result
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error in create-signed-url function:', error);
    
    const errorResponse: CreateSignedUrlResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};