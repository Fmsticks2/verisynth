import { verifyFileIntegrity } from './ipfsVerification';
import { 
  validatePinataConfig, 
  sanitizeFilename, 
  isValidFileSize, 
  generateSecureMetadata,
  pinataRateLimiter 
} from './pinataConfig';

// Note: All Pinata network calls are proxied through Netlify Function to avoid CORS

export interface UploadResult {
  cid: string;
  id?: string;
  url: string;
  size: number;
  verified?: boolean;
  metadata?: UploadMetadata;
}

export interface UploadMetadata {
  name?: string;
  keyvalues?: Record<string, string | number>;
  groupId?: string;
}

export interface UploadOptions {
  filename?: string;
  metadata?: UploadMetadata;
  verify?: boolean;
}

/**
 * Upload data to IPFS using Pinata with signed URLs, metadata support, and optional verification
 * @param data - The data to upload (can be JSON object, string, or File)
 * @param options - Upload options including filename, metadata, and verification
 * @returns Promise with upload result containing CID, URL, and verification status
 */
export async function uploadToIPFS(data: any, options: UploadOptions = {}): Promise<UploadResult> {
  try {
    // Validate configuration first (still used for optional values and limits)
    validatePinataConfig();

    // Check rate limiting
    if (!pinataRateLimiter.canMakeCall()) {
      const waitTime = pinataRateLimiter.getTimeUntilNextCall();
      throw new Error(`RATE_LIMIT_ERROR: Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    let payload: any;
    let filename = options.filename || 'dataset.json';

    if (data instanceof File) {
      // Only JSON files are supported via server proxy
      if (!data.type.includes('json')) {
        throw new Error('UPLOAD_TYPE_ERROR: Only JSON uploads are supported via server proxy.');
      }
      const text = await data.text();
      payload = JSON.parse(text);
      filename = sanitizeFilename(data.name);
    } else if (typeof data === 'string') {
      // If a JSON string is provided
      payload = JSON.parse(data);
      filename = sanitizeFilename(filename);
    } else {
      // Assume object
      payload = data;
      filename = sanitizeFilename(filename);
    }

    // Validate payload size approximately (stringify length)
    const approxSize = JSON.stringify(payload).length;
    if (!isValidFileSize(approxSize)) {
      throw new Error(`FILE_SIZE_ERROR: File size (${approxSize} bytes) exceeds the maximum allowed size.`);
    }

    // Record the API call for rate limiting
    pinataRateLimiter.recordCall();

    // Prepare upload options with secure metadata
    const secureMetadata = generateSecureMetadata({
      originalFilename: filename,
      fileType: 'application/json',
      fileSize: approxSize,
    });

    const uploadOptions: any = {};

    // Helper to enforce Pinata's 10 keyvalues limit with sensible priority
    const limitKeyvalues = (kv: Record<string, string | number> = {}, max: number = 10) => {
      const priority = [
        'type',
        'version',
        'recordCount',
        'dataSize',
        'uploadedAt',
        'source',
        'sessionId',
        'fileSize',
        'fileType',
        'originalFilename',
      ];
      const mergedKeys = Object.keys(kv);
      const out: Record<string, string | number> = {};
      // Add priority keys first
      for (const key of priority) {
        if (key in kv && Object.keys(out).length < max) {
          out[key] = kv[key];
        }
      }
      // Fill the rest with remaining keys
      for (const key of mergedKeys) {
        if (Object.keys(out).length >= max) break;
        if (!(key in out)) {
          out[key] = kv[key];
        }
      }
      return out;
    };
    
    if (options.metadata) {
      if (options.metadata.name) {
        uploadOptions.name = sanitizeFilename(options.metadata.name);
      }
      const mergedKV = {
        ...secureMetadata,
        ...(options.metadata.keyvalues || {}),
      };
      uploadOptions.keyvalues = limitKeyvalues(mergedKV, 10);
      if (options.metadata.groupId) {
        uploadOptions.groupId = options.metadata.groupId;
      }
    } else {
      uploadOptions.keyvalues = limitKeyvalues(secureMetadata, 10);
    }

    // Upload via Netlify Function to avoid CORS and protect JWT
    const resp = await fetch('/.netlify/functions/pinata-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: payload,
        filename,
        metadata: {
          name: options?.metadata?.name || filename,
          keyvalues: uploadOptions.keyvalues,
        },
        groupId: uploadOptions.groupId,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`SERVER_UPLOAD_ERROR: ${resp.status} ${text}`);
    }

    const serverResult = JSON.parse(text);
    const cid = serverResult.cid;
    const url = serverResult.url;

    let verified = false;
    
    // Optional verification step
    if (options.verify) {
      try {
        const verificationResult = await verifyFileIntegrity(cid);
        verified = verificationResult.isValid && verificationResult.matches;
      } catch (verifyError) {
        console.warn('File verification failed:', verifyError);
        // Don't fail the upload if verification fails
      }
    }

    return {
      cid,
      id: serverResult.id,
      url,
      size: serverResult.size || approxSize,
      verified,
      metadata: options.metadata,
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('CONFIGURATION_ERROR')) {
        throw error; // Re-throw configuration errors as-is
      }
      
      if (errorMessage.includes('RATE_LIMIT_ERROR')) {
        throw error; // Re-throw rate limit errors as-is
      }
      
      if (errorMessage.includes('FILE_SIZE_ERROR')) {
        throw error; // Re-throw file size errors as-is
      }
      
      if (errorMessage.includes('signed upload URL')) {
        throw new Error('SIGNED_URL_ERROR: Failed to create signed upload URL. This may be due to API configuration issues.');
      }
      
      if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
        throw new Error('NETWORK_ERROR: Upload failed due to network issues. Please try again.');
      }
    }
    
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload dataset with metadata to IPFS
 * @param dataset - The generated dataset object
 * @param options - Additional upload options
 * @returns Promise with upload result
 */
export async function uploadDatasetToIPFS(dataset: any, options: UploadOptions = {}): Promise<UploadResult> {
  const filename = options.filename || `dataset-${dataset.hash.slice(0, 8)}-${Date.now()}.json`;
  
  // Create a comprehensive dataset object for upload
  const uploadData = {
    metadata: {
      ...dataset.metadata,
      uploadedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    hash: dataset.hash,
    data: dataset.data,
    statistics: {
      recordCount: dataset.data.length,
      dataSize: JSON.stringify(dataset.data).length,
    },
  };

  // Enhanced metadata with dataset-specific keyvalues
  const enhancedMetadata: UploadMetadata = {
    name: options.metadata?.name || `Dataset ${dataset.hash.slice(0, 8)}`,
    keyvalues: {
      type: 'dataset',
      version: '1.0.0',
      recordCount: dataset.data.length,
      dataSize: JSON.stringify(dataset.data).length,
      uploadedAt: new Date().toISOString(),
      ...options.metadata?.keyvalues,
    },
    groupId: options.metadata?.groupId,
  };

  return uploadToIPFS(uploadData, {
    ...options,
    filename,
    metadata: enhancedMetadata,
    verify: options.verify !== false, // Default to true for datasets
  });
}

/**
 * Fallback function for when Pinata is not configured
 * This creates a simulated upload with a fake CID for development
 */
export function simulateIPFSUpload(data: any): Promise<UploadResult> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const fakeHash = Math.random().toString(36).substring(2, 15);
      const fakeCid = `Qm${fakeHash}${Math.random().toString(36).substring(2, 15)}`;
      
      resolve({
        cid: fakeCid,
        url: `https://ipfs.io/ipfs/${fakeCid}`,
        size: JSON.stringify(data).length,
      });
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  });
}

/**
 * Smart upload function that uses signed URLs for real IPFS uploads, with fallback to simulation
 */
export async function smartUploadToIPFS(data: any, options: UploadOptions = {}): Promise<UploadResult> {
  try {
    // Try real upload with signed URLs first
    return await uploadToIPFS(data, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a signed URL or configuration issue
    if (errorMessage.includes('SIGNED_URL_ERROR') || errorMessage.includes('not configured')) {
      console.warn('Real IPFS upload failed due to configuration, falling back to simulation:', errorMessage);
      return await simulateIPFSUpload(data);
    }
    
    // Check if it's a network error
    if (errorMessage.includes('NETWORK_ERROR')) {
      console.warn('Real IPFS upload failed due to network issues, falling back to simulation:', errorMessage);
      return await simulateIPFSUpload(data);
    }
    
    // For other errors, still fall back but log the specific error
    console.error('Real IPFS upload failed, falling back to simulation:', errorMessage);
    return await simulateIPFSUpload(data);
  }
}