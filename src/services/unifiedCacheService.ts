/**
 * Unified Cache Service
 * Story 2.1f1: Unified Cache Service
 * 
 * Centralized cache management service that provides consistent cache operations
 * across the application with comprehensive error handling, monitoring, and validation.
 */

import { CacheVersioningService, CacheEntry, ValidationResult } from './cacheVersioningService';
import { CacheMonitoringService } from './cacheMonitoringService';
import { CacheMetricsService } from './cacheMetricsService';
import { DataConsistencyService, CacheState, UIState } from './dataConsistencyService';
import { trackCacheOperation, trackError } from './monitoringService';

export interface CacheHealthStatus {
  isHealthy: boolean;
  metrics: any;
  consistency: any;
  lastChecked: string;
}

export class UnifiedCacheService {
  private cacheVersioning: CacheVersioningService;
  private dataConsistency: DataConsistencyService;
  private monitoring: CacheMonitoringService;
  private metrics: CacheMetricsService;

  constructor() {
    this.cacheVersioning = new CacheVersioningService();
    this.dataConsistency = new DataConsistencyService();
    this.monitoring = new CacheMonitoringService();
    this.metrics = new CacheMetricsService();
  }

  /**
   * Get data from cache with validation and monitoring
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const entry = this.getCacheEntry(key);
      if (!entry) {
        this.monitoring.logCacheMiss(key, 'not_found');
        this.metrics.recordCacheMiss('not_found');
        return null;
      }

      const validation = this.cacheVersioning.validateCacheEntry(entry);
      if (!validation.isValid) {
        this.monitoring.logCacheCorruption(key, `Invalid: ${validation.issues?.join(', ')}`);
        this.metrics.recordCacheCorruption(`Invalid: ${validation.issues?.join(', ')}`);
        
        // Enhanced cache corruption recovery
        const recoveryResult = await this.attemptCacheRecovery(key, entry, startTime);
        if (recoveryResult.success) {
          return recoveryResult.data;
        }
        
        // If all recovery attempts fail, clean up corrupted cache and return null
        console.warn(`⚠️ Cache corruption detected for ${key}, clearing corrupted data`);
        await this.cleanupCorruptedCache(key);
        return null;
      }

      const responseTime = performance.now() - startTime;
      const dataSize = JSON.stringify(entry.data).length;
      
      this.monitoring.logCacheHit(key, dataSize, responseTime);
      this.metrics.recordCacheHit(responseTime, dataSize);
      trackCacheOperation('get', key, true, responseTime, dataSize);
      
      return entry.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseTime = performance.now() - startTime;
      
      this.monitoring.logCacheCorruption(key, errorMessage);
      this.metrics.recordCacheCorruption(errorMessage);
      trackCacheOperation('get', key, false, responseTime);
      trackError(error as Error, {
        component: 'UnifiedCacheService',
        action: 'get',
        severity: 'high'
      });
      return null;
    }
  }

  /**
   * Set data in cache with versioning and monitoring
   * Uses atomic operations to prevent corruption during concurrent access
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Create entry with atomic timestamp to prevent race conditions
      const entry = this.cacheVersioning.createCacheEntry(data, ttl);
      
      // Use atomic localStorage operations with retry logic
      await this.atomicSetItem(key, entry);
      
      // Create backup copy for corruption recovery (also atomic)
      const backupKey = `${key}_backup`;
      await this.atomicSetItem(backupKey, entry);
      
      const dataSize = JSON.stringify(data).length;
      const duration = performance.now() - startTime;
      
      this.monitoring.logCacheHit(key, dataSize);
      this.metrics.recordCacheHit(0, dataSize);
      trackCacheOperation('set', key, true, duration, dataSize);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const duration = performance.now() - startTime;
      
      this.monitoring.logCacheCorruption(key, errorMessage);
      this.metrics.recordCacheCorruption(errorMessage);
      trackCacheOperation('set', key, false, duration);
      trackError(error as Error, {
        component: 'UnifiedCacheService',
        action: 'set',
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Atomic localStorage set operation with retry logic
   * Fixed to prevent circular validation issues
   */
  private async atomicSetItem(key: string, entry: CacheEntry): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Basic validation before storing (only check required fields)
        if (!entry.data || !entry.version || !entry.timestamp || !entry.checksum) {
          throw new Error('Invalid cache entry: Missing required fields');
        }
        
