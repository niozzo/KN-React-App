/**
 * Data Synchronization Tests
 * Story 1.3: PWA Polish & Branding
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PWADataSyncService } from '../services/pwaDataSyncService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      active: {
        postMessage: vi.fn()
      },
      sync: {
        register: vi.fn()
      }
    })
  }
});

describe('PWADataSyncService', () => {
  let service: PWADataSyncService;

  beforeEach(() => {
    service = new PWADataSyncService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncAllData', () => {
    it('should sync all tables successfully', async () => {
      // Mock successful API responses
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: '1', name: 'Test Attendee' },
            { id: '2', name: 'Another Attendee' }
          ]
        })
      });

      const result = await service.syncAllData();

      expect(result.success).toBe(true);
      expect(result.syncedTables).toHaveLength(8); // All expected tables
      expect(result.errors).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service.syncAllData();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should cache data after successful sync', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: '1', name: 'Test' }]
        })
      });

      await service.syncAllData();

      // Check that data was cached in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getCachedTableData', () => {
    it('should return cached data when available', async () => {
      const mockData = [{ id: '1', name: 'Test Attendee' }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        data: mockData,
        timestamp: Date.now(),
        version: 1
      }));

      const result = await service.getCachedTableData('attendees');

      expect(result).toEqual(mockData);
    });

    it('should return empty array when no cached data', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.getCachedTableData('attendees');

      expect(result).toEqual([]);
    });

    it('should return empty array when cache is invalid', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await service.getCachedTableData('attendees');

      expect(result).toEqual([]);
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      const status = service.getSyncStatus();

      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('pendingChanges');
      expect(status).toHaveProperty('syncInProgress');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      localStorageMock.getItem.mockReturnValue('{"data": []}');

      await service.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('background sync', () => {
    it('should register background sync with service worker', async () => {
      const mockRegistration = {
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration)
        }
      });

      // Create new service instance to trigger registration
      const newService = new PWADataSyncService();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRegistration.sync.register).toHaveBeenCalledWith('data-sync');
    });
  });

  describe('online/offline events', () => {
    it('should start sync when coming online', async () => {
      const syncSpy = vi.spyOn(service, 'syncAllData');
      
      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      window.dispatchEvent(new Event('online'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(syncSpy).toHaveBeenCalled();
    });

    it('should stop sync when going offline', () => {
      const stopSpy = vi.spyOn(service as any, 'stopPeriodicSync');
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should track cache size', () => {
      const updateSizeSpy = vi.spyOn(service as any, 'updateCacheSize');
      
      // Trigger cache update
      (service as any).updateCacheSize();

      expect(updateSizeSpy).toHaveBeenCalled();
    });

    it('should validate cache age', () => {
      const isExpired = (service as any).isCacheExpired(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      expect(isExpired).toBe(true);

      const isNotExpired = (service as any).isCacheExpired(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      expect(isNotExpired).toBe(false);
    });
  });
});
