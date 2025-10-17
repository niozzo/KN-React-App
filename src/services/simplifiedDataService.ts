/**
 * Simplified Data Service
 * Cache Simplification Refactor
 * 
 * Single source of truth for data access with localStorage-first pattern.
 * Replaces complex multi-layer cache architecture with simple, maintainable approach.
 */

import { BaseService } from './baseService.ts';

export interface CacheEntry {
  data: any;
  timestamp: number;
  tableName: string;
}

export interface DataServiceResult {
  success: boolean;
  data: any;
  fromCache: boolean;
  error?: string;
}

export class SimplifiedDataService extends BaseService {
  private readonly CACHE_PREFIX = 'kn_cache_';
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get data from cache or fetch from database
   * @param tableName - Name of the table to fetch
   * @returns Promise<DataServiceResult>
   */
  async getData(tableName: string): Promise<DataServiceResult> {
    try {
      // Check localStorage first (primary cache)
      const cached = this.getFromCache(tableName);
      if (cached) {
        console.log(`✅ LOCALSTORAGE: Using cached data for ${tableName} (${cached.length} records)`);
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }

      // No cache - fetch from database
      console.log(`🌐 FETCH: No cache found for ${tableName}, fetching from database...`);
      const freshData = await this.fetchFromDatabase(tableName);
      
      // Store in cache
      this.setCache(tableName, freshData);
      
      return {
        success: true,
        data: freshData,
        fromCache: false
      };

    } catch (error) {
      console.error(`❌ ERROR: Failed to get data for ${tableName}:`, error);
      return {
        success: false,
        data: null,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all cache entries (for logout)
   */
  clearCache(): void {
    try {
      console.log('🗑️ Clearing all cache entries...');
      
      // Clear all cache_ prefixed entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`✅ Cleared ${keysToRemove.length} cache entries`);
      
      // Clear service worker cache
      this.clearServiceWorkerCache();
      
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Refresh data in background (optional)
   * @param tableName - Name of the table to refresh
   */
  async refreshInBackground(tableName: string): Promise<void> {
    try {
      if (!navigator.onLine) {
        console.log(`📴 Offline - skipping background refresh for ${tableName}`);
        return;
      }

      console.log(`🔄 Background refresh for ${tableName}...`);
      const freshData = await this.fetchFromDatabase(tableName);
      this.setCache(tableName, freshData);
      console.log(`✅ Background refresh completed for ${tableName}`);
      
    } catch (error) {
      console.warn(`⚠️ Background refresh failed for ${tableName}:`, error);
    }
  }

  /**
   * Get data from localStorage cache
   * @param tableName - Name of the table
   * @returns Cached data or null
   */
  private getFromCache(tableName: string): any | null {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      console.log(`🔍 CACHE CHECK: Looking for key "${cacheKey}"`);
      
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`❌ CACHE MISS: No data found for key "${cacheKey}"`);
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      console.log(`📦 CACHE FOUND: Data for ${tableName} (${entry.data?.length || 0} records, age: ${Date.now() - entry.timestamp}ms)`);
      
      // Check if cache is expired
      const now = Date.now();
      if (now - entry.timestamp > this.CACHE_EXPIRY_MS) {
        console.log(`⏰ CACHE EXPIRED: Removing expired cache for ${tableName}`);
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ CACHE VALID: Returning cached data for ${tableName}`);
      return entry.data;
      
    } catch (error) {
      console.warn(`⚠️ CACHE ERROR: Failed to read cache for ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Store data in localStorage cache
   * @param tableName - Name of the table
   * @param data - Data to cache
   */
  private setCache(tableName: string, data: any): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${tableName}`;
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        tableName
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`💾 Cached data for ${tableName}`);
      
    } catch (error) {
      console.error(`❌ Failed to cache data for ${tableName}:`, error);
    }
  }

  /**
   * Fetch data from database
   * @param tableName - Name of the table
   * @returns Fresh data from database
   */
  private async fetchFromDatabase(tableName: string): Promise<any> {
    // This will be implemented by the calling service
    // For now, return empty array as placeholder
    console.log(`🌐 Fetching ${tableName} from database...`);
    
    // The actual database fetch will be handled by ServerDataSyncService
    // This method is a placeholder for the interface
    return [];
  }

  /**
   * Clear service worker cache
   */
  private async clearServiceWorkerCache(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          // Send message to service worker to clear cache
          registration.active.postMessage({
            type: 'CLEAR_CACHE'
          });
          console.log('✅ Service worker cache clear requested');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear service worker cache:', error);
    }
  }

  /**
   * Get cache statistics (for admin dashboard)
   */
  getCacheStats(): { totalEntries: number; totalSize: number; entries: string[] } {
    const entries: string[] = [];
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        entries.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    
    return {
      totalEntries: entries.length,
      totalSize,
      entries
    };
  }
}

// Export singleton instance
export const simplifiedDataService = new SimplifiedDataService();
