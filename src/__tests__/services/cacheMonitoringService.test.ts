/**
 * Test Cache Monitoring Service
 * Story 2.1d: Implement Comprehensive Logging Strategy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheMonitoringService, cacheMonitoringService } from '../../services/cacheMonitoringService';

// Mock console methods for testing without affecting global console
const consoleSpy = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

describe('CacheMonitoringService', () => {
  let service: CacheMonitoringService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set to debug level to ensure all logs are output
    process.env.NODE_ENV = 'development';
    
    // Mock console methods for this test
    console.log = consoleSpy.log;
    console.warn = consoleSpy.warn;
    console.error = consoleSpy.error;
    console.debug = consoleSpy.debug;
    
    service = new CacheMonitoringService();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });

  describe('Cache Hit Logging', () => {
    it('should log cache hit with performance metrics', () => {
      service.logCacheHit('test-key', 1024, 50);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '💾 CACHE: Cache hit',
        expect.objectContaining({
          cacheKey: 'test-key',
          dataSize: 1024,
          responseTime: 50,
          hitRate: expect.any(Number)
        })
      );
    });

    it('should update metrics correctly', () => {
      service.logCacheHit('test-key', 1024, 50);
      service.logCacheHit('test-key2', 2048, 30);
      
      const metrics = service.getMetrics();
      expect(metrics.cacheHits).toBe(2);
      expect(metrics.totalOperations).toBe(2);
      expect(metrics.averageResponseTime).toBe(40);
    });
  });

  describe('Cache Miss Logging', () => {
    it('should log cache miss with reason', () => {
      service.logCacheMiss('test-key', 'No data available', 100);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '💾 CACHE: Cache miss',
        expect.objectContaining({
          cacheKey: 'test-key',
          reason: 'No data available',
          responseTime: 100
        })
      );
    });

    it('should update metrics correctly', () => {
      service.logCacheMiss('test-key', 'No data available');
      
      const metrics = service.getMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.totalOperations).toBe(1);
    });
  });

  describe('Cache Corruption Logging', () => {
    it('should log cache corruption with error details', () => {
      service.logCacheCorruption('test-key', 'Invalid JSON', { corrupted: true });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '💾 CACHE: Cache corruption detected',
        expect.objectContaining({
          cacheKey: 'test-key',
          error: 'Invalid JSON',
          corruptedData: { corrupted: true },
          corruptionCount: 1
        })
      );
    });

    it('should sanitize sensitive data', () => {
      service.logCacheCorruption('test-key', 'Error', { 
        password: 'secret123',
        token: 'abc123',
        normalData: 'safe'
      });
      
      const logCall = consoleSpy.error.mock.calls[0];
      const logData = logCall[1];
      expect(logData.corruptedData).toEqual({
        password: '[REDACTED]',
        token: '[REDACTED]',
        normalData: 'safe'
      });
    });
  });

  describe('Sync Failure Logging', () => {
    it('should log sync failure with details', () => {
      service.logSyncFailure('syncAllData', 'Network error', { table: 'agenda_items' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '🌐 SYNC: Sync operation failed',
        expect.objectContaining({
          operation: 'syncAllData',
          error: 'Network error',
          context: { table: 'agenda_items' },
          failureCount: 1
        })
      );
    });
  });

  describe('State Reset Logging', () => {
    it('should log state reset with context', () => {
      service.logStateReset('useSessionData', 'Error occurred', { sessions: [] });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '🔄 STATE: State reset occurred',
        expect.objectContaining({
          component: 'useSessionData',
          reason: 'Error occurred',
          previousState: expect.any(Object),
          resetCount: 1
        })
      );
    });
  });

  describe('Visibility Change Logging', () => {
    it('should log visibility change with sync decision', () => {
      service.logVisibilityChange(false, true, { isOnline: true, isAuthenticated: true });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '👁️ VISIBILITY: Page visibility changed',
        expect.objectContaining({
          hidden: false,
          willSync: true,
          isOnline: true,
          isAuthenticated: true
        })
      );
    });
  });

  describe('State Transition Logging', () => {
    it('should log state transition with details', () => {
      service.logStateTransition('useSessionData', { loading: false }, { loading: true }, 'start');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🔄 STATE: State transition occurred',
        expect.objectContaining({
          component: 'useSessionData',
          fromState: { loading: false },
          toState: { loading: true },
          loadingSource: 'start'
        })
      );
    });
  });

  describe('Metrics Management', () => {
    it('should calculate hit rate correctly', () => {
      service.logCacheHit('key1', 100);
      service.logCacheMiss('key2', 'No data');
      service.logCacheHit('key3', 200);
      
      expect(service.getHitRate()).toBe(67); // 2 hits out of 3 operations
    });

    it('should reset metrics', () => {
      service.logCacheHit('key1', 100);
      service.logCacheMiss('key2', 'No data');
      
      service.resetMetrics();
      const metrics = service.getMetrics();
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
      expect(metrics.totalOperations).toBe(0);
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level in production', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const prodService = new CacheMonitoringService();
      prodService.logCacheHit('test', 100);
      prodService.logCacheMiss('test', 'reason');
      
      // In production, only warnings and errors should be logged
      expect(consoleSpy.log).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Session ID Management', () => {
    it('should generate unique session IDs', () => {
      const sessionId1 = service.getSessionId();
      const sessionId2 = service.getSessionId();
      
      expect(sessionId1).toBe(sessionId2); // Same instance should have same ID
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize nested objects', () => {
      const sensitiveData = {
        user: {
          name: 'John',
          password: 'secret123',
          details: {
            token: 'abc123',
            email: 'john@example.com'
          }
        }
      };
      
      service.logCacheCorruption('test', 'Error', sensitiveData);
      
      const logCall = consoleSpy.error.mock.calls[0];
      const logData = logCall[1];
      expect(logData.corruptedData).toEqual({
        user: {
          name: 'John',
          password: '[REDACTED]',
          details: {
            token: '[REDACTED]',
            email: 'john@example.com'
          }
        }
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export logs with metrics', () => {
      service.logCacheHit('test', 100);
      const logs = service.exportLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        category: 'cache',
        message: 'Metrics export',
        data: expect.any(Object),
        timestamp: expect.any(String),
        sessionId: expect.any(String)
      });
    });
  });
});

describe('Singleton Instance', () => {
  it('should provide singleton instance', () => {
    expect(cacheMonitoringService).toBeInstanceOf(CacheMonitoringService);
  });
});
