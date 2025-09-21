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
        await this.remove(key);
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
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    
    try {
      const entry = this.cacheVersioning.createCacheEntry(data, ttl);
      localStorage.setItem(key, JSON.stringify(entry));
      
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
   * Get comprehensive cache health status
   */
  async getHealthStatus(): Promise<CacheHealthStatus> {
    try {
      const metrics = this.metrics.getMetrics();
      const consistency = this.dataConsistency.validateCacheConsistency(
        await this.get('kn_cache_agenda_items'),
        await this.get('kn_cache_attendee')
      );

      return {
        isHealthy: consistency.isConsistent && metrics.cacheCorruptions === 0,
        metrics,
        consistency,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        isHealthy: false,
        metrics: null,
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
