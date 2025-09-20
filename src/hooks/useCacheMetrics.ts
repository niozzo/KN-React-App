/**
 * useCacheMetrics Hook
 * Story 2.1e2: Advanced Monitoring Dashboard
 * 
 * React hook for accessing cache metrics and health status
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheMetricsService, CacheMetrics, HistoricalMetric, CacheHealthStatus } from '../services/cacheMetricsService';

export interface UseCacheMetricsReturn {
  metrics: CacheMetrics | null;
  healthStatus: CacheHealthStatus | null;
  historicalData: HistoricalMetric[];
  loading: boolean;
  error: string | null;
  refreshMetrics: () => void;
  resetMetrics: () => void;
  getPerformanceSummary: () => {
    hitRate: number;
    averageResponseTime: number;
    totalDataSize: string;
    totalOperations: number;
  } | null;
  getPerformanceTrends: (hours?: number) => {
    hitRateTrend: number[];
    responseTimeTrend: number[];
    timestamps: string[];
  };
}

export const useCacheMetrics = (autoRefresh: boolean = true, refreshInterval: number = 5000): UseCacheMetricsReturn => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<CacheHealthStatus | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(() => {
    try {
      setError(null);
      const currentMetrics = cacheMetricsService.getMetrics();
      const health = cacheMetricsService.getHealthStatus();
      const historical = cacheMetricsService.getHistoricalData(24);
      
      setMetrics(currentMetrics);
      setHealthStatus(health);
      setHistoricalData(historical);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cache metrics';
      setError(errorMessage);
      setLoading(false);
      console.error('Error loading cache metrics:', err);
    }
  }, []);

  const refreshMetrics = useCallback(() => {
    setLoading(true);
    loadMetrics();
  }, [loadMetrics]);

  const resetMetrics = useCallback(() => {
    try {
      cacheMetricsService.resetMetrics();
      refreshMetrics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset metrics';
      setError(errorMessage);
      console.error('Error resetting cache metrics:', err);
    }
  }, [refreshMetrics]);

  const getPerformanceSummary = useCallback(() => {
    if (!metrics) return null;
    return cacheMetricsService.getPerformanceSummary();
  }, [metrics]);

  const getPerformanceTrends = useCallback((hours: number = 24) => {
    return cacheMetricsService.getPerformanceTrends(hours);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMetrics]);

  return {
    metrics,
    healthStatus,
    historicalData,
    loading,
    error,
    refreshMetrics,
    resetMetrics,
    getPerformanceSummary,
    getPerformanceTrends
  };
};

export default useCacheMetrics;
