/**
 * Cache Versioning Service
 * 
 * Provides cache versioning, TTL validation, and data integrity checks
 * to ensure cache health and prevent stale data issues.
 */

import { toMilliseconds, isTimestampExpired, getCurrentISOString } from '../utils/timestampUtils.ts';

export interface CacheEntry {
  data: any;
  version: string;
  timestamp: string;
  ttl: number;
  checksum: string;
  source?: string;
}

export interface ValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isVersionValid: boolean;
  isChecksumValid: boolean;
  age: number;
  issues?: string[];
  corruptionLevel?: 'none' | 'expired' | 'version' | 'corrupted';
}

export class CacheVersioningService {
  private readonly CACHE_VERSION = '1.0.0';
  private readonly TTL_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TTL_SHORT = 5 * 60 * 1000; // 5 minutes for critical data
  private readonly TTL_LONG = 7 * 24 * 60 * 60 * 1000; // 7 days for static data

  /**
   * Create a new cache entry with versioning and TTL
   */
  createCacheEntry(data: any, ttl?: number, customVersion?: string, source?: string): CacheEntry {
    const version = customVersion || this.CACHE_VERSION;
    const entryTTL = ttl || this.getDefaultTTL(data);
    
    return {
      data,
      version,
      timestamp: getCurrentISOString(),
      ttl: entryTTL,
      checksum: this.calculateChecksumSync(data),
      source: source || 'unknown-service'
    };
  }

  /**
   * Validate a cache entry for freshness, version, and integrity
   */
  validateCacheEntry(entry: CacheEntry): ValidationResult {
    const isVersionValid = entry.version === this.CACHE_VERSION;
    const isChecksumValid = entry.checksum === this.calculateChecksumSync(entry.data);
    
    // Use safe timestamp validation
    const timestampValidation = isTimestampExpired(entry.timestamp, entry.ttl);
    
    const issues: string[] = [];
    let corruptionLevel: 'none' | 'expired' | 'version' | 'corrupted' = 'none';
    
    if (!timestampValidation.isValid) {
      issues.push(`Invalid timestamp: ${timestampValidation.error}`);
      corruptionLevel = 'expired';
    } else if (timestampValidation.isExpired) {
      issues.push(`Cache entry expired (age: ${Math.round(timestampValidation.age / 1000)}s, TTL: ${Math.round(entry.ttl / 1000)}s)`);
      corruptionLevel = 'expired';
    }
    
    if (timestampValidation.isFuture) {
      issues.push('Cache entry has future timestamp');
      corruptionLevel = 'expired';
    }
    
    if (!isVersionValid) {
      issues.push(`Cache version mismatch (expected: ${this.CACHE_VERSION}, got: ${entry.version})`);
      corruptionLevel = 'version';
    }
    
    if (!isChecksumValid) {
      issues.push('Cache data integrity check failed (checksum mismatch)');
      corruptionLevel = 'corrupted';
    }

    return {
      isValid: timestampValidation.isValid && !timestampValidation.isExpired && !timestampValidation.isFuture && isVersionValid && isChecksumValid,
      isExpired: timestampValidation.isExpired,
      isVersionValid,
      isChecksumValid,
      age: timestampValidation.age,
      issues: issues.length > 0 ? issues : undefined,
      corruptionLevel
    };
  }

  /**
   * Check if cache entry needs refresh based on age and TTL
   */
  needsRefresh(entry: CacheEntry, refreshThreshold: number = 0.8): boolean {
    const validation = this.validateCacheEntry(entry);
    if (!validation.isValid) {
      return true;
    }
    
    const ageRatio = validation.age / entry.ttl;
    return ageRatio > refreshThreshold;
  }

  /**
   * Get appropriate TTL based on data type
   */
  private getDefaultTTL(data: any): number {
    if (Array.isArray(data)) {
      // Dynamic data (agenda items, sessions) - shorter TTL
      if (data.some((item: any) => item.start_time || item.end_time)) {
        return this.TTL_SHORT;
      }
      // Static data (sponsors, hotels) - longer TTL
      return this.TTL_LONG;
    }
    
    // Default TTL for other data types
    return this.TTL_DEFAULT;
  }

  /**
   * Calculate checksum for data integrity validation (synchronous)
   * Enhanced with more robust hashing and error handling
   */
  private calculateChecksumSync(data: any): string {
    try {
      // Normalize data for consistent hashing
      const normalizedData = this.normalizeDataForHashing(data);
      const jsonString = JSON.stringify(normalizedData);
      
      // Use DJB2 hash for synchronous operation
      return this.calculateDJB2Checksum(jsonString);
    } catch (error) {
      console.warn('⚠️ Failed to calculate checksum:', error);
      // Return a deterministic fallback based on data type and size
      return this.calculateFallbackChecksum(data);
    }
  }

  /**
   * Calculate checksum for data integrity validation (asynchronous)
   * Enhanced with more robust hashing and error handling
   */
  private async calculateChecksum(data: any): Promise<string> {
    try {
      // Normalize data for consistent hashing
      const normalizedData = this.normalizeDataForHashing(data);
      const jsonString = JSON.stringify(normalizedData);
      
      // Use crypto.subtle for more robust hashing if available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        return await this.calculateWebCryptoChecksum(jsonString);
      }
      
      // Fallback to DJB2 hash with improved implementation
      return this.calculateDJB2Checksum(jsonString);
    } catch (error) {
      console.warn('⚠️ Failed to calculate checksum:', error);
      // Return a deterministic fallback based on data type and size
      return this.calculateFallbackChecksum(data);
    }
  }

  /**
   * Normalize data for consistent hashing
   */
  private normalizeDataForHashing(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeDataForHashing(item)).sort();
    }
    
    if (typeof data === 'object') {
      const normalized: any = {};
      Object.keys(data).sort().forEach(key => {
        normalized[key] = this.normalizeDataForHashing(data[key]);
      });
      return normalized;
    }
    
    return data;
  }

  /**
   * Calculate checksum using Web Crypto API
   */
  private async calculateWebCryptoChecksum(jsonString: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    } catch (error) {
      console.warn('⚠️ Web Crypto checksum failed, falling back to DJB2:', error);
      return this.calculateDJB2Checksum(jsonString);
    }
  }

  /**
   * Calculate checksum using DJB2 hash algorithm
   */
  private calculateDJB2Checksum(jsonString: string): string {
    let hash = 5381;
    for (let i = 0; i < jsonString.length; i++) {
      hash = ((hash << 5) + hash) + jsonString.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Calculate fallback checksum for error cases
   */
  private calculateFallbackChecksum(data: any): string {
    const dataType = Array.isArray(data) ? 'array' : typeof data;
    const dataSize = JSON.stringify(data).length;
    const timestamp = Date.now().toString(16).slice(-4);
    return `${dataType}_${dataSize}_${timestamp}`;
  }

  /**
   * Migrate old cache entries to new version
   */
  migrateCacheEntry(oldEntry: any): CacheEntry | null {
    try {
      // Handle old cache format without versioning
      if (!oldEntry.version) {
        console.log('🔄 Migrating old cache entry to new format');
        return this.createCacheEntry(oldEntry.data || oldEntry);
      }
      
      // Handle version mismatch
      if (oldEntry.version !== this.CACHE_VERSION) {
        console.log(`🔄 Migrating cache from version ${oldEntry.version} to ${this.CACHE_VERSION}`);
        return this.createCacheEntry(oldEntry.data, oldEntry.ttl);
      }
      
      return oldEntry as CacheEntry;
    } catch (error) {
      console.error('❌ Failed to migrate cache entry:', error);
      return null;
    }
  }

  /**
   * Get cache health metrics
   */
  getCacheHealthMetrics(entries: CacheEntry[]): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    versionMismatches: number;
    integrityFailures: number;
    averageAge: number;
  } {
    const metrics = {
      totalEntries: entries.length,
      validEntries: 0,
      expiredEntries: 0,
      versionMismatches: 0,
      integrityFailures: 0,
      averageAge: 0
    };

    let totalAge = 0;
    
    entries.forEach(entry => {
      const validation = this.validateCacheEntry(entry);
      totalAge += validation.age;
      
      if (validation.isValid) {
        metrics.validEntries++;
      } else {
        if (validation.isExpired) metrics.expiredEntries++;
        if (!validation.isVersionValid) metrics.versionMismatches++;
        if (!validation.isChecksumValid) metrics.integrityFailures++;
      }
    });

    metrics.averageAge = entries.length > 0 ? totalAge / entries.length : 0;
    
    return metrics;
  }
}

// Export singleton instance
export const cacheVersioningService = new CacheVersioningService();
