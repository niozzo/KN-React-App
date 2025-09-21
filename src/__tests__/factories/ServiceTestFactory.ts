/**
 * Service Test Factory
 * 
 * Provides factory methods for creating service instances with proper mocking
 * for isolated testing without conflicts.
 */

import { vi } from 'vitest';
import { IServiceDependencies } from '../../services/baseService';

export class ServiceTestFactory {
  /**
   * Create mock dependencies for testing
   */
  static createMockDependencies(overrides?: Partial<IServiceDependencies>): IServiceDependencies {
    return {
      supabaseClient: {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
        },
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      },
      cacheService: {
        createCacheEntry: vi.fn().mockReturnValue({
          data: [],
          version: '2.1.0',
          timestamp: new Date().toISOString(),
          ttl: 86400000,
          checksum: 'test-checksum'
        }),
        validateCacheEntry: vi.fn().mockReturnValue({
          isValid: true,
          isExpired: false,
          isVersionValid: true,
          isChecksumValid: true,
          age: 0
        })
      },
      schemaValidator: {
        validateSchema: vi.fn().mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
          tables: [],
          lastValidated: new Date().toISOString()
        })
      },
      ...overrides
    };
  }

  /**
   * Create a PWADataSyncService instance for testing
   */
  static createPWADataSyncService(overrides?: Partial<IServiceDependencies>) {
    const mockDependencies = this.createMockDependencies(overrides);
    
    // Mock the service class to avoid import conflicts
    const PWADataSyncService = vi.fn().mockImplementation(() => ({
      isLocalMode: vi.fn().mockReturnValue(true),
      getCacheTTL: vi.fn().mockReturnValue(86400000),
      getSyncStatus: vi.fn().mockReturnValue({
        isOnline: true,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
        syncInProgress: false
      }),
      syncAllData: vi.fn().mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'sponsors', 'seat_assignments', 'agenda_items', 'dining_options', 'hotels'],
        errors: [],
        conflicts: []
      }),
      cacheTableData: vi.fn().mockResolvedValue(undefined),
      getCachedTableData: vi.fn().mockResolvedValue([]),
      forceSync: vi.fn().mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'sponsors', 'seat_assignments'],
        errors: [],
        conflicts: []
      }),
      clearCache: vi.fn().mockResolvedValue(undefined),
      getOfflineDataStatus: vi.fn().mockResolvedValue({
        attendees: true,
        sponsors: false,
        seat_assignments: true,
        agenda_items: false,
        dining_options: false,
        hotels: false,
        seating_configurations: false,
        user_profiles: false
      }),
      resolveConflict: vi.fn().mockResolvedValue(true),
      dependencies: mockDependencies
    }));

    return new PWADataSyncService();
  }

  /**
   * Create a ServerDataSyncService instance for testing
   */
  static createServerDataSyncService(overrides?: Partial<IServiceDependencies>) {
    const mockDependencies = this.createMockDependencies(overrides);
    
    const ServerDataSyncService = vi.fn().mockImplementation(() => ({
      isLocalMode: vi.fn().mockReturnValue(true),
      syncAllData: vi.fn().mockResolvedValue({
        success: true,
        syncedTables: ['test_table'],
        errors: [],
        totalRecords: 0
      }),
      dependencies: mockDependencies
    }));

    return new ServerDataSyncService();
  }

  /**
   * Create an ApplicationDatabaseService instance for testing
   */
  static createApplicationDatabaseService(overrides?: Partial<IServiceDependencies>) {
    const mockDependencies = this.createMockDependencies(overrides);
    
    const ApplicationDatabaseService = vi.fn().mockImplementation(() => ({
      isLocalMode: vi.fn().mockReturnValue(true),
      getClient: vi.fn().mockReturnValue(mockDependencies.supabaseClient),
      getAdminClient: vi.fn().mockReturnValue(mockDependencies.supabaseClient),
      dependencies: mockDependencies
    }));

    return new ApplicationDatabaseService();
  }

  /**
   * Create a BaseService instance for testing
   */
  static createBaseService(overrides?: Partial<IServiceDependencies>) {
    const mockDependencies = this.createMockDependencies(overrides);
    
    // Create a concrete implementation of BaseService for testing
    class TestableBaseService {
      dependencies: IServiceDependencies;

      constructor(deps?: Partial<IServiceDependencies>) {
        this.dependencies = { ...mockDependencies, ...deps };
      }

      isLocalMode(): boolean {
        return process.env.NODE_ENV === 'development' || 
               process.env.NODE_ENV === 'test' ||
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
      }

      getApiBaseUrl(): string {
        return this.isLocalMode() ? '/api' : 'https://iikcgdhztkrexuuqheli.supabase.co';
      }

      logEnvironmentMode(): void {
        if (this.isLocalMode()) {
          console.log('🏠 Local mode detected - using local data sources');
        } else {
          console.log('🌐 Production mode detected - using Supabase API');
        }
      }

      getSupabaseClient(): any {
        return this.dependencies.supabaseClient;
      }

      getCacheService(): any {
        return this.dependencies.cacheService;
      }
    }

    return new TestableBaseService(overrides);
  }
}
