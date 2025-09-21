/**
 * Fallback Chain Service
 * 
 * Implements a robust fallback chain for data loading with multiple
 * fallback strategies and graceful degradation.
 */

import { unifiedCacheService } from './unifiedCacheService';
import { supabaseClientService } from './supabaseClientService';

export interface FallbackStrategy {
  name: string;
  priority: number;
  execute: () => Promise<any>;
  validate?: (data: any) => boolean;
  timeout?: number;
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  strategy: string;
  duration: number;
  timestamp: string;
}

export interface FallbackChainConfig {
  strategies: FallbackStrategy[];
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
}

export class FallbackChainService {
  private configs: Map<string, FallbackChainConfig> = new Map();

  /**
   * Register a fallback chain configuration
   */
  registerChain(serviceName: string, config: FallbackChainConfig): void {
    // Sort strategies by priority (lower number = higher priority)
    config.strategies.sort((a, b) => a.priority - b.priority);
    this.configs.set(serviceName, config);
  }

  /**
   * Execute fallback chain for a service
   */
  async executeChain<T>(serviceName: string): Promise<FallbackResult<T>> {
    const config = this.configs.get(serviceName);
    if (!config) {
      throw new Error(`Fallback chain ${serviceName} not registered`);
    }

    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      for (const strategy of config.strategies) {
        try {
          if (config.enableLogging) {
            console.log(`🔄 Attempting strategy: ${strategy.name} (attempt ${attempt + 1})`);
          }

          const data = await this.executeWithTimeout(strategy);
          
          // Validate data if validator provided
          if (strategy.validate && !strategy.validate(data)) {
            throw new Error(`Data validation failed for strategy ${strategy.name}`);
          }

          const duration = performance.now() - startTime;
          
          if (config.enableLogging) {
            console.log(`✅ Strategy ${strategy.name} succeeded in ${duration.toFixed(2)}ms`);
          }

          return {
            success: true,
            data,
            source: strategy.name,
            strategy: strategy.name,
            duration,
            timestamp
          };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (config.enableLogging) {
            console.warn(`⚠️ Strategy ${strategy.name} failed: ${errorMessage}`);
          }

          // If this is the last strategy and last attempt, return error
          if (strategy === config.strategies[config.strategies.length - 1] && 
              attempt === config.maxRetries - 1) {
            const duration = performance.now() - startTime;
            return {
              success: false,
              error: `All strategies failed. Last error: ${errorMessage}`,
              source: 'none',
              strategy: 'all_failed',
              duration,
              timestamp
            };
          }
        }
      }

      // Wait before retry
      if (attempt < config.maxRetries - 1) {
        await this.delay(config.retryDelay);
      }
    }

    const duration = performance.now() - startTime;
    return {
      success: false,
      error: 'Maximum retries exceeded',
      source: 'none',
      strategy: 'max_retries_exceeded',
      duration,
      timestamp
    };
  }

  /**
   * Get fallback chain status
   */
  getChainStatus(serviceName: string): {
    isRegistered: boolean;
    strategyCount: number;
    maxRetries: number;
    retryDelay: number;
  } {
    const config = this.configs.get(serviceName);
    if (!config) {
      return {
        isRegistered: false,
        strategyCount: 0,
        maxRetries: 0,
        retryDelay: 0
      };
    }

    return {
      isRegistered: true,
      strategyCount: config.strategies.length,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay
    };
  }

  private async executeWithTimeout(strategy: FallbackStrategy): Promise<any> {
    const timeout = strategy.timeout || 10000; // 10 seconds default
    
    return Promise.race([
      strategy.execute(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Strategy timeout')), timeout)
      )
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const fallbackChainService = new FallbackChainService();

// Register default fallback chains
fallbackChainService.registerChain('attendees', {
  strategies: [
    {
      name: 'cache',
      priority: 1,
      execute: async () => {
        const data = await unifiedCacheService.get('kn_cache_attendees');
        if (!data) throw new Error('No cached data');
        return data;
      },
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'api',
      priority: 2,
      execute: async () => {
        const response = await fetch('/api/attendees');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'supabase_direct',
      priority: 3,
      execute: async () => {
        const client = supabaseClientService.getClient();
        const { data, error } = await client
          .from('attendees')
          .select('*')
          .limit(100);
        if (error) throw error;
        return data || [];
      },
      validate: (data) => Array.isArray(data)
    },
    {
      name: 'fallback_data',
      priority: 4,
      execute: async () => {
        // Return minimal fallback data
        return [{
          id: 'fallback-user',
          name: 'Fallback User',
          email: 'fallback@example.com',
          company: 'Fallback Company'
        }];
      }
    }
  ],
  maxRetries: 2,
  retryDelay: 1000,
  enableLogging: true
});

fallbackChainService.registerChain('agendaItems', {
  strategies: [
    {
      name: 'cache',
      priority: 1,
      execute: async () => {
        const data = await unifiedCacheService.get('kn_cache_agenda_items');
        if (!data) throw new Error('No cached data');
        return data;
      },
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'api',
      priority: 2,
      execute: async () => {
        const response = await fetch('/api/agenda-items');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'supabase_direct',
      priority: 3,
      execute: async () => {
        const client = supabaseClientService.getClient();
        const { data, error } = await client
          .from('agenda_items')
          .select('*')
          .limit(50);
        if (error) throw error;
        return data || [];
      },
      validate: (data) => Array.isArray(data)
    },
    {
      name: 'fallback_data',
      priority: 4,
      execute: async () => {
        // Return minimal fallback data
        return [{
          id: 'fallback-session',
          title: 'Fallback Session',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Main Hall'
        }];
      }
    }
  ],
  maxRetries: 2,
  retryDelay: 1000,
  enableLogging: true
});
