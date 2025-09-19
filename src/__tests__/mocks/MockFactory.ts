/**
 * Mock Factory for creating consistent test mocks
 */

import { vi } from 'vitest';
import type { IServerDataSyncService, SyncResult } from '../../services/interfaces/IServerDataSyncService';
import type { IAgendaService, ServiceResult } from '../../services/interfaces/IAgendaService';
import type { ICacheService } from '../../services/interfaces/ICacheService';
import type { AgendaItem } from '../../types/database';

export class MockFactory {
  /**
   * Create a mock ServerDataSyncService
   */
  static createServerDataSyncServiceMock(overrides?: Partial<IServerDataSyncService>): IServerDataSyncService {
    return {
      syncAllData: vi.fn().mockResolvedValue({
        success: true,
        syncedTables: ['agenda_items'],
        errors: [],
        totalRecords: 0
      } as SyncResult),
      getCachedTableData: vi.fn().mockResolvedValue([]),
      clearCache: vi.fn().mockResolvedValue(undefined),
      ...overrides
    };
  }

  /**
   * Create a mock AgendaService
   */
  static createAgendaServiceMock(overrides?: Partial<IAgendaService>): IAgendaService {
    return {
      getActiveAgendaItems: vi.fn().mockResolvedValue({
        success: true,
        data: [],
        error: null
      } as ServiceResult<AgendaItem[]>),
      refreshAgendaItems: vi.fn().mockResolvedValue({
        success: true,
        data: [],
        error: null
      } as ServiceResult<AgendaItem[]>),
      ...overrides
    };
  }

  /**
   * Create a mock CacheService
   */
  static createCacheServiceMock(overrides?: Partial<ICacheService>): ICacheService {
    const mockCache = new Map<string, any>();

    return {
      get: vi.fn().mockImplementation((key: string) => {
        return mockCache.get(key) || null;
      }),
      set: vi.fn().mockImplementation((key: string, data: any, version = '1.0') => {
        const entry = {
          data,
          timestamp: new Date().toISOString(),
          version
        };
        mockCache.set(key, entry);
      }),
      remove: vi.fn().mockImplementation((key: string) => {
        mockCache.delete(key);
      }),
      clear: vi.fn().mockImplementation(() => {
        mockCache.clear();
      }),
      has: vi.fn().mockImplementation((key: string) => {
        return mockCache.has(key);
      }),
      ...overrides
    };
  }

  /**
   * Create sample agenda items for testing
   */
  static createSampleAgendaItems(): AgendaItem[] {
    return [
      {
        id: '1',
        title: 'Morning Session',
        date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        isActive: true
      } as AgendaItem,
      {
        id: '2',
        title: 'Afternoon Session',
        date: '2024-01-15',
        start_time: '14:00',
        end_time: '15:00',
        isActive: true
      } as AgendaItem,
      {
        id: '3',
        title: 'Next Day Session',
        date: '2024-01-16',
        start_time: '08:00',
        end_time: '09:00',
        isActive: true
      } as AgendaItem
    ];
  }

  /**
   * Create a successful sync result
   */
  static createSuccessfulSyncResult(overrides?: Partial<SyncResult>): SyncResult {
    return {
      success: true,
      syncedTables: ['agenda_items'],
      errors: [],
      totalRecords: 3,
      ...overrides
    };
  }

  /**
   * Create a failed sync result
   */
  static createFailedSyncResult(errorMessage = 'Sync failed'): SyncResult {
    return {
      success: false,
      syncedTables: [],
      errors: [errorMessage],
      totalRecords: 0
    };
  }
}
