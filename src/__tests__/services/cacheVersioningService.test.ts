/**
 * Cache Versioning Service Tests
 * 
 * Tests for cache versioning, TTL validation, and data integrity checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheVersioningService, type CacheEntry, type ValidationResult } from '../../services/cacheVersioningService';

describe('CacheVersioningService', () => {
  let service: CacheVersioningService;

  beforeEach(() => {
    service = new CacheVersioningService();
  });

  describe('createCacheEntry', () => {
    it('should create cache entry with default TTL', () => {
      const data = [{ id: 1, name: 'Test' }];
      const entry = service.createCacheEntry(data);

      expect(entry.data).toEqual(data);
      expect(entry.version).toBe('2.1.0');
      expect(entry.timestamp).toBeDefined();
      expect(entry.ttl).toBe(7 * 24 * 60 * 60 * 1000); // 7 days (default for non-agenda data)
      expect(entry.checksum).toBeDefined();
    });

    it('should create cache entry with custom TTL', () => {
      const data = [{ id: 1, name: 'Test' }];
      const customTTL = 5 * 60 * 1000; // 5 minutes
      const entry = service.createCacheEntry(data, customTTL);

      expect(entry.ttl).toBe(customTTL);
    });

    it('should create cache entry with custom version', () => {
      const data = [{ id: 1, name: 'Test' }];
      const customVersion = '3.0.0';
      const entry = service.createCacheEntry(data, undefined, customVersion);

      expect(entry.version).toBe(customVersion);
    });

    it('should use appropriate TTL for different data types', () => {
      // Dynamic data (agenda items) - should use short TTL
      const agendaData = [{ id: 1, start_time: '09:00:00', end_time: '10:00:00' }];
      const agendaEntry = service.createCacheEntry(agendaData);
      expect(agendaEntry.ttl).toBe(5 * 60 * 1000); // 5 minutes

      // Static data (sponsors) - should use long TTL
      const sponsorData = [{ id: 1, name: 'Sponsor', logo: 'logo.png' }];
      const sponsorEntry = service.createCacheEntry(sponsorData);
      expect(sponsorEntry.ttl).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    });
  });

  describe('validateCacheEntry', () => {
    let validEntry: CacheEntry;

    beforeEach(() => {
      validEntry = service.createCacheEntry([{ id: 1, name: 'Test' }]);
    });

    it('should validate fresh cache entry', () => {
      const result = service.validateCacheEntry(validEntry);

      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.isVersionValid).toBe(true);
      expect(result.isChecksumValid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should detect expired cache entry', () => {
      // Create expired entry
      const expiredEntry: CacheEntry = {
        ...validEntry,
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        ttl: 24 * 60 * 60 * 1000 // 24 hours TTL
      };

      const result = service.validateCacheEntry(expiredEntry);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('expired');
    });

    it('should detect version mismatch', () => {
      const versionMismatchEntry: CacheEntry = {
        ...validEntry,
        version: '1.0.0'
      };

      const result = service.validateCacheEntry(versionMismatchEntry);

      expect(result.isValid).toBe(false);
      expect(result.isVersionValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('version');
    });

    it('should detect checksum mismatch', () => {
      const checksumMismatchEntry: CacheEntry = {
        ...validEntry,
        checksum: 'invalid_checksum'
      };

      const result = service.validateCacheEntry(checksumMismatchEntry);

      expect(result.isValid).toBe(false);
      expect(result.isChecksumValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('checksum');
    });

    it('should calculate age correctly', () => {
      const now = Date.now();
      const entry: CacheEntry = {
        ...validEntry,
        timestamp: new Date(now - 5000).toISOString() // 5 seconds ago
      };

      const result = service.validateCacheEntry(entry);

      expect(result.age).toBeCloseTo(5000, -2); // Within 100ms tolerance
    });
  });

  describe('needsRefresh', () => {
    let freshEntry: CacheEntry;

    beforeEach(() => {
      freshEntry = service.createCacheEntry([{ id: 1, name: 'Test' }]);
    });

    it('should not need refresh for fresh entry', () => {
      const needsRefresh = service.needsRefresh(freshEntry);
      expect(needsRefresh).toBe(false);
    });

    it('should need refresh for entry near expiration', () => {
      const nearExpirationEntry: CacheEntry = {
        ...freshEntry,
        timestamp: new Date(Date.now() - 0.9 * freshEntry.ttl).toISOString()
      };

      const needsRefresh = service.needsRefresh(nearExpirationEntry, 0.8);
      expect(needsRefresh).toBe(true);
    });

    it('should need refresh for invalid entry', () => {
      const invalidEntry: CacheEntry = {
        ...freshEntry,
        version: '1.0.0' // Wrong version
      };

      const needsRefresh = service.needsRefresh(invalidEntry);
      expect(needsRefresh).toBe(true);
    });
  });

  describe('migrateCacheEntry', () => {
    it('should migrate old cache format', () => {
      const oldEntry = {
        data: [{ id: 1, name: 'Test' }],
        timestamp: Date.now()
      };

      const migrated = service.migrateCacheEntry(oldEntry);

      expect(migrated).not.toBeNull();
      expect(migrated!.version).toBe('2.1.0');
      expect(migrated!.data).toEqual(oldEntry.data);
      expect(migrated!.ttl).toBeDefined();
      expect(migrated!.checksum).toBeDefined();
    });

    it('should migrate version mismatch', () => {
      const versionMismatchEntry = {
        data: [{ id: 1, name: 'Test' }],
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ttl: 60000
      };

      const migrated = service.migrateCacheEntry(versionMismatchEntry);

      expect(migrated).not.toBeNull();
      expect(migrated!.version).toBe('2.1.0');
    });

    it('should return null for invalid data', () => {
      const invalidEntry = null;
      const migrated = service.migrateCacheEntry(invalidEntry);

      expect(migrated).toBeNull();
    });

    it('should return existing entry if version matches', () => {
      const validEntry = service.createCacheEntry([{ id: 1, name: 'Test' }]);
      const migrated = service.migrateCacheEntry(validEntry);

      expect(migrated).toBe(validEntry);
    });
  });

  describe('getCacheHealthMetrics', () => {
    it('should calculate metrics for valid entries', () => {
      const entries = [
        service.createCacheEntry([{ id: 1, name: 'Test1' }]),
        service.createCacheEntry([{ id: 2, name: 'Test2' }])
      ];

      const metrics = service.getCacheHealthMetrics(entries);

      expect(metrics.totalEntries).toBe(2);
      expect(metrics.validEntries).toBe(2);
      expect(metrics.expiredEntries).toBe(0);
      expect(metrics.versionMismatches).toBe(0);
      expect(metrics.integrityFailures).toBe(0);
      expect(metrics.averageAge).toBeGreaterThanOrEqual(0);
    });

    it('should calculate metrics for mixed entries', () => {
      const entries = [
        service.createCacheEntry([{ id: 1, name: 'Test1' }]), // Valid
        {
          ...service.createCacheEntry([{ id: 2, name: 'Test2' }]),
          version: '1.0.0' // Version mismatch
        },
        {
          ...service.createCacheEntry([{ id: 3, name: 'Test3' }]),
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          ttl: 24 * 60 * 60 * 1000 // Expired
        }
      ];

      const metrics = service.getCacheHealthMetrics(entries);

      expect(metrics.totalEntries).toBe(3);
      expect(metrics.validEntries).toBe(1);
      expect(metrics.expiredEntries).toBe(1);
      expect(metrics.versionMismatches).toBe(1);
      expect(metrics.integrityFailures).toBe(0);
    });

    it('should handle empty entries array', () => {
      const metrics = service.getCacheHealthMetrics([]);

      expect(metrics.totalEntries).toBe(0);
      expect(metrics.validEntries).toBe(0);
      expect(metrics.averageAge).toBe(0);
    });
  });

  describe('checksum calculation', () => {
    it('should generate consistent checksums for same data', () => {
      const data = [{ id: 1, name: 'Test' }];
      const entry1 = service.createCacheEntry(data);
      const entry2 = service.createCacheEntry(data);

      expect(entry1.checksum).toBe(entry2.checksum);
    });

    it('should generate different checksums for different data', async () => {
      const data1 = [{ id: 1, name: 'Test1', value: 'completely different data structure' }];
      const entry1 = service.createCacheEntry(data1);
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const data2 = [{ id: 2, name: 'Test2', value: 'totally different content' }];
      const entry2 = service.createCacheEntry(data2);

      expect(entry1.checksum).not.toBe(entry2.checksum);
    });

    it('should handle checksum calculation errors gracefully', () => {
      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      vi.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('Stringify error');
      });

      const data = [{ id: 1, name: 'Test' }];
      const entry = service.createCacheEntry(data);

      expect(entry.checksum).toBe('invalid');

      // Restore original method
      vi.restoreAllMocks();
    });
  });
});