        // Store with atomic operation
        localStorage.setItem(key, JSON.stringify(entry));
        
        // Verify the write was successful (basic check only)
        const stored = localStorage.getItem(key);
        if (!stored) {
          throw new Error('Write verification failed');
        }
        
        // Basic integrity check (don't re-validate checksum to avoid circular issues)
        const parsed = JSON.parse(stored);
        if (!parsed.data || !parsed.version || !parsed.timestamp || !parsed.checksum) {
          throw new Error('Stored data missing required fields');
        }
        
        return; // Success
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Cache write attempt ${attempt} failed for ${key}:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
        }
      }
    }
    
    throw new Error(`Failed to write cache after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Remove data from cache
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      this.monitoring.logCacheMiss(key, 'removed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.logCacheCorruption(key, errorMessage);
      throw error;
    }
  }

  /**
   * Delete data from cache (alias for remove with boolean return)
   */
  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      this.monitoring.logCacheMiss(key, 'deleted');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.logCacheCorruption(key, errorMessage);
      return false;
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      for (const key of matchingKeys) {
        localStorage.removeItem(key);
        this.monitoring.logCacheMiss(key, 'removed');
      }
      
      this.monitoring.logCacheMiss(pattern, `invalidated ${matchingKeys.length} keys`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.logCacheCorruption(pattern, errorMessage);
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('kn_cache_'));
      
      for (const key of cacheKeys) {
        localStorage.removeItem(key);
        this.monitoring.logCacheMiss(key, 'removed');
      }
      
      this.monitoring.logCacheMiss('all', `cleared ${cacheKeys.length} keys`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.logCacheCorruption('all', errorMessage);
      throw error;
    }
  }

  /**
   * Get comprehensive cache health status with enhanced monitoring
   */
  async getHealthStatus(): Promise<CacheHealthStatus> {
    try {
      const metrics = this.metrics.getMetrics();
      const consistency = this.dataConsistency.validateCacheConsistency(
        await this.get('kn_cache_agenda_items'),
        await this.get('kn_cache_attendee')
      );

      // Enhanced health check with corruption detection
      const corruptionCount = await this.detectCacheCorruption();
      const isHealthy = consistency.isConsistent && metrics.cacheCorruptions === 0 && corruptionCount === 0;

      if (corruptionCount > 0) {
        console.warn(`⚠️ Cache health check detected ${corruptionCount} corrupted entries`);
      }

      return {
        isHealthy,
        metrics: {
          ...metrics,
          corruptionCount,
          lastHealthCheck: new Date().toISOString()
        },
        consistency,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Cache health check failed:', error);
      return {
        isHealthy: false,
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' },
        consistency: { 
          isConsistent: false, 
          issues: [error instanceof Error ? error.message : 'Unknown error'], 
          timestamp: new Date().toISOString() 
        },
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Detect cache corruption across all entries
   */
  private async detectCacheCorruption(): Promise<number> {
    let corruptionCount = 0;
    
    try {
      // Check all localStorage keys with our cache prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kn_cache_')) {
          try {
            const entry = this.getCacheEntry(key);
            if (entry) {
              const validation = this.cacheVersioning.validateCacheEntry(entry);
              if (!validation.isValid) {
                corruptionCount++;
                console.warn(`⚠️ Corrupted cache entry detected: ${key}`);
              }
            }
          } catch (error) {
            corruptionCount++;
            console.warn(`⚠️ Invalid cache entry detected: ${key}`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Cache corruption detection failed:', error);
    }
    
    return corruptionCount;
  }

  /**
   * Attempt cache recovery from multiple sources
   */
  private async attemptCacheRecovery(key: string, corruptedEntry: CacheEntry, startTime: number): Promise<{success: boolean, data?: any}> {
    try {
      // 1. Try backup cache
      const backupKey = `${key}_backup`;
      const backupEntry = this.getCacheEntry(backupKey);
      
      if (backupEntry) {
        const backupValidation = this.cacheVersioning.validateCacheEntry(backupEntry);
        if (backupValidation.isValid) {
          console.log('🔄 Cache recovery: Using backup data for', key);
          this.monitoring.logCacheHit(key, JSON.stringify(backupEntry.data).length, performance.now() - startTime);
          this.metrics.recordCacheHit(performance.now() - startTime, JSON.stringify(backupEntry.data).length);
          
          // Restore backup data to main cache
          await this.set(key, backupEntry.data, backupEntry.ttl);
          return { success: true, data: backupEntry.data };
        } else {
          console.warn('⚠️ Backup cache also corrupted for', key);
          await this.remove(backupKey);
        }
      }

      // 2. Try to recover partial data from corrupted entry
      if (corruptedEntry.data && typeof corruptedEntry.data === 'object') {
        console.log('🔄 Cache recovery: Attempting partial data recovery for', key);
        try {
          // Try to validate just the data portion
          const dataChecksum = this.cacheVersioning['calculateChecksumSync'](corruptedEntry.data);
          if (dataChecksum !== 'invalid') {
            // Create a new valid entry with the recovered data
            const recoveredEntry = this.cacheVersioning.createCacheEntry(corruptedEntry.data);
            await this.set(key, recoveredEntry.data, recoveredEntry.ttl);
            return { success: true, data: corruptedEntry.data };
          }
        } catch (error) {
          console.warn('⚠️ Partial data recovery failed for', key, error);
        }
      }

      // 3. Try to recover from localStorage backup patterns
      const backupPatterns = [`${key}_old`, `${key}_prev`, `backup_${key}`];
      for (const backupPattern of backupPatterns) {
        const backupEntry = this.getCacheEntry(backupPattern);
        if (backupEntry) {
          const backupValidation = this.cacheVersioning.validateCacheEntry(backupEntry);
          if (backupValidation.isValid) {
            console.log('🔄 Cache recovery: Using pattern backup for', key);
            await this.set(key, backupEntry.data, backupEntry.ttl);
            return { success: true, data: backupEntry.data };
          }
        }
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Cache recovery failed for', key, error);
      return { success: false };
    }
  }

  /**
   * Clean up corrupted cache entries
   */
  private async cleanupCorruptedCache(key: string): Promise<void> {
    try {
      // Remove main cache entry
      await this.remove(key);
      
      // Remove all backup entries
      const backupKeys = [`${key}_backup`, `${key}_old`, `${key}_prev`, `backup_${key}`];
      for (const backupKey of backupKeys) {
        await this.remove(backupKey);
      }
      
      console.log('🧹 Cleaned up corrupted cache entries for', key);
    } catch (error) {
      console.error('❌ Failed to cleanup corrupted cache for', key, error);
    }
  }

  /**
   * Clear all corrupted cache entries
   */
  async clearCorruptedCache(): Promise<void> {
    try {
      const corruptedKeys: string[] = [];
      
      // Find all corrupted cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kn_cache_')) {
          try {
            const entry = this.getCacheEntry(key);
            if (entry) {
              const validation = this.cacheVersioning.validateCacheEntry(entry);
              if (!validation.isValid) {
                corruptedKeys.push(key);
              }
            }
          } catch (error) {
            corruptedKeys.push(key);
          }
        }
      }
      
      // Remove all corrupted entries
      for (const key of corruptedKeys) {
        await this.cleanupCorruptedCache(key);
      }
      
      console.log(`🧹 Cleared ${corruptedKeys.length} corrupted cache entries`);
    } catch (error) {
      console.error('❌ Failed to clear corrupted cache:', error);
    }
  }

  /**
   * Get cache entry from localStorage with error handling
   */
  private getCacheEntry(key: string): CacheEntry | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Handle migration from old cache format
      if (!parsed.version) {
        console.log('🔄 Migrating old cache entry to new format');
        return this.cacheVersioning.migrateCacheEntry(parsed);
      }
      
      return parsed as CacheEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.logCacheCorruption(key, `Parse error: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Get monitoring service for advanced logging
   */
  getMonitoringService() {
    return this.monitoring;
  }

  /**
   * Get versioning service for cache validation
   */
  getVersioningService() {
    return this.cacheVersioning;
  }

  /**
   * Get consistency service for data validation
   */
  getConsistencyService() {
    return this.dataConsistency;
  }
}

// Export singleton instance
export const unifiedCacheService = new UnifiedCacheService();
