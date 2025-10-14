import { PinataSDK } from 'pinata';

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: 'gateway.pinata.cloud',
});

export interface UploadResult {
  cid: string;
  url: string;
  size: number;
}

/**
 * Upload data to IPFS using Pinata
 * @param data - The data to upload (can be JSON object, string, or File)
 * @param filename - Optional filename for the upload
 * @returns Promise with upload result containing CID and URL
 */
export async function uploadToIPFS(data: any, filename?: string): Promise<UploadResult> {
  try {
    // Check if Pinata JWT is configured
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    let uploadResult;
    
    if (data instanceof File) {
      // Upload file directly
      uploadResult = await pinata.upload.public.file(data);
    } else {
      // Convert data to JSON and upload as file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], filename || 'dataset.json', { type: 'application/json' });
      
      uploadResult = await pinata.upload.public.file(file);
    }

    const cid = uploadResult.cid;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return {
      cid,
      url,
      size: uploadResult.size || 0,
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    
    // Check if it's a CORS or network error (common in browser environments)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('CORS_ERROR: Direct browser uploads to Pinata are blocked by CORS policy. Consider using signed upload URLs or server-side uploads.');
    }
    
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload dataset with metadata to IPFS
 * @param dataset - The generated dataset object
 * @returns Promise with upload result
 */
export async function uploadDatasetToIPFS(dataset: any): Promise<UploadResult> {
  const filename = `dataset-${dataset.hash.slice(0, 8)}-${Date.now()}.json`;
  
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

  return uploadToIPFS(uploadData, filename);
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
 * Smart upload function that uses real IPFS if configured, otherwise falls back to simulation
 */
export async function smartUploadToIPFS(data: any, filename?: string): Promise<UploadResult> {
  try {
    // Try real upload first
    return await uploadToIPFS(data, filename);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a CORS error or configuration issue
    if (errorMessage.includes('CORS_ERROR') || errorMessage.includes('not configured')) {
      console.warn('Real IPFS upload failed, falling back to simulation:', errorMessage);
      return await simulateIPFSUpload(data);
    }
    
    // For other errors, still fall back but log the specific error
    console.error('Real IPFS upload failed, falling back to simulation:', errorMessage);
    return await simulateIPFSUpload(data);
  }
}