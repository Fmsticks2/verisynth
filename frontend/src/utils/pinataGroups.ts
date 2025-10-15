import { PinataSDK } from 'pinata';
import { validatePinataConfig, sanitizeFilename, pinataRateLimiter } from './pinataConfig';

// Initialize Pinata client for groups operations
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud',
});

export interface GroupInfo {
  id: string;
  name: string;
  createdAt: string;
  isPublic: boolean;
}

export interface CreateGroupOptions {
  name: string;
  isPublic?: boolean;
}

export interface GroupListOptions {
  limit?: number;
  offset?: number;
}

/**
 * Create a new Pinata group for organizing files
 * @param options - Group creation options
 * @returns Promise with the created group information
 */
export async function createGroup(options: CreateGroupOptions): Promise<GroupInfo> {
  try {
    validatePinataConfig();

    // Check rate limiting
    if (!pinataRateLimiter.canMakeCall()) {
      const waitTime = pinataRateLimiter.getTimeUntilNextCall();
      throw new Error(`RATE_LIMIT_ERROR: Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }

    // Record the API call for rate limiting
    pinataRateLimiter.recordCall();

    const group = await pinata.groups.public.create({
      name: sanitizeFilename(options.name),
      isPublic: options.isPublic || false,
    });

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      isPublic: group.is_public,
    };
  } catch (error) {
    console.error('Failed to create group:', error);
    
    if (error instanceof Error && error.message.includes('RATE_LIMIT_ERROR')) {
      throw error;
    }
    
    throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List all available groups
 * @param options - Listing options
 * @returns Promise with array of group information
 */
export async function listGroups(): Promise<GroupInfo[]> {
  try {
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    const response = await pinata.groups.public.list();

    return response.groups.map(group => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      isPublic: group.is_public,
    }));
  } catch (error) {
    console.error('Failed to list groups:', error);
    throw new Error(`Failed to list groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get information about a specific group
 * @param groupId - The ID of the group to retrieve
 * @returns Promise with group information
 */
export async function getGroup(groupId: string): Promise<GroupInfo> {
  try {
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    const group = await pinata.groups.public.get({
      groupId: groupId
    });

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      isPublic: group.is_public,
    };
  } catch (error) {
    console.error('Failed to get group:', error);
    throw new Error(`Failed to get group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a group
 * @param groupId - The ID of the group to delete
 * @returns Promise that resolves when the group is deleted
 */
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    await pinata.groups.public.delete({
      groupId: groupId
    });
  } catch (error) {
    console.error('Failed to delete group:', error);
    throw new Error(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add files to a group
 * @param groupId - The ID of the group
 * @param cids - Array of CIDs to add to the group
 * @returns Promise that resolves when files are added
 */
export async function addFilesToGroup(groupId: string, cids: string[]): Promise<void> {
  try {
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    await pinata.groups.public.addFiles({
      groupId: groupId,
      files: cids
    });
  } catch (error) {
    console.error('Failed to add files to group:', error);
    throw new Error(`Failed to add files to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove files from a group
 * @param groupId - The ID of the group
 * @param cids - Array of CIDs to remove from the group
 * @returns Promise that resolves when files are removed
 */
export async function removeFilesFromGroup(groupId: string, cids: string[]): Promise<void> {
  try {
    if (!import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT === 'your_pinata_jwt_token_here') {
      throw new Error('Pinata JWT token not configured. Please set VITE_PINATA_JWT in your .env file.');
    }

    await pinata.groups.public.removeFiles({
      groupId: groupId,
      files: cids
    });
  } catch (error) {
    console.error('Failed to remove files from group:', error);
    throw new Error(`Failed to remove files from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a dataset-specific group with predefined settings
 * @param datasetName - Name of the dataset
 * @param isPublic - Whether the group should be public
 * @returns Promise with the created group information
 */
export async function createDatasetGroup(datasetName: string, isPublic: boolean = false): Promise<GroupInfo> {
  const groupName = `Dataset: ${datasetName}`;
  
  return createGroup({
    name: groupName,
    isPublic: isPublic,
  });
}

/**
 * Get or create a group for organizing datasets
 * @param groupName - Name of the group to find or create
 * @param isPublic - Whether the group should be public if created
 * @returns Promise with group information
 */
export async function getOrCreateGroup(groupName: string, isPublic: boolean = false): Promise<GroupInfo> {
  try {
    // First, try to find an existing group with the same name
    const groups = await listGroups();
    const existingGroup = groups.find(group => group.name === groupName);
    
    if (existingGroup) {
      return existingGroup;
    }
    
    // If no existing group found, create a new one
    return await createGroup({
      name: groupName,
      isPublic: isPublic,
    });
  } catch (error) {
    console.error('Failed to get or create group:', error);
    throw new Error(`Failed to get or create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}