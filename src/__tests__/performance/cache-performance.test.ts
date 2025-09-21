/**
 * Cache Performance Tests
 * Story 2.1f4: Integration & Testing
 * 
 * Performance tests for cache operations and large datasets
 */

import { performance } from 'perf_hooks';
import { UnifiedCacheService } from '../../services/unifiedCacheService';

// Mock localStorage for performance testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Cache Performance', () => {
  let cacheService: UnifiedCacheService;
  const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
    id: `item-${i}`,
    title: `Session ${i}`,
    data: `Large data payload ${i}`.repeat(100)
  }));

  beforeEach(() => {
    cacheService = new UnifiedCacheService();
    vi.clearAllMocks();
  });

  it('should handle large datasets efficiently', async () => {
    const startTime = performance.now();

    await cacheService.set('large-dataset', largeDataset);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should retrieve large datasets efficiently', async () => {
    await cacheService.set('large-dataset', largeDataset);

    const startTime = performance.now();
    const retrieved = await cacheService.get('large-dataset');
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(retrieved).toEqual(largeDataset);
    expect(duration).toBeLessThan(50); // Should retrieve in under 50ms
  });

  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 100 }, (_, i) => 
      cacheService.set(`key-${i}`, { data: `value-${i}` })
    );

    const startTime = performance.now();
    await Promise.all(operations);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500); // Should complete all operations in under 500ms
  });

  it('should maintain memory efficiency', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform many cache operations
    for (let i = 0; i < 1000; i++) {
      await cacheService.set(`key-${i}`, { data: `value-${i}` });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should not increase by more than 50MB
  });

  it('should handle cache invalidation efficiently', async () => {
    // Set up many cache entries
    for (let i = 0; i < 100; i++) {
      await cacheService.set(`kn_cache_item_${i}`, { data: `value-${i}` });
    }

    const startTime = performance.now();
    await cacheService.invalidate('kn_cache_');
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should invalidate all entries in under 100ms
  });

  it('should handle cache clearing efficiently', async () => {
    // Set up many cache entries
    for (let i = 0; i < 100; i++) {
      await cacheService.set(`kn_cache_item_${i}`, { data: `value-${i}` });
    }

    const startTime = performance.now();
    await cacheService.clear();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50); // Should clear all entries in under 50ms
  });

  it('should handle mixed read/write operations efficiently', async () => {
    const operations = [];
    
    // Mix of reads and writes
    for (let i = 0; i < 50; i++) {
      operations.push(cacheService.set(`key-${i}`, { data: `value-${i}` }));
      operations.push(cacheService.get(`key-${i - 10}`)); // Read previous entries
    }

    const startTime = performance.now();
    await Promise.all(operations);
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(200); // Should complete mixed operations in under 200ms
  });

  it('should handle cache health checks efficiently', async () => {
    // Set up some cache data
    await cacheService.set('kn_cache_agenda_items', [{ id: '1', title: 'Test' }]);
    await cacheService.set('kn_cache_attendee', { id: '1', name: 'Test User' });

    const startTime = performance.now();
    const healthStatus = await cacheService.getHealthStatus();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(healthStatus).toBeDefined();
    expect(duration).toBeLessThan(50); // Should complete health check in under 50ms
  });

  it('should handle error scenarios without performance degradation', async () => {
    // Mock localStorage to throw errors
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const startTime = performance.now();
    
    try {
      await cacheService.set('test-key', { data: 'test' });
    } catch (error) {
      // Expected to throw
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(10); // Should fail fast in under 10ms
  });

  it('should handle rapid successive operations', async () => {
    const startTime = performance.now();

    // Rapid successive operations
    for (let i = 0; i < 100; i++) {
      await cacheService.set(`rapid-${i}`, { data: `value-${i}` });
      await cacheService.get(`rapid-${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete 200 operations in under 1 second
  });
});
