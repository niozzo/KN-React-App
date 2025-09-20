/**
 * useCacheMetrics Hook Tests
 * Story 2.1e2: Advanced Monitoring Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCacheMetrics } from '../../hooks/useCacheMetrics';
import { cacheMetricsService } from '../../services/cacheMetricsService';

// Mock the cache metrics service
vi.mock('../../services/cacheMetricsService', () => ({
  cacheMetricsService: {
    getMetrics: vi.fn(),
    getHealthStatus: vi.fn(),
    getHistoricalData: vi.fn(),
    resetMetrics: vi.fn(),
    getPerformanceSummary: vi.fn(),
    getPerformanceTrends: vi.fn()
  }
}));

const mockCacheMetricsService = cacheMetricsService as any;

describe('useCacheMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize and load metrics', async () => {
      const mockMetrics = {
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      };
      
      const mockHealthStatus = {
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      };
      
      mockCacheMetricsService.getMetrics.mockReturnValue(mockMetrics);
      mockCacheMetricsService.getHealthStatus.mockReturnValue(mockHealthStatus);
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);

      const { result } = renderHook(() => useCacheMetrics());

      // Wait for async loading to complete
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.healthStatus).toEqual(mockHealthStatus);
      expect(result.current.error).toBeNull();
    });
  });

  describe('data loading', () => {
    it('should load metrics successfully', async () => {
      const mockMetrics = {
        cacheHits: 5,
        cacheMisses: 2,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 150,
        totalDataSize: 2048,
        lastUpdated: new Date().toISOString()
      };

      const mockHealthStatus = {
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      };

      const mockHistoricalData = [
        { type: 'cache_hit', value: 100, timestamp: new Date().toISOString() }
      ];

      mockCacheMetricsService.getMetrics.mockReturnValue(mockMetrics);
      mockCacheMetricsService.getHealthStatus.mockReturnValue(mockHealthStatus);
      mockCacheMetricsService.getHistoricalData.mockReturnValue(mockHistoricalData);

      const { result } = renderHook(() => useCacheMetrics());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.healthStatus).toEqual(mockHealthStatus);
      expect(result.current.historicalData).toEqual(mockHistoricalData);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load metrics';
      mockCacheMetricsService.getMetrics.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const { result } = renderHook(() => useCacheMetrics());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('auto refresh', () => {
    it('should auto refresh when enabled', async () => {
      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);

      const { result } = renderHook(() => useCacheMetrics(true, 1000));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(2);
    });

    it('should not auto refresh when disabled', async () => {
      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshMetrics', () => {
    it('should refresh metrics manually', async () => {
      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refreshMetrics();
      });

      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetMetrics', () => {
    it('should reset metrics and refresh', async () => {
      mockCacheMetricsService.resetMetrics.mockImplementation(() => {});
      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        result.current.resetMetrics();
      });

      expect(mockCacheMetricsService.resetMetrics).toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      const errorMessage = 'Failed to reset metrics';
      mockCacheMetricsService.resetMetrics.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      await act(async () => {
        result.current.resetMetrics();
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary', async () => {
      const mockSummary = {
        hitRate: 75,
        averageResponseTime: 150,
        totalDataSize: '2 KB',
        totalOperations: 8
      };

      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 6,
        cacheMisses: 2,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 150,
        totalDataSize: 2048,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);
      mockCacheMetricsService.getPerformanceSummary.mockReturnValue(mockSummary);

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const summary = result.current.getPerformanceSummary();
      expect(summary).toEqual(mockSummary);
    });

    it('should return null when no metrics', () => {
      const { result } = renderHook(() => useCacheMetrics(false));
      
      const summary = result.current.getPerformanceSummary();
      expect(summary).toBeNull();
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends', async () => {
      const mockTrends = {
        hitRateTrend: [75, 80, 85],
        responseTimeTrend: [150, 140, 130],
        timestamps: ['2024-01-01T10:00', '2024-01-01T11:00', '2024-01-01T12:00']
      };

      mockCacheMetricsService.getMetrics.mockReturnValue({
        cacheHits: 0,
        cacheMisses: 0,
        cacheCorruptions: 0,
        syncFailures: 0,
        stateResets: 0,
        averageResponseTime: 0,
        totalDataSize: 0,
        lastUpdated: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'healthy',
        issues: [],
        lastChecked: new Date().toISOString()
      });
      
      mockCacheMetricsService.getHistoricalData.mockReturnValue([]);
      mockCacheMetricsService.getPerformanceTrends.mockReturnValue(mockTrends);

      const { result } = renderHook(() => useCacheMetrics(false));

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const trends = result.current.getPerformanceTrends(24);
      expect(trends).toEqual(mockTrends);
    });
  });
});
