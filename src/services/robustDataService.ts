/**
 * Robust Data Service
 * 
 * Implements circuit breaker pattern with cache-aside and fallback mechanisms
 * for resilient data loading across the application.
 */

import { circuitBreakerService, CircuitBreakerResult } from './circuitBreakerService';
import { unifiedCacheService } from './unifiedCacheService';
import { supabaseClientService } from './supabaseClientService';

export interface DataServiceConfig {
  cacheKey: string;
  apiEndpoint: string;
  circuitBreakerKey: string;
  cacheTTL?: number;
  enableFallback?: boolean;
}

export interface DataServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'cache' | 'api' | 'fallback' | 'error';
  circuitState: string;
  timestamp: string;
}

export class RobustDataService {
  private config: Map<string, DataServiceConfig> = new Map();

  /**
   * Register a data service configuration
   */
  registerService(serviceName: string, config: DataServiceConfig): void {
    this.config.set(serviceName, config);
  }

  /**
   * Load data with full resilience (cache + circuit breaker + fallback)
   */
  async loadData<T>(serviceName: string): Promise<DataServiceResult<T>> {
    const config = this.config.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    const timestamp = new Date().toISOString();
    
    try {
      // 1. Try cache first
      const cachedData = await this.tryCache<T>(config.cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'cache',
          circuitState: 'CACHE_HIT',
          timestamp
        };
      }

      // 2. Try API with circuit breaker
      const result = await circuitBreakerService.execute(
        config.circuitBreakerKey,
        () => this.fetchFromAPI<T>(config.apiEndpoint),
        config.enableFallback ? () => this.getFallbackData<T>(serviceName) : undefined
      );

      if (result.success && result.data) {
        // Cache the successful result
        await unifiedCacheService.set(config.cacheKey, result.data, config.cacheTTL);
        
        return {
          success: true,
          data: result.data,
          source: result.fromCache ? 'fallback' : 'api',
          circuitState: result.circuitState.state,
          timestamp
        };
      }

      // 3. All sources failed
      return {
        success: false,
        error: result.error || 'All data sources failed',
        source: 'error',
        circuitState: result.circuitState.state,
        timestamp
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error',
        circuitState: 'ERROR',
        timestamp
      };
    }
  }

  /**
   * Force refresh data (bypass cache)
   */
  async refreshData<T>(serviceName: string): Promise<DataServiceResult<T>> {
    const config = this.config.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    // Clear cache first
    await unifiedCacheService.remove(config.cacheKey);
    
    // Load fresh data
    return this.loadData<T>(serviceName);
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): {
    isHealthy: boolean;
    circuitState: string;
    lastError?: string;
  } {
    const config = this.config.get(serviceName);
    if (!config) {
      return {
        isHealthy: false,
        circuitState: 'NOT_REGISTERED'
      };
    }

    const circuitState = circuitBreakerService.getCircuitState(config.circuitBreakerKey);
    const isHealthy = circuitBreakerService.isCircuitHealthy(config.circuitBreakerKey);

    return {
      isHealthy,
      circuitState: circuitState?.state || 'UNKNOWN',
      lastError: circuitState?.lastFailureTime ? 'Recent failure detected' : undefined
    };
  }

  /**
   * Get all services health status
   */
  getAllServicesHealth(): Map<string, any> {
    const health = new Map();
    for (const [serviceName] of this.config) {
      health.set(serviceName, this.getServiceHealth(serviceName));
    }
    return health;
  }

  private async tryCache<T>(cacheKey: string): Promise<T | null> {
    try {
      return await unifiedCacheService.get<T>(cacheKey);
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error);
      return null;
    }
  }

  private async fetchFromAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error');
      }

      return data.data;
    } catch (error) {
      console.error('❌ API fetch failed:', error);
      throw error;
    }
  }

  private async getFallbackData<T>(serviceName: string): Promise<T> {
    // This would contain fallback data for each service
    // For now, return empty arrays as fallback
    const fallbackData: Record<string, any> = {
      attendees: [],
      agendaItems: [],
      sponsors: [],
      hotels: [],
      diningOptions: [],
      seatAssignments: [],
      seatingConfigurations: [],
      userProfiles: [],
      speakerAssignments: [],
      agendaItemMetadata: [],
      attendeeMetadata: []
    };

    const fallback = fallbackData[serviceName];
    if (fallback === undefined) {
      throw new Error(`No fallback data available for ${serviceName}`);
    }

    console.log(`🔄 Using fallback data for ${serviceName}`);
    return fallback as T;
  }
}

// Export singleton instance
export const robustDataService = new RobustDataService();

// Register default services
robustDataService.registerService('attendees', {
  cacheKey: 'kn_cache_attendees',
  apiEndpoint: '/api/attendees',
  circuitBreakerKey: 'api_attendees',
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableFallback: true
});

robustDataService.registerService('agendaItems', {
  cacheKey: 'kn_cache_agenda_items',
  apiEndpoint: '/api/agenda-items',
  circuitBreakerKey: 'api_agenda_items',
  cacheTTL: 2 * 60 * 1000, // 2 minutes
  enableFallback: true
});

// DEPRECATED: sponsors table no longer used - migrated to standardized_companies
// robustDataService.registerService('sponsors', {
//   cacheKey: 'kn_cache_sponsors',
//   apiEndpoint: '/api/sponsors',
//   circuitBreakerKey: 'api_sponsors',
//   cacheTTL: 30 * 60 * 1000, // 30 minutes
//   enableFallback: true
// });

robustDataService.registerService('standardized_companies', {
  cacheKey: 'kn_cache_standardized_companies',
  apiEndpoint: '/api/standardized-companies',
  circuitBreakerKey: 'api_standardized_companies',
  cacheTTL: 60 * 60 * 1000, // 1 hour
  enableFallback: true
});

robustDataService.registerService('hotels', {
  cacheKey: 'kn_cache_hotels',
  apiEndpoint: '/api/hotels',
  circuitBreakerKey: 'api_hotels',
  cacheTTL: 30 * 60 * 1000, // 30 minutes
  enableFallback: true
});

robustDataService.registerService('diningOptions', {
  cacheKey: 'kn_cache_dining_options',
  apiEndpoint: '/api/dining-options',
  circuitBreakerKey: 'api_dining_options',
  cacheTTL: 30 * 60 * 1000, // 30 minutes
  enableFallback: true
});
