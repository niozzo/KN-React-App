/**
 * Timestamp Utilities
 * 
 * Centralized timestamp handling to prevent timezone and format issues
 * across the application.
 */

export interface TimestampComparison {
  isValid: boolean;
  age: number;
  isExpired: boolean;
  isFuture: boolean;
  error?: string;
}

/**
 * Safely convert any timestamp format to milliseconds since epoch
 */
export function toMilliseconds(timestamp: string | number | Date): number {
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp).getTime();
    if (isNaN(parsed)) {
      throw new Error(`Invalid timestamp string: ${timestamp}`);
    }
    return parsed;
  }
  
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  
  throw new Error(`Unsupported timestamp type: ${typeof timestamp}`);
}

/**
 * Safely convert any timestamp format to ISO string
 */
export function toISOString(timestamp: string | number | Date): string {
  if (typeof timestamp === 'string') {
    // Validate it's a proper ISO string
    const parsed = new Date(timestamp);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid timestamp string: ${timestamp}`);
    }
    return timestamp;
  }
  
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  throw new Error(`Unsupported timestamp type: ${typeof timestamp}`);
}

/**
 * Compare two timestamps and return comparison details
 */
export function compareTimestamps(
  timestamp1: string | number | Date,
  timestamp2: string | number | Date
): TimestampComparison {
  try {
    const time1 = toMilliseconds(timestamp1);
    const time2 = toMilliseconds(timestamp2);
    const now = Date.now();
    
    const age = time2 - time1;
    const isFuture = time1 > now || time2 > now;
    
    return {
      isValid: true,
      age: Math.abs(age),
      isExpired: false,
      isFuture,
      error: undefined
    };
  } catch (error) {
    return {
      isValid: false,
      age: 0,
      isExpired: true,
      isFuture: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a timestamp is expired based on TTL
 */
export function isTimestampExpired(
  timestamp: string | number | Date,
  ttl: number,
  referenceTime?: number
): TimestampComparison {
  try {
    const timestampMs = toMilliseconds(timestamp);
    const now = referenceTime || Date.now();
    const age = now - timestampMs;
    const isExpired = age > ttl;
    const isFuture = timestampMs > now;
    
    return {
      isValid: true,
      age: Math.max(0, age),
      isExpired,
      isFuture,
      error: undefined
    };
  } catch (error) {
    return {
      isValid: false,
      age: 0,
      isExpired: true,
      isFuture: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get current timestamp as ISO string
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(
  timestamp: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const timestampMs = toMilliseconds(timestamp);
    const date = new Date(timestampMs);
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
    
    return date.toLocaleString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    return `Invalid timestamp: ${timestamp}`;
  }
}

/**
 * Validate timestamp format
 */
export function isValidTimestamp(timestamp: any): boolean {
  try {
    toMilliseconds(timestamp);
    return true;
  } catch {
    return false;
  }
}
