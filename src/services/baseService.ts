/**
 * Base Service Class
 * 
 * Provides common functionality for all services including environment detection
 * and consistent patterns for local vs production behavior.
 */

export interface IServiceDependencies {
  supabaseClient?: any;
  cacheService?: any;
  schemaValidator?: any;
}

export abstract class BaseService {
  protected dependencies: IServiceDependencies;

  constructor(dependencies?: Partial<IServiceDependencies>) {
    this.dependencies = {
      supabaseClient: dependencies?.supabaseClient,
      cacheService: dependencies?.cacheService,
      schemaValidator: dependencies?.schemaValidator,
      ...dependencies
    };
  }

  /**
   * Check if running in local development mode
   */
  protected isLocalMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Get API base URL based on environment
   */
  protected getApiBaseUrl(): string {
    return this.isLocalMode() ? '/api' : 'https://iikcgdhztkrexuuqheli.supabase.co';
  }

  /**
   * Log environment mode for debugging
   */
  protected logEnvironmentMode(): void {
    if (this.isLocalMode()) {
      console.log('🏠 Local mode detected - using local data sources');
    } else {
      console.log('🌐 Production mode detected - using Supabase API');
    }
  }

  /**
   * Get Supabase client (with fallback to singleton)
   */
  protected getSupabaseClient(): any {
    if (this.dependencies.supabaseClient) {
      return this.dependencies.supabaseClient;
    }
    
    // Return null in test environment to avoid circular dependencies
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    
    // Fallback to singleton service
    try {
      const { supabaseClientService } = require('./supabaseClientService');
      return supabaseClientService.getClient();
    } catch (error) {
      console.warn('⚠️ Supabase client not available:', error);
      return null;
    }
  }

  /**
   * Get cache service (with fallback to singleton)
   */
  protected getCacheService(): any {
    if (this.dependencies.cacheService) {
      return this.dependencies.cacheService;
    }
    
    // Return null in test environment to avoid circular dependencies
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    
    // Fallback to singleton service
    try {
      const { cacheVersioningService } = require('./cacheVersioningService');
      return cacheVersioningService;
    } catch (error) {
      console.warn('⚠️ Cache service not available:', error);
      return null;
    }
  }
}
