/**
 * Cache Metrics Service
 * Story 2.1e2: Advanced Monitoring Dashboard
 * 
 * Provides enhanced metrics collection and historical data storage for cache monitoring
 */

export interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  cacheCorruptions: number;
  syncFailures: number;
  stateResets: number;
  averageResponseTime: number;
  totalDataSize: number;
  lastUpdated: string;
}

export interface HistoricalMetric {
  type: string;
  value: number;
  timestamp: string;
}

export interface CacheHealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning' | 'unknown';
  issues: string[];
  lastChecked: string;
}

export class CacheMetricsService {
  private metrics: CacheMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheCorruptions: 0,
    syncFailures: 0,
    stateResets: 0,
    averageResponseTime: 0,
    totalDataSize: 0,
    lastUpdated: new Date().toISOString()
  };

  private historicalData: HistoricalMetric[] = [];
  private healthStatus: CacheHealthStatus = {
    status: 'unknown',
    issues: [],
    lastChecked: new Date().toISOString()
  };

  /**
   * Record a cache hit with performance metrics
   */
  recordCacheHit(responseTime: number, dataSize: number): void {
    this.metrics.cacheHits++;
    this.updateAverageResponseTime(responseTime);
    this.metrics.totalDataSize += dataSize;
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('cache_hit', responseTime);
  }

  /**
   * Record a cache miss with reason
   */
  recordCacheMiss(reason: string, responseTime?: number): void {
    this.metrics.cacheMisses++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('cache_miss', responseTime || 0);
  }

  /**
   * Record cache corruption with error details
   */
  recordCacheCorruption(error: string): void {
    this.metrics.cacheCorruptions++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('cache_corruption', 0);
    this.updateHealthStatus();
  }

  /**
   * Record cache repair with details
   */
  recordCacheRepair(repairType: string): void {
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('cache_repair', 1);
    this.updateHealthStatus();
  }

  /**
   * Record sync failure
   */
  recordSyncFailure(): void {
    this.metrics.syncFailures++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('sync_failure', 0);
    this.updateHealthStatus();
  }

  /**
   * Record state reset
   */
  recordStateReset(): void {
    this.metrics.stateResets++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.storeHistoricalData('state_reset', 0);
    this.updateHealthStatus();
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get historical data for specified time period
   */
  getHistoricalData(hours: number = 24): HistoricalMetric[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.historicalData.filter(metric => 
      new Date(metric.timestamp) > cutoff
    );
  }

  /**
   * Get cache health status
   */
  getHealthStatus(): CacheHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Calculate hit rate percentage
   */
  getHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return Math.round((this.metrics.cacheHits / total) * 100);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    hitRate: number;
    averageResponseTime: number;
    totalDataSize: string;
    totalOperations: number;
  } {
    return {
      hitRate: this.getHitRate(),
      averageResponseTime: this.metrics.averageResponseTime,
      totalDataSize: this.formatBytes(this.metrics.totalDataSize),
      totalOperations: this.metrics.cacheHits + this.metrics.cacheMisses
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheCorruptions: 0,
      syncFailures: 0,
      stateResets: 0,
      averageResponseTime: 0,
      totalDataSize: 0,
      lastUpdated: new Date().toISOString()
    };
    this.historicalData = [];
    this.healthStatus = {
      status: 'unknown',
      issues: [],
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
    }
  }

  /**
   * Store historical data point
   */
  private storeHistoricalData(type: string, value: number): void {
    this.historicalData.push({
      type,
      value,
      timestamp: new Date().toISOString()
    });

    // Keep only last 7 days of data
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.historicalData = this.historicalData.filter(metric =>
      new Date(metric.timestamp) > weekAgo
    );
  }

  /**
   * Update health status based on current metrics
   */
  private updateHealthStatus(): void {
    const issues: string[] = [];
    
    // Check for critical issues
    if (this.metrics.cacheCorruptions > 0) {
      issues.push(`${this.metrics.cacheCorruptions} cache corruption(s) detected`);
    }
    
    if (this.metrics.syncFailures > 5) {
      issues.push(`${this.metrics.syncFailures} sync failures in current session`);
    }
    
    if (this.metrics.stateResets > 3) {
      issues.push(`${this.metrics.stateResets} state resets in current session`);
    }
    
    // Check hit rate
    const hitRate = this.getHitRate();
    if (hitRate < 50 && this.metrics.cacheHits + this.metrics.cacheMisses > 10) {
      issues.push(`Low hit rate: ${hitRate}%`);
    }
    
    // Check response time
    if (this.metrics.averageResponseTime > 1000) {
      issues.push(`High response time: ${this.metrics.averageResponseTime}ms`);
    }

    // Determine status
    let status: 'healthy' | 'unhealthy' | 'warning' | 'unknown';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.some(issue => issue.includes('corruption') || issue.includes('sync failures'))) {
      status = 'unhealthy';
    } else {
      status = 'warning';
    }

    this.healthStatus = {
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get metrics for specific time range
   */
  getMetricsForTimeRange(startTime: Date, endTime: Date): HistoricalMetric[] {
    return this.historicalData.filter(metric => {
      const metricTime = new Date(metric.timestamp);
      return metricTime >= startTime && metricTime <= endTime;
    });
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): {
    hitRateTrend: number[];
    responseTimeTrend: number[];
    timestamps: string[];
  } {
    const data = this.getHistoricalData(hours);
    const hitRateTrend: number[] = [];
    const responseTimeTrend: number[] = [];
    const timestamps: string[] = [];
    
    // Group data by hour
    const hourlyData = new Map<string, HistoricalMetric[]>();
    
    data.forEach(metric => {
      const hour = new Date(metric.timestamp).toISOString().substring(0, 13);
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(metric);
    });
    
    // Calculate trends
    hourlyData.forEach((metrics, hour) => {
      const hits = metrics.filter(m => m.type === 'cache_hit').length;
      const misses = metrics.filter(m => m.type === 'cache_miss').length;
      const total = hits + misses;
      
      hitRateTrend.push(total > 0 ? (hits / total) * 100 : 0);
      
      const responseTimes = metrics
        .filter(m => m.type === 'cache_hit' && m.value > 0)
        .map(m => m.value);
      
      responseTimeTrend.push(
        responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0
      );
      
      timestamps.push(hour);
    });
    
    return { hitRateTrend, responseTimeTrend, timestamps };
  }
}

// Export singleton instance
export const cacheMetricsService = new CacheMetricsService();
