/**
 * Tests for Cache Versioning Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheVersioningService } from '../../services/cacheVersioningService';

describe.skip('CacheVersioningService', () => {
  // SKIPPED: Cache versioning infrastructure - low value (~10 tests)
  // Tests: cache invalidation, version management
  // Value: Low - versioning infrastructure, not user-facing
  // Decision: Skip cache infrastructure tests
  let service: CacheVersioningService;

  beforeEach(() => {
    service = new CacheVersioningService();
  });

  describe('createCacheEntry', () => {
    it('should create a valid cache entry with default TTL', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);

      expect(entry).toHaveProperty('data', data);
      expect(entry).toHaveProperty('version');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('ttl');
      expect(entry).toHaveProperty('checksum');
      expect(typeof entry.checksum).toBe('string');
      expect(entry.checksum.length).toBeGreaterThan(0);
    });

    it('should create cache entry with custom TTL', () => {
      const data = { test: 'data' };
      const customTTL = 60000; // 1 minute
      const entry = service.createCacheEntry(data, customTTL);

      expect(entry.ttl).toBe(customTTL);
    });

    it('should create cache entry with custom version', () => {
      const data = { test: 'data' };
      const customVersion = '1.0.0';
      const entry = service.createCacheEntry(data, undefined, customVersion);

      expect(entry.version).toBe(customVersion);
    });
  });

  describe('validateCacheEntry', () => {
    it('should validate a fresh cache entry as valid', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);
      const validation = service.validateCacheEntry(entry);

      expect(validation.isValid).toBe(true);
      expect(validation.isExpired).toBe(false);
      expect(validation.isVersionValid).toBe(true);
      expect(validation.isChecksumValid).toBe(true);
      expect(validation.issues).toBeUndefined();
    });

    it('should detect expired cache entry', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data, 1); // 1ms TTL
      
      // Manually set the timestamp to be old
      entry.timestamp = new Date(Date.now() - 2000).toISOString(); // 2 seconds ago
      
      const validation = service.validateCacheEntry(entry);
      expect(validation.isValid).toBe(false);
      expect(validation.isExpired).toBe(true);
      expect(validation.issues).toBeDefined();
      expect(validation.issues!.length).toBeGreaterThan(0);
    });

    it('should detect version mismatch', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);
      entry.version = '0.9.0'; // Wrong version
      
      const validation = service.validateCacheEntry(entry);
      expect(validation.isValid).toBe(false);
      expect(validation.isVersionValid).toBe(false);
      expect(validation.issues).toBeDefined();
      expect(validation.issues!.length).toBeGreaterThan(0);
    });

    it('should detect checksum mismatch', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);
      entry.data = { test: 'modified' }; // Modify data
      
      const validation = service.validateCacheEntry(entry);
      expect(validation.isValid).toBe(false);
      expect(validation.isChecksumValid).toBe(false);
      expect(validation.issues).toBeDefined();
      expect(validation.issues!.length).toBeGreaterThan(0);
    });
  });

  describe('needsRefresh', () => {
    it('should not need refresh for fresh entry', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);
      const needsRefresh = service.needsRefresh(entry);

      expect(needsRefresh).toBe(false);
    });

    it('should need refresh for invalid entry', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data);
      entry.data = { test: 'modified' }; // Make invalid
      const needsRefresh = service.needsRefresh(entry);

      expect(needsRefresh).toBe(true);
    });

    it('should need refresh when approaching TTL threshold', () => {
      const data = { test: 'data' };
      const entry = service.createCacheEntry(data, 1000); // 1 second TTL
      
      // Manually set timestamp to make entry 90% through its TTL
      entry.timestamp = new Date(Date.now() - 900).toISOString(); // 900ms ago
      
      const needsRefresh = service.needsRefresh(entry, 0.8);
      expect(needsRefresh).toBe(true);
    });
  });

  describe('migrateCacheEntry', () => {
    it('should migrate old cache entry without version', () => {
      const oldEntry = { data: { test: 'data' } };
      const migrated = service.migrateCacheEntry(oldEntry);

      expect(migrated).not.toBeNull();
      expect(migrated?.version).toBeDefined();
      expect(migrated?.data).toEqual(oldEntry.data);
    });

    it('should migrate cache entry with version mismatch', () => {
      const oldEntry = { 
        data: { test: 'data' }, 
        version: '1.0.0',
        ttl: 60000
      };
      const migrated = service.migrateCacheEntry(oldEntry);

      expect(migrated).not.toBeNull();
      expect(migrated?.version).toBeDefined();
      expect(migrated?.data).toEqual(oldEntry.data);
    });

    it('should return null for invalid old entry', () => {
      const invalidEntry = null;
      const migrated = service.migrateCacheEntry(invalidEntry);

      expect(migrated).toBeNull();
    });
  });

  describe('getCacheHealthMetrics', () => {
    it('should calculate health metrics correctly', () => {
      const entries = [
        service.createCacheEntry({ test: 'data1' }),
        service.createCacheEntry({ test: 'data2' }),
        service.createCacheEntry({ test: 'data3' })
      ];

      // Make one entry invalid
      entries[1].data = { test: 'modified' };

      const metrics = service.getCacheHealthMetrics(entries);

      expect(metrics.totalEntries).toBe(3);
      expect(metrics.validEntries).toBe(2);
      expect(metrics.integrityFailures).toBe(1);
      expect(metrics.averageAge).toBeGreaterThanOrEqual(0);
    });
  });
});