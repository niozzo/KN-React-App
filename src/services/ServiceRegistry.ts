/**
 * Service Registry for managing singleton instances
 * Prevents multiple GoTrueClient instances and provides centralized service management
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const APPLICATION_DB_URL = process.env.VITE_APPLICATION_DB_URL;
const APPLICATION_DB_ANON_KEY = process.env.VITE_APPLICATION_DB_ANON_KEY;
const APPLICATION_DB_SERVICE_KEY = process.env.VITE_APPLICATION_DB_SERVICE_KEY;

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private applicationDbClient: SupabaseClient | null = null;
  private adminDbClient: SupabaseClient | null = null;
  private isInitialized = false;
  private cacheInvalidationCallbacks: Map<string, Function[]> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Initialize the service registry with Supabase clients
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('⚠️ ServiceRegistry already initialized');
      return;
    }

    if (!APPLICATION_DB_URL || !APPLICATION_DB_ANON_KEY) {
      console.error('❌ Missing application database environment variables');
      throw new Error('Missing application database environment variables');
    }

    try {
      // Create application database client (anon key for read operations)
      this.applicationDbClient = createClient(APPLICATION_DB_URL, APPLICATION_DB_ANON_KEY);
      console.log('✅ Application database client initialized');

      // Create admin database client (service key for admin operations)
      if (APPLICATION_DB_SERVICE_KEY) {
        this.adminDbClient = createClient(APPLICATION_DB_URL, APPLICATION_DB_SERVICE_KEY);
        console.log('✅ Admin database client initialized with service key');
      } else {
        this.adminDbClient = this.applicationDbClient;
        console.log('⚠️ Admin database client using anon key (service key not available)');
      }

      this.isInitialized = true;
      console.log('✅ ServiceRegistry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ServiceRegistry:', error);
      throw error;
    }
  }

  /**
   * Get the application database client (read operations)
   */
  public getApplicationDbClient(): SupabaseClient {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (!this.applicationDbClient) {
      throw new Error('Application database client not initialized');
    }
    
    return this.applicationDbClient;
  }

  /**
   * Get the admin database client (write operations)
   */
  public getAdminDbClient(): SupabaseClient {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (!this.adminDbClient) {
      throw new Error('Admin database client not initialized');
    }
    
    return this.adminDbClient;
  }

  /**
   * Check if the registry is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.applicationDbClient !== null && this.adminDbClient !== null;
  }

  /**
   * Reset the registry (useful for testing)
   */
  public reset(): void {
    this.applicationDbClient = null;
    this.adminDbClient = null;
    this.isInitialized = false;
    console.log('🔄 ServiceRegistry reset');
  }

  /**
   * Register a callback for cache invalidation events
   */
  public registerCacheInvalidationCallback(tableName: string, callback: Function): void {
    if (!this.cacheInvalidationCallbacks.has(tableName)) {
      this.cacheInvalidationCallbacks.set(tableName, []);
    }
    this.cacheInvalidationCallbacks.get(tableName)!.push(callback);
    console.log(`📝 Registered cache invalidation callback for table: ${tableName}`);
  }

  /**
   * Trigger cache invalidation for a specific table
   */
  public invalidateCache(tableName: string): void {
    const callbacks = this.cacheInvalidationCallbacks.get(tableName) || [];
    console.log(`🔄 Triggering cache invalidation for table: ${tableName} (${callbacks.length} callbacks)`);
    
    callbacks.forEach((callback, index) => {
      try {
        callback();
        console.log(`✅ Cache invalidation callback ${index + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Cache invalidation callback ${index + 1} failed:`, error);
      }
    });
  }

  /**
   * Get all registered cache invalidation callbacks
   */
  public getCacheInvalidationCallbacks(): Map<string, Function[]> {
    return new Map(this.cacheInvalidationCallbacks);
  }

  /**
   * Clear all cache invalidation callbacks (useful for testing)
   */
  public clearCacheInvalidationCallbacks(): void {
    this.cacheInvalidationCallbacks.clear();
    console.log('🧹 Cleared all cache invalidation callbacks');
  }

  /**
   * Get environment variable status for debugging
   */
  public getEnvironmentStatus(): {
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    serviceKeyLength: number;
  } {
    return {
      hasUrl: !!APPLICATION_DB_URL,
      hasAnonKey: !!APPLICATION_DB_ANON_KEY,
      hasServiceKey: !!APPLICATION_DB_SERVICE_KEY,
      serviceKeyLength: APPLICATION_DB_SERVICE_KEY?.length || 0
    };
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();

// Legacy exports for backward compatibility
export const getApplicationDbClient = () => serviceRegistry.getApplicationDbClient();
export const getAdminDbClient = () => serviceRegistry.getAdminDbClient();