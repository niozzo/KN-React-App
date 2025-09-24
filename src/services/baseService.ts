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
   * Enhanced detection to prevent schema validation in development
   */
  protected isLocalMode(): boolean {
    // Check NODE_ENV first
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return true;
    }
    
    // Check hostname patterns
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Local development patterns
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        port === '3004' || // Vite dev server
        port === '3000' || // Common dev ports
        port === '5173' || // Vite default
        port === '8080') {
      return true;
    }
    
    // Check for development indicators in URL
    if (window.location.href.includes('localhost') || 
        window.location.href.includes('127.0.0.1') ||
        window.location.href.includes(':3004') ||
        window.location.href.includes(':3000') ||
        window.location.href.includes(':5173')) {
      return true;
    }
    
    return false;
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
    const isLocal = this.isLocalMode();
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname,
      port: window.location.port,
      href: window.location.href,
      isLocal
    };
    
    if (isLocal) {
      console.log('🏠 Local mode detected - using local data sources', envInfo);
    } else {
      console.log('🌐 Production mode detected - using Supabase API', envInfo);
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
