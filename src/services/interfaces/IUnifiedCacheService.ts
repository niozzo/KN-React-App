/**
 * Interface for Unified Cache Service
 * Story 2.1f1: Unified Cache Service
 */

export interface CacheHealthStatus {
  isHealthy: boolean;
  metrics: any;
  consistency: any;
  lastChecked: string;
}

export interface IUnifiedCacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
  getHealthStatus(): Promise<CacheHealthStatus>;
  getMetrics(): any;
  getMonitoringService(): any;
  getVersioningService(): any;
  getConsistencyService(): any;
}
