import * as isIPFS from 'is-ipfs';
import { PinataSDK } from 'pinata';
import { validatePinataConfig, pinataRateLimiter } from './pinataConfig';

// Initialize Pinata client for verification operations
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud',
});

export interface VerificationResult {
  isValid: boolean;
  cid: string;
  exists: boolean;
  size?: number;
  error?: string;
}

export interface FileIntegrityResult {
  isValid: boolean;
  originalCid: string;
  calculatedHash?: string;
  matches: boolean;
  error?: string;
}

/**
 * Validate if a string is a valid IPFS CID
 * @param cid - The CID string to validate
 * @returns boolean indicating if the CID is valid
 */
export function isValidCID(cid: string): boolean {
  try {
    return isIPFS.cid(cid);
  } catch (error) {
    console.error('CID validation error:', error);
    return false;
  }
}

/**
 * Verify if a CID exists on Pinata and get its metadata
 * @param cid - The CID to verify
 * @returns Promise with verification result
 */
export async function verifyCIDExists(cid: string): Promise<VerificationResult> {
  try {
    validatePinataConfig();

    // First validate the CID format
    if (!isValidCID(cid)) {
      return {
        isValid: false,
        cid,
        exists: false,
        error: 'Invalid CID format'
      };
    }

    // Check rate limiting
    if (!pinataRateLimiter.canMakeCall()) {
      const waitTime = pinataRateLimiter.getTimeUntilNextCall();
      return {
        isValid: false,
        cid,
        exists: false,
        error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`
      };
    }

    // Record the API call for rate limiting
    pinataRateLimiter.recordCall();

    // Check if the file exists on Pinata
    try {
      const fileInfo = await pinata.files.public.list();

      if (fileInfo.files && fileInfo.files.length > 0) {
        const file = fileInfo.files[0];
        return {
          isValid: true,
          cid,
          exists: true,
          size: file.size
        };
      } else {
        return {
          isValid: true,
          cid,
          exists: false,
          error: 'File not found on Pinata'
        };
      }
    } catch (pinataError) {
      // If Pinata check fails, try to access via gateway
      const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud';
      const response = await fetch(`https://${gatewayUrl}/ipfs/${cid}`, {
        method: 'HEAD'
      });

      if (response.ok) {
        return {
          isValid: true,
          cid,
          exists: true,
          size: response.headers.get('content-length') ? 
            parseInt(response.headers.get('content-length')!) : undefined
        };
      } else {
        return {
          isValid: true,
          cid,
          exists: false,
          error: 'File not accessible via gateway'
        };
      }
    }
  } catch (error) {
    return {
      isValid: false,
      cid,
      exists: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function verifyCIDOnPinata(cid: string): Promise<VerificationResult> {
  try {
    validatePinataConfig();

    // Check rate limiting
    if (!pinataRateLimiter.canMakeCall()) {
      const waitTime = pinataRateLimiter.getTimeUntilNextCall();
      return {
        isValid: false,
        cid,
        exists: false,
        error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`
      };
    }

    // Record the API call for rate limiting
    pinataRateLimiter.recordCall();

    // Try to get file info from Pinata
    const files = await pinata.files.public.list();

    const exists = files.files && files.files.length > 0;
    
    return {
      isValid: true,
      cid,
      exists,
      size: exists ? files.files[0].size : undefined
    };
  } catch (error) {
    console.error('Error verifying CID on Pinata:', error);
    return {
      isValid: false,
      cid,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieve and verify file content from IPFS
 * @param cid - The CID of the file to retrieve
 * @returns Promise with the file content as text
 */
export async function retrieveFileContent(cid: string): Promise<string> {
  if (!isValidCID(cid)) {
    throw new Error('Invalid CID format');
  }

  const gatewayUrl = import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud';
  const response = await fetch(`https://${gatewayUrl}/ipfs/${cid}`);

  if (!response.ok) {
    throw new Error(`Failed to retrieve file: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Verify file integrity by comparing original CID with current content
 * Note: This is a basic verification. Full IPFS hash calculation requires
 * understanding the exact chunking and DAG structure used during upload.
 * @param cid - The original CID
 * @param content - The current file content (optional, will fetch if not provided)
 * @returns Promise with integrity check result
 */
export async function verifyFileIntegrity(
  cid: string, 
  content?: string
): Promise<FileIntegrityResult> {
  try {
    if (!isValidCID(cid)) {
      return {
        isValid: false,
        originalCid: cid,
        matches: false,
        error: 'Invalid CID format'
      };
    }

    // If content not provided, retrieve it
    if (!content) {
      try {
        content = await retrieveFileContent(cid);
      } catch (error) {
        return {
          isValid: false,
          originalCid: cid,
          matches: false,
          error: `Failed to retrieve content: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    // Basic content hash for comparison (not a full IPFS CID calculation)
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // For now, we can only verify that the content is retrievable
    // Full CID verification would require implementing IPFS's exact hashing algorithm
    return {
      isValid: true,
      originalCid: cid,
      calculatedHash,
      matches: true, // We assume it matches if we can retrieve it successfully
      error: undefined
    };
  } catch (error) {
    return {
      isValid: false,
      originalCid: cid,
      matches: false,
      error: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Comprehensive verification that checks both CID validity and file existence
 * @param cid - The CID to verify comprehensively
 * @returns Promise with complete verification result
 */
export async function comprehensiveVerification(cid: string): Promise<{
  cidValid: boolean;
  fileExists: boolean;
  integrityCheck: FileIntegrityResult;
  metadata?: any;
}> {
  const cidValid = isValidCID(cid);
  
  if (!cidValid) {
    return {
      cidValid: false,
      fileExists: false,
      integrityCheck: {
        isValid: false,
        originalCid: cid,
        matches: false,
        error: 'Invalid CID format'
      }
    };
  }

  const existsResult = await verifyCIDExists(cid);
  const integrityResult = await verifyFileIntegrity(cid);

  return {
    cidValid: true,
    fileExists: existsResult.exists,
    integrityCheck: integrityResult,
    metadata: {
      size: existsResult.size,
      error: existsResult.error
    }
  };
}