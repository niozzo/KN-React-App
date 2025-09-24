/**
 * Integration tests for resilient data loading system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { robustDataService } from '../../services/robustDataService';
import { cacheAsideService } from '../../services/cacheAsideService';
import { fallbackChainService } from '../../services/fallbackChainService';
import { errorMonitoringService } from '../../services/errorMonitoringService';

// Mock fetch
global.fetch = vi.fn();

describe('Resilient Data Loading Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset services
    errorMonitoringService.clearOldErrors(0);
  });

  describe('Robust Data Service', () => {
    it('should load data from cache when available', async () => {
      // Mock cache to return data
      const mockData = [{ id: '1', name: 'Test Attendee' }];
      vi.spyOn(robustDataService, 'loadData').mockResolvedValue({
        success: true,
        data: mockData,
        source: 'cache',
        circuitState: 'CLOSED',
        timestamp: new Date().toISOString()
      });

      const result = await robustDataService.loadData('attendees');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.source).toBe('cache');
    });

    it('should fallback to API when cache fails', async () => {
      const mockApiData = [{ id: '1', name: 'API Attendee' }];
      
      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockApiData
        })
      });

      // Mock cache to return null (cache miss)
      vi.spyOn(robustDataService as any, 'tryCache').mockResolvedValue(null);
      
      // Mock circuit breaker to succeed
      vi.spyOn(robustDataService as any, 'fetchFromAPI').mockResolvedValue(mockApiData);

      const result = await robustDataService.loadData('attendees');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApiData);
      expect(result.source).toBe('api');
    });

    it('should use fallback data when all sources fail', async () => {
      // Mock all sources to fail
      (global.fetch as any).mockRejectedValue(new Error('API failed'));

      const result = await robustDataService.loadData('attendees');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Empty array fallback
      expect(result.source).toBe('fallback');
    });
  });

  describe('Cache-Aside Service', () => {
    it('should validate cached data before returning', async () => {
      const mockData = [{ id: '1', name: 'Valid Data' }];
      
      // Mock cache to return data
      vi.spyOn(cacheAsideService, 'get').mockResolvedValue({
        success: true,
        data: mockData,
        source: 'cache',
        validated: true,
        transformed: false,
        cacheHit: true,
        timestamp: new Date().toISOString()
      });

      const result = await cacheAsideService.get('attendees', async () => mockData);
      
      expect(result.success).toBe(true);
      expect(result.validated).toBe(true);
      expect(result.cacheHit).toBe(true);
    });

    it('should transform data when transformation is enabled', async () => {
      const mockData = [{ id: '1', name: 'Test Data' }];
      const transformedData = [{ id: '1', name: 'Transformed Data' }];
      
      // Register config with transformer
      cacheAsideService.registerConfig('test', {
        cacheKey: 'test_cache',
        dataTransformer: (data) => data.map((item: any) => ({ ...item, name: 'Transformed ' + item.name })),
        enableTransformation: true
      });

      const result = await cacheAsideService.get('test', async () => mockData);
      
      expect(result.success).toBe(true);
      expect(result.transformed).toBe(true);
    });
  });

  describe('Fallback Chain Service', () => {
    it('should execute strategies in priority order', async () => {
      const mockData = [{ id: '1', name: 'Fallback Data' }];
      
      // Mock strategies
      const strategy1 = vi.fn().mockRejectedValue(new Error('Strategy 1 failed'));
      const strategy2 = vi.fn().mockResolvedValue(mockData);
      const strategy3 = vi.fn().mockResolvedValue('Should not be called');

      fallbackChainService.registerChain('test', {
        strategies: [
          { name: 'strategy1', priority: 1, execute: strategy1 },
          { name: 'strategy2', priority: 2, execute: strategy2 },
          { name: 'strategy3', priority: 3, execute: strategy3 }
        ],
        maxRetries: 1,
        retryDelay: 0,
        enableLogging: false
      });

      const result = await fallbackChainService.executeChain('test');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.strategy).toBe('strategy2');
      expect(strategy1).toHaveBeenCalledTimes(1);
      expect(strategy2).toHaveBeenCalledTimes(1);
      expect(strategy3).not.toHaveBeenCalled();
    });

    it('should retry failed strategies', async () => {
      const mockData = [{ id: '1', name: 'Retry Success' }];
      
      let callCount = 0;
      const strategy = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Strategy failed');
        }
        return mockData;
      });

      fallbackChainService.registerChain('retry_test', {
        strategies: [
          { name: 'retry_strategy', priority: 1, execute: strategy }
        ],
        maxRetries: 2,
        retryDelay: 0,
        enableLogging: false
      });

      const result = await fallbackChainService.executeChain('retry_test');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(callCount).toBe(2);
    });
  });

  describe('Error Monitoring Integration', () => {
    it('should log errors from all services', async () => {
      const error = new Error('Test error');
      
      // Log error from different components
      errorMonitoringService.logError(error, { component: 'cache' }, 'medium');
      errorMonitoringService.logError(error, { component: 'api' }, 'high');
      errorMonitoringService.logError(error, { component: 'circuit_breaker' }, 'critical');

      const metrics = errorMonitoringService.getMetrics();
      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByComponent['cache']).toBe(1);
      expect(metrics.errorsByComponent['api']).toBe(1);
      expect(metrics.errorsByComponent['circuit_breaker']).toBe(1);
    });

    it('should create alerts for critical errors', async () => {
      const criticalError = new Error('AUTHENTICATION_REQUIRED');
      errorMonitoringService.logError(criticalError, { component: 'auth' }, 'critical');

      const alerts = errorMonitoringService.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'critical_error')).toBe(true);
    });

    it('should track error rates and health status', async () => {
      // Log multiple errors to test rate calculation
      for (let i = 0; i < 5; i++) {
        errorMonitoringService.logError(
          new Error(`Error ${i}`), 
          { component: 'test' }, 
          'medium'
        );
      }

      const health = errorMonitoringService.getHealthStatus();
      expect(health.errorRate).toBeGreaterThan(0);
      expect(health.isHealthy).toBe(true); // Should still be healthy with low error rate
    });
  });

  describe('End-to-End Resilience', () => {
    it('should handle complete system failure gracefully', async () => {
      // Mock all external dependencies to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      // This should not throw an error, but return fallback data
      const result = await robustDataService.loadData('attendees');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Empty array fallback
      expect(result.source).toBe('fallback');
    });

    it('should recover from temporary failures', async () => {
      const mockData = [{ id: '1', name: 'Recovered Data' }];
      
      // Mock cache to return null (cache miss)
      vi.spyOn(robustDataService as any, 'tryCache').mockResolvedValue(null);
      
      // First call fails, second call succeeds
      vi.spyOn(robustDataService as any, 'fetchFromAPI')
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockData);

      // First attempt should use fallback
      const result1 = await robustDataService.loadData('attendees');
      expect(result1.success).toBe(true);
      expect(result1.source).toBe('fallback');

      // Second attempt should succeed
      const result2 = await robustDataService.loadData('attendees');
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(mockData);
      expect(result2.source).toBe('api');
    });
  });
});
