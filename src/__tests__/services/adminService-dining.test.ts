import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from '../../services/adminService';

// Mock dependencies
vi.mock('../../services/applicationDatabaseService', () => ({
  applicationDatabaseService: {
    syncDiningItemMetadata: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(() => Promise.resolve([])),
    syncApplicationTable: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn(() => Promise.resolve({
      data: [
        {
          id: 'dining-1',
          name: 'Welcome Reception',
          date: '2025-10-21',
          time: '18:00:00',
          location: 'Cloud Bar',
          capacity: 100
        }
      ]
    }))
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('AdminService Dining Options', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('getDiningOptionsWithMetadata', () => {
    it('should load dining options from cache', async () => {
      const result = await adminService.getDiningOptionsWithMetadata();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dining-1',
        name: 'Welcome Reception',
        date: '2025-10-21',
        time: '18:00:00',
        location: 'Cloud Bar',
        capacity: 100
      });
    });

    it('should handle empty dining options', async () => {
      const { unifiedCacheService } = require('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue({ data: [] });

      const result = await adminService.getDiningOptionsWithMetadata();

      expect(result).toHaveLength(0);
    });
  });

  describe('updateDiningOptionTitle', () => {
    it('should update dining option title in cache', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        data: [
          {
            id: 'dining-1',
            name: 'Welcome Reception',
            date: '2025-10-21',
            time: '18:00:00',
            location: 'Cloud Bar',
            capacity: 100
          }
        ]
      }));

      await adminService.updateDiningOptionTitle('dining-1', 'Updated Reception');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'kn_cache_dining_options',
        expect.stringContaining('"name":"Updated Reception"')
      );
    });

    it('should handle missing cache data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await adminService.updateDiningOptionTitle('dining-1', 'Updated Reception');

      // Should not throw error
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('validateTitle', () => {
    it('should validate non-empty titles', () => {
      expect(adminService.validateTitle('Valid Title')).toBe(true);
      expect(adminService.validateTitle('   ')).toBe(false);
      expect(adminService.validateTitle('')).toBe(false);
    });
  });
});
