/**
 * Test cache validation logic fixes
 * Story 2.1c: Fix Cache Validation Logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgendaService } from '../../services/agendaService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock pwaDataSyncService
vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(),
  },
}));

describe('AgendaService Cache Validation', () => {
  let agendaService: AgendaService;

  beforeEach(() => {
    vi.clearAllMocks();
    agendaService = new AgendaService();
  });

  describe('getActiveAgendaItems cache validation', () => {
    it('should use cache when empty data exists (all inactive filtered)', async () => {
      // Cache is empty because ServerDataSyncService filtered all inactive items
      const cachedData = {
        data: [],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await agendaService.getActiveAgendaItems();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Empty because all were inactive
      expect(localStorageMock.getItem).toHaveBeenCalledWith('kn_cache_agenda_items');
    });

    it('should clear cache when future timestamp detected', async () => {
      // Mock cache with future timestamp
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
      const cachedData = {
        data: [
          { id: '1', title: 'Test Session', isActive: true, date: '2024-01-01', start_time: '09:00' },
        ],
        timestamp: futureTime,
        version: '1.0'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await agendaService.getActiveAgendaItems();

      // Should clear cache and fall through to server sync
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_agenda_items');
    });

    it('should use cache when valid pre-filtered data exists', async () => {
      // Cache only contains active items (ServerDataSyncService already filtered)
      const cachedData = {
        data: [
          { id: '1', title: 'Active Session', isActive: true, date: '2024-01-01', start_time: '09:00' },
          { id: '3', title: 'Another Active', isActive: true, date: '2024-01-01', start_time: '10:00' },
        ],
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await agendaService.getActiveAgendaItems();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // Both are active
      expect(result.data[0].title).toBe('Active Session');
    });

    it('should fall through to server sync when no cache exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await agendaService.getActiveAgendaItems();

      // Should attempt server sync (will fail without proper mocking)
      expect(result.success).toBe(false);
    });
  });
});
