/**
 * Cache-Aside Service
 * 
 * Implements cache-aside pattern with comprehensive validation layer
 * for data consistency and integrity.
 */

import { unifiedCacheService } from './unifiedCacheService';
import { circuitBreakerService } from './circuitBreakerService';

export interface CacheAsideConfig {
  cacheKey: string;
  dataValidator?: (data: any) => boolean;
  dataTransformer?: (data: any) => any;
  cacheTTL?: number;
  enableValidation?: boolean;
  enableTransformation?: boolean;
}

export interface CacheAsideResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'cache' | 'api' | 'fallback';
  validated: boolean;
  transformed: boolean;
  cacheHit: boolean;
  timestamp: string;
}

export class CacheAsideService {
  private configs: Map<string, CacheAsideConfig> = new Map();

  /**
   * Register a cache-aside configuration
   */
  registerConfig(serviceName: string, config: CacheAsideConfig): void {
    this.configs.set(serviceName, {
      enableValidation: true,
      enableTransformation: false,
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      ...config
    });
  }

  /**
   * Get data using cache-aside pattern
   */
  async get<T>(
    serviceName: string,
    apiFetcher: () => Promise<T>,
    fallbackFetcher?: () => Promise<T>
  ): Promise<CacheAsideResult<T>> {
    const config = this.configs.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    const timestamp = new Date().toISOString();
    
    try {
      // 1. Try cache first
      const cachedData = await this.getFromCache<T>(config);
      if (cachedData) {
        return {
          success: true,
          data: cachedData.data,
          source: 'cache',
          validated: cachedData.validated,
          transformed: cachedData.transformed,
          cacheHit: true,
          timestamp
        };
      }

      // 2. Fetch from API with circuit breaker
      const result = await circuitBreakerService.execute(
        `cache_aside_${serviceName}`,
        apiFetcher,
        fallbackFetcher
      );

      if (result.success && result.data) {
        // Process and cache the data
        const processedData = await this.processData(result.data, config);
        await this.setToCache(config, processedData.data);
        
        return {
          success: true,
          data: processedData.data,
          source: result.fromCache ? 'fallback' : 'api',
          validated: processedData.validated,
          transformed: processedData.transformed,
          cacheHit: false,
          timestamp
        };
      }

      // 3. All sources failed
      return {
        success: false,
        error: result.error || 'All data sources failed',
        source: 'fallback',
        validated: false,
        transformed: false,
        cacheHit: false,
        timestamp
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fallback',
        validated: false,
        transformed: false,
        cacheHit: false,
        timestamp
      };
    }
  }

  /**
   * Set data in cache with validation
   */
  async set<T>(serviceName: string, data: T): Promise<boolean> {
    const config = this.configs.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    try {
      const processedData = await this.processData(data, config);
      await this.setToCache(config, processedData.data);
      return true;
    } catch (error) {
      console.error(`❌ Failed to set cache for ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache for a service
   */
  async invalidate(serviceName: string): Promise<boolean> {
    const config = this.configs.get(serviceName);
    if (!config) {
      return false;
    }

    try {
      await unifiedCacheService.remove(config.cacheKey);
      return true;
    } catch (error) {
      console.error(`❌ Failed to invalidate cache for ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics for a service
   */
  async getCacheStats(serviceName: string): Promise<{
    hasData: boolean;
    dataSize: number;
    lastUpdated?: string;
    isValid: boolean;
  }> {
    const config = this.configs.get(serviceName);
    if (!config) {
      return { hasData: false, dataSize: 0, isValid: false };
    }

    try {
      const data = await unifiedCacheService.get(config.cacheKey);
      if (!data) {
        return { hasData: false, dataSize: 0, isValid: false };
      }

      const dataSize = JSON.stringify(data).length;
      const isValid = config.enableValidation ? 
        (config.dataValidator ? config.dataValidator(data) : true) : true;

      return {
        hasData: true,
        dataSize,
        lastUpdated: new Date().toISOString(),
        isValid
      };
    } catch (error) {
      return { hasData: false, dataSize: 0, isValid: false };
    }
  }

  private async getFromCache<T>(config: CacheAsideConfig): Promise<{
    data: T;
    validated: boolean;
    transformed: boolean;
  } | null> {
    try {
      const cachedData = await unifiedCacheService.get<T>(config.cacheKey);
      if (!cachedData) {
        return null;
      }

      // Validate cached data if enabled
      let validated = true;
      if (config.enableValidation && config.dataValidator) {
        validated = config.dataValidator(cachedData);
        if (!validated) {
          console.warn('⚠️ Cached data failed validation, removing from cache');
          await unifiedCacheService.remove(config.cacheKey);
          return null;
        }
      }

      // Transform cached data if enabled
      let transformed = false;
      let data = cachedData;
      if (config.enableTransformation && config.dataTransformer) {
        data = config.dataTransformer(cachedData);
        transformed = true;
      }

      return { data, validated, transformed };
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error);
      return null;
    }
  }

  private async setToCache(config: CacheAsideConfig, data: any): Promise<void> {
    try {
      await unifiedCacheService.set(config.cacheKey, data, config.cacheTTL);
    } catch (error) {
      console.error('❌ Cache write failed:', error);
      throw error;
    }
  }

  private async processData(data: any, config: CacheAsideConfig): Promise<{
    data: any;
    validated: boolean;
    transformed: boolean;
  }> {
    let processedData = data;
    let validated = true;
    let transformed = false;

    // Validate data if enabled
    if (config.enableValidation && config.dataValidator) {
      validated = config.dataValidator(processedData);
      if (!validated) {
        throw new Error('Data validation failed');
      }
    }

    // Transform data if enabled
    if (config.enableTransformation && config.dataTransformer) {
      processedData = config.dataTransformer(processedData);
      transformed = true;
    }

    return { data: processedData, validated, transformed };
  }
}

// Export singleton instance
export const cacheAsideService = new CacheAsideService();

// Register default configurations
cacheAsideService.registerConfig('attendees', {
  cacheKey: 'kn_cache_attendees',
  dataValidator: (data) => Array.isArray(data) && data.length > 0,
  cacheTTL: 5 * 60 * 1000 // 5 minutes
});

cacheAsideService.registerConfig('agendaItems', {
  cacheKey: 'kn_cache_agenda_items',
  dataValidator: (data) => Array.isArray(data) && data.length > 0,
  cacheTTL: 2 * 60 * 1000 // 2 minutes
});

cacheAsideService.registerConfig('sponsors', {
  cacheKey: 'kn_cache_sponsors',
  dataValidator: (data) => Array.isArray(data),
  cacheTTL: 30 * 60 * 1000 // 30 minutes
});

cacheAsideService.registerConfig('hotels', {
  cacheKey: 'kn_cache_hotels',
  dataValidator: (data) => Array.isArray(data),
  cacheTTL: 30 * 60 * 1000 // 30 minutes
});

cacheAsideService.registerConfig('diningOptions', {
  cacheKey: 'kn_cache_dining_options',
  dataValidator: (data) => Array.isArray(data),
  cacheTTL: 30 * 60 * 1000 // 30 minutes
});
