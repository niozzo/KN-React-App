/**
 * Simple Bug Fixes Test Suite
 * 
 * Tests the core functionality without complex mocking conflicts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceTestFactory } from '../factories/ServiceTestFactory';

describe('Bug Fixes - Simple Tests', () => {
  beforeEach(() => {
    // Reset environment for each test
    vi.stubEnv('NODE_ENV', 'test');
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    });
  });

  describe('BaseService Environment Detection', () => {
    it('should detect local mode correctly', () => {
      vi.stubEnv('NODE_ENV', 'development');
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });

      const baseService = ServiceTestFactory.createBaseService();
      expect(baseService.isLocalMode()).toBe(true);
    });

    it('should detect production mode correctly', () => {
      vi.stubEnv('NODE_ENV', 'production');
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true
      });

      const baseService = ServiceTestFactory.createBaseService();
      expect(baseService.isLocalMode()).toBe(false);
    });

    it('should have proper API base URL for local mode', () => {
      vi.stubEnv('NODE_ENV', 'development');
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });

      const baseService = ServiceTestFactory.createBaseService();
      expect(baseService.getApiBaseUrl()).toBe('/api');
    });

    it('should have proper API base URL for production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true
      });

      const baseService = ServiceTestFactory.createBaseService();
      expect(baseService.getApiBaseUrl()).toBe('https://iikcgdhztkrexuuqheli.supabase.co');
    });
  });

  describe('Service Dependencies', () => {
    it('should accept custom dependencies', () => {
      const mockSupabase = { test: 'client' };
      const baseService = ServiceTestFactory.createBaseService({
        supabaseClient: mockSupabase
      });

      expect(baseService.getSupabaseClient()).toBe(mockSupabase);
    });

    it('should have access to cache service', () => {
      const mockCache = { test: 'cache' };
      const baseService = ServiceTestFactory.createBaseService({
        cacheService: mockCache
      });

      expect(baseService.getCacheService()).toBe(mockCache);
    });
  });

  describe('Service Factory', () => {
    it('should create PWADataSyncService with mocks', async () => {
      const service = await ServiceTestFactory.createPWADataSyncService();
      
      expect(service).toBeDefined();
      expect(typeof service.isLocalMode).toBe('function');
      expect(typeof service.getCacheTTL).toBe('function');
      expect(typeof service.syncAllData).toBe('function');
    });

    it('should create ServerDataSyncService with mocks', async () => {
      const service = await ServiceTestFactory.createServerDataSyncService();
      
      expect(service).toBeDefined();
      expect(typeof service.isLocalMode).toBe('function');
      expect(typeof service.syncAllData).toBe('function');
    });
  });
});
