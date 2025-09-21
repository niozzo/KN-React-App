/**
 * Tests for Unified Cache Service
 * Story 2.1f1: Unified Cache Service
 */

import { UnifiedCacheService } from '../../services/unifiedCacheService';
import { CacheVersioningService } from '../../services/cacheVersioningService';
import { CacheMonitoringService } from '../../services/cacheMonitoringService';
import { CacheMetricsService } from '../../services/cacheMetricsService';
import { DataConsistencyService } from '../../services/dataConsistencyService';

import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('UnifiedCacheService', () => {
  let cacheService: UnifiedCacheService;
  let mockVersioning: any;
  let mockMonitoring: any;
  let mockMetrics: any;
  let mockConsistency: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();

    // Create mock services
    mockVersioning = {
      createCacheEntry: vi.fn(),
      validateCacheEntry: vi.fn(),
      migrateCacheEntry: vi.fn()
    } as any;

    mockMonitoring = {
      logCacheHit: vi.fn(),
      logCacheMiss: vi.fn(),
      logCacheCorruption: vi.fn()
    } as any;

    mockMetrics = {
      recordCacheHit: vi.fn(),
      recordCacheMiss: vi.fn(),
      recordCacheCorruption: vi.fn(),
      getMetrics: vi.fn()
    } as any;

    mockConsistency = {
      validateCacheConsistency: vi.fn()
    } as any;

    // Create service instance with mocked dependencies
    cacheService = new UnifiedCacheService();
    
    // Replace internal services with mocks
    (cacheService as any).cacheVersioning = mockVersioning;
    (cacheService as any).monitoring = mockMonitoring;
    (cacheService as any).metrics = mockMetrics;
    (cacheService as any).dataConsistency = mockConsistency;
  });

  describe('get', () => {
    it('should return null when cache entry does not exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
      expect(mockMonitoring.logCacheMiss).toHaveBeenCalledWith('test-key', 'not_found');
      expect(mockMetrics.recordCacheMiss).toHaveBeenCalledWith('not_found');
    });

    it('should return data when cache entry is valid', async () => {
      const mockData = { id: '1', title: 'Test' };
      const mockEntry = {
        data: mockData,
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        ttl: 300000,
        checksum: 'abc123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry));
      mockVersioning.validateCacheEntry.mockReturnValue({
        isValid: true,
        isExpired: false,
        isVersionValid: true,
        isChecksumValid: true,
        age: 1000
      });

      const result = await cacheService.get('test-key');

      expect(result).toEqual(mockData);
      expect(mockMonitoring.logCacheHit).toHaveBeenCalled();
      expect(mockMetrics.recordCacheHit).toHaveBeenCalled();
    });

    it('should return null and remove entry when validation fails', async () => {
      const mockEntry = {
        data: { id: '1' },
        version: '1.0.0', // Old version
        timestamp: new Date().toISOString(),
        ttl: 300000,
        checksum: 'abc123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry));
      mockVersioning.validateCacheEntry.mockReturnValue({
        isValid: false,
        isExpired: false,
        isVersionValid: false,
        isChecksumValid: true,
        age: 1000,
        issues: ['Version mismatch']
      });

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(mockMonitoring.logCacheCorruption).toHaveBeenCalled();
      expect(mockMetrics.recordCacheCorruption).toHaveBeenCalled();
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
      expect(mockMonitoring.logCacheCorruption).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should store data with versioning', async () => {
      const testData = { id: '1', title: 'Test' };
      const mockEntry = {
        data: testData,
        version: '2.1.0',
        timestamp: expect.any(String),
        ttl: 300000,
        checksum: expect.any(String)
      };

      mockVersioning.createCacheEntry.mockReturnValue(mockEntry);

      await cacheService.set('test-key', testData, 300000);

      expect(mockVersioning.createCacheEntry).toHaveBeenCalledWith(testData, 300000);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(mockEntry));
      expect(mockMonitoring.logCacheHit).toHaveBeenCalled();
      expect(mockMetrics.recordCacheHit).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const testData = { id: '1', title: 'Test' };
      const mockEntry = {
        data: testData,
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        ttl: 300000,
        checksum: 'abc123'
      };

      mockVersioning.createCacheEntry.mockReturnValue(mockEntry);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(cacheService.set('test-key', testData)).rejects.toThrow('Storage quota exceeded');
      expect(mockMonitoring.logCacheCorruption).toHaveBeenCalled();
      expect(mockMetrics.recordCacheCorruption).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove item from localStorage', async () => {
      await cacheService.remove('test-key');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(mockMonitoring.logCacheMiss).toHaveBeenCalledWith('test-key', 'removed');
    });

    it('should handle removal errors', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(cacheService.remove('test-key')).rejects.toThrow('Storage error');
      expect(mockMonitoring.logCacheCorruption).toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('should remove all keys matching pattern', async () => {
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_agenda_items');
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_attendee');
      mockLocalStorage.key.mockReturnValueOnce('other_key');
      mockLocalStorage.key.mockReturnValueOnce(null);
      Object.defineProperty(mockLocalStorage, 'length', { value: 3 });

      await cacheService.invalidate('kn_cache_');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_agenda_items');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendee');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key');
      expect(mockMonitoring.logCacheMiss).toHaveBeenCalledWith('kn_cache_', 'invalidated 2 keys');
    });
  });

  describe('clear', () => {
    it('should clear all cache keys', async () => {
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_agenda_items');
      mockLocalStorage.key.mockReturnValueOnce('kn_cache_attendee');
      mockLocalStorage.key.mockReturnValueOnce('other_key');
      mockLocalStorage.key.mockReturnValueOnce(null);
      Object.defineProperty(mockLocalStorage, 'length', { value: 3 });

      await cacheService.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_agenda_items');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('kn_cache_attendee');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key');
      expect(mockMonitoring.logCacheMiss).toHaveBeenCalledWith('all', 'cleared 2 keys');
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when everything is working', async () => {
      const mockMetrics = {
        cacheHits: 10,
        cacheMisses: 2,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 50,
        totalDataSize: 1024,
        lastUpdated: new Date().toISOString()
      };

      const mockConsistency = {
        isConsistent: true,
        issues: [],
        timestamp: new Date().toISOString(),
        severity: 'low' as const,
        recommendations: []
      };

      mockMetrics.getMetrics.mockReturnValue(mockMetrics);
      mockConsistency.validateCacheConsistency.mockReturnValue(mockConsistency);

      const healthStatus = await cacheService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.metrics).toEqual(mockMetrics);
      expect(healthStatus.consistency).toEqual(mockConsistency);
    });

    it('should return unhealthy status when there are issues', async () => {
      const mockMetrics = {
        cacheHits: 5,
        cacheMisses: 10,
        cacheCorruptions: 2,
        syncFailures: 1,
        stateResets: 0,
        averageResponseTime: 200,
        totalDataSize: 512,
        lastUpdated: new Date().toISOString()
      };

      const mockConsistency = {
        isConsistent: false,
        issues: ['Data mismatch detected'],
        timestamp: new Date().toISOString(),
        severity: 'high' as const,
        recommendations: ['Check data synchronization']
      };

      mockMetrics.getMetrics.mockReturnValue(mockMetrics);
      mockConsistency.validateCacheConsistency.mockReturnValue(mockConsistency);

      const healthStatus = await cacheService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.metrics).toEqual(mockMetrics);
      expect(healthStatus.consistency).toEqual(mockConsistency);
    });

    it('should handle errors gracefully', async () => {
      mockMetrics.getMetrics.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      const healthStatus = await cacheService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.metrics).toBeNull();
      expect(healthStatus.consistency.isConsistent).toBe(false);
      expect(healthStatus.consistency.issues).toContain('Metrics error');
    });
  });

  describe('getCacheEntry', () => {
    it('should handle migration from old cache format', () => {
      const oldEntry = { data: { id: '1' }, timestamp: new Date().toISOString() };
      const migratedEntry = {
        data: { id: '1' },
        version: '2.1.0',
        timestamp: expect.any(String),
        ttl: expect.any(Number),
        checksum: expect.any(String)
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldEntry));
      mockVersioning.migrateCacheEntry.mockReturnValue(migratedEntry);

      const result = (cacheService as any).getCacheEntry('test-key');

      expect(mockVersioning.migrateCacheEntry).toHaveBeenCalledWith(oldEntry);
      expect(result).toEqual(migratedEntry);
    });

    it('should return null for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = (cacheService as any).getCacheEntry('test-key');

      expect(result).toBeNull();
      expect(mockMonitoring.logCacheCorruption).toHaveBeenCalled();
    });
  });

  describe('service accessors', () => {
    it('should provide access to monitoring service', () => {
      const monitoring = cacheService.getMonitoringService();
      expect(monitoring).toBeDefined();
    });

    it('should provide access to versioning service', () => {
      const versioning = cacheService.getVersioningService();
      expect(versioning).toBeDefined();
    });

    it('should provide access to consistency service', () => {
      const consistency = cacheService.getConsistencyService();
      expect(consistency).toBeDefined();
    });

    it('should provide access to metrics', () => {
      const metrics = { cacheHits: 10, cacheMisses: 2 };
      mockMetrics.getMetrics.mockReturnValue(metrics);

      const result = cacheService.getMetrics();
      expect(result).toEqual(metrics);
    });
  });
});
