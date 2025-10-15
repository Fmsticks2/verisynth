/**
 * Centralized Pinata configuration and security utilities
 */

export interface PinataConfig {
  jwt: string;
  gateway: string;
  isConfigured: boolean;
  maxFileSize: number;
  defaultExpires: number;
}

/**
 * Validate Pinata JWT token format
 * @param jwt - The JWT token to validate
 * @returns boolean indicating if the JWT format is valid
 */
export function isValidJWT(jwt: string): boolean {
  if (!jwt || typeof jwt !== 'string') {
    return false;
  }

  // Basic JWT format validation (3 parts separated by dots)
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check if it's not a placeholder
  if (jwt === 'your_pinata_jwt_token_here' || jwt.includes('placeholder')) {
    return false;
  }

  // Basic base64 validation for each part
  try {
    parts.forEach(part => {
      if (part.length === 0) {
        throw new Error('Empty JWT part');
      }
      // Add padding if needed for base64 decoding
      const padded = part + '='.repeat((4 - part.length % 4) % 4);
      atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get validated Pinata configuration
 * @returns PinataConfig object with validation status
 */
export function getPinataConfig(): PinataConfig {
  const jwt = import.meta.env.VITE_PINATA_JWT || '';
  const gateway = import.meta.env.VITE_PINATA_GATEWAY_URL || 'gateway.pinata.cloud';
  
  const isConfigured = isValidJWT(jwt);

  return {
    jwt,
    gateway,
    isConfigured,
    maxFileSize: 10 * 1024 * 1024, // 10MB default
    defaultExpires: 3600, // 1 hour default
  };
}

/**
 * Validate environment configuration and throw descriptive errors
 * @throws Error with specific configuration issues
 */
export function validatePinataConfig(): void {
  const config = getPinataConfig();
  
  // Client-side now uses server-side Netlify function for uploads,
  // so JWT presence is optional here. Log warnings instead of throwing.
  if (!config.jwt) {
    console.warn('Pinata JWT not set in client env; using server-side upload proxy.');
    return;
  }

  if (!isValidJWT(config.jwt)) {
    console.warn('Pinata JWT appears invalid in client env; using server-side upload proxy.');
    return;
  }

  if (config.jwt === 'your_pinata_jwt_token_here') {
    console.warn('Pinata JWT placeholder detected; using server-side upload proxy.');
    return;
  }
}

/**
 * Sanitize file names for safe upload
 * @param filename - The original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
}

/**
 * Validate file size against limits
 * @param fileSize - Size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns boolean indicating if size is valid
 */
export function isValidFileSize(fileSize: number, maxSize?: number): boolean {
  const limit = maxSize || getPinataConfig().maxFileSize;
  return fileSize > 0 && fileSize <= limit;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate secure metadata for uploads
 * @param additionalMetadata - Additional metadata to include
 * @returns Secure metadata object
 */
export function generateSecureMetadata(additionalMetadata: Record<string, any> = {}): Record<string, any> {
  const timestamp = new Date().toISOString();
  const sessionId = crypto.randomUUID();
  
  return {
    uploadedAt: timestamp,
    sessionId: sessionId,
    version: '1.0.0',
    source: 'verisynth-frontend',
    ...additionalMetadata,
  };
}

/**
 * Rate limiting helper for API calls
 */
export class RateLimiter {
  private calls: number[] = [];
  private readonly maxCalls: number;
  private readonly timeWindow: number;

  constructor(maxCalls: number = 10, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  /**
   * Check if a call can be made within rate limits
   * @returns boolean indicating if call is allowed
   */
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Remove calls outside the time window
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    
    return this.calls.length < this.maxCalls;
  }

  /**
   * Record a call being made
   */
  recordCall(): void {
    this.calls.push(Date.now());
  }

  /**
   * Get time until next call is allowed (in ms)
   * @returns number of milliseconds to wait, or 0 if call is allowed
   */
  getTimeUntilNextCall(): number {
    if (this.canMakeCall()) {
      return 0;
    }

    const oldestCall = Math.min(...this.calls);
    return this.timeWindow - (Date.now() - oldestCall);
  }
}

// Global rate limiter instance
export const pinataRateLimiter = new RateLimiter(10, 60000); // 10 calls per minute