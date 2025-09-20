/**
 * Cache Versioning Service
 * 
 * Provides cache versioning, TTL validation, and data integrity checks
 * to ensure cache health and prevent stale data issues.
 */

export interface CacheEntry {
  data: any;
  version: string;
  timestamp: string;
  ttl: number;
  checksum: string;
}

export interface ValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isVersionValid: boolean;
  isChecksumValid: boolean;
  age: number;
  issues?: string[];
}

export class CacheVersioningService {
  private readonly CACHE_VERSION = '2.1.0';
  private readonly TTL_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TTL_SHORT = 5 * 60 * 1000; // 5 minutes for critical data
  private readonly TTL_LONG = 7 * 24 * 60 * 60 * 1000; // 7 days for static data

  /**
   * Create a new cache entry with versioning and TTL
   */
  createCacheEntry(data: any, ttl?: number, customVersion?: string): CacheEntry {
    const version = customVersion || this.CACHE_VERSION;
    const entryTTL = ttl || this.getDefaultTTL(data);
    
    return {
      data,
      version,
      timestamp: new Date().toISOString(),
      ttl: entryTTL,
      checksum: this.calculateChecksum(data)
    };
  }

  /**
   * Validate a cache entry for freshness, version, and integrity
   */
  validateCacheEntry(entry: CacheEntry): ValidationResult {
    const now = Date.now();
    const entryTime = new Date(entry.timestamp).getTime();
    const age = now - entryTime;
    const isExpired = age > entry.ttl;
    const isVersionValid = entry.version === this.CACHE_VERSION;
    const isChecksumValid = entry.checksum === this.calculateChecksum(entry.data);
    
    const issues: string[] = [];
    
    if (isExpired) {
      issues.push(`Cache entry expired (age: ${Math.round(age / 1000)}s, TTL: ${Math.round(entry.ttl / 1000)}s)`);
    }
    
    if (!isVersionValid) {
      issues.push(`Cache version mismatch (expected: ${this.CACHE_VERSION}, got: ${entry.version})`);
    }
    
    if (!isChecksumValid) {
      issues.push('Cache data integrity check failed (checksum mismatch)');
    }

    return {
      isValid: !isExpired && isVersionValid && isChecksumValid,
      isExpired,
      isVersionValid,
      isChecksumValid,
      age,
      issues
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
   * Calculate checksum for data integrity validation
   */
  private calculateChecksum(data: any): string {
    try {
      const jsonString = JSON.stringify(data, Object.keys(data).sort());
      // Use a more robust hash function
      let hash = 5381; // DJB2 hash seed
      for (let i = 0; i < jsonString.length; i++) {
        hash = ((hash << 5) + hash) + jsonString.charCodeAt(i);
      }
      // Add timestamp component for uniqueness
      const timestamp = Date.now().toString(16).slice(-4);
      return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 12) + timestamp;
    } catch (error) {
      console.warn('⚠️ Failed to calculate checksum:', error);
      return 'invalid';
    }
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
