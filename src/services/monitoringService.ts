/**
 * Monitoring Service
 * Comprehensive error monitoring and performance tracking
 * Story 2.1f: Enhanced Monitoring and Performance Tracking
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface CacheMetric {
  operation: 'get' | 'set' | 'remove' | 'invalidate' | 'clear';
  key: string;
  success: boolean;
  duration: number;
  size?: number;
  timestamp: Date;
}

export interface UserActionMetric {
  action: string;
  component: string;
  duration?: number;
  success: boolean;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableUserActionTracking: boolean;
  enableCacheTracking: boolean;
  maxMetricsHistory: number;
  reportInterval: number; // in milliseconds
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  remoteEndpoint?: string;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private errorMetrics: ErrorMetric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private userActionMetrics: UserActionMetric[] = [];
  private reportTimer?: NodeJS.Timeout;
  private abortController?: AbortController;

  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableUserActionTracking: true,
      enableCacheTracking: true,
      maxMetricsHistory: 1000,
      reportInterval: 30000, // 30 seconds
      enableConsoleLogging: true,
      enableRemoteReporting: false,
      ...config
    };

    this.startReporting();
  }

  static getInstance(config?: Partial<MonitoringConfig>): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }

  /**
   * Track error metrics
   */
  trackError(error: Error, context: {
    component?: string;
    action?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  } = {}): void {
    if (!this.config.enableErrorTracking) return;

    const errorMetric: ErrorMetric = {
      message: error.message,
      stack: error.stack,
      component: context.component,
      action: context.action,
      severity: context.severity || 'medium',
      timestamp: new Date(),
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: context.metadata
    };

    this.errorMetrics.push(errorMetric);
    this.trimMetrics('error');

    if (this.config.enableConsoleLogging) {
      console.error('🚨 Error tracked:', errorMetric);
    }

    // Report critical errors immediately
    if (errorMetric.severity === 'critical') {
      this.reportMetrics();
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(name: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): void {
    if (!this.config.enablePerformanceTracking) return;

    const performanceMetric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata
    };

    this.performanceMetrics.push(performanceMetric);
    this.trimMetrics('performance');

    if (this.config.enableConsoleLogging) {
      console.log('📊 Performance tracked:', performanceMetric);
    }
  }

  /**
   * Track cache operations
   */
  trackCacheOperation(operation: CacheMetric['operation'], key: string, success: boolean, duration: number, size?: number): void {
    if (!this.config.enableCacheTracking) return;

    const cacheMetric: CacheMetric = {
      operation,
      key,
      success,
      duration,
      size,
      timestamp: new Date()
    };

    this.cacheMetrics.push(cacheMetric);
    this.trimMetrics('cache');

    if (this.config.enableConsoleLogging) {
    }
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, component: string, success: boolean, duration?: number, userId?: string, metadata?: Record<string, any>): void {
    if (!this.config.enableUserActionTracking) return;

    const userActionMetric: UserActionMetric = {
      action,
      component,
      duration,
      success,
      timestamp: new Date(),
      userId,
      metadata
    };

    this.userActionMetrics.push(userActionMetric);
    this.trimMetrics('userAction');

    if (this.config.enableConsoleLogging) {
      console.log('👤 User action tracked:', userActionMetric);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    cacheHitRate: number;
    topSlowOperations: PerformanceMetric[];
    recentErrors: ErrorMetric[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Filter recent metrics
    const recentPerformance = this.performanceMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentErrors = this.errorMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentCache = this.cacheMetrics.filter(m => m.timestamp >= oneHourAgo);

    // Calculate averages
    const averageResponseTime = recentPerformance.length > 0
      ? recentPerformance.reduce((sum, m) => sum + m.value, 0) / recentPerformance.length
      : 0;

    const totalRequests = recentPerformance.length;
    const errorRate = recentErrors.length / Math.max(totalRequests, 1);

    const cacheHits = recentCache.filter(m => m.success).length;
    const cacheHitRate = recentCache.length > 0 ? cacheHits / recentCache.length : 0;

    // Top slow operations
    const topSlowOperations = [...recentPerformance]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      averageResponseTime,
      totalRequests,
      errorRate,
      cacheHitRate,
      topSlowOperations,
      recentErrors: recentErrors.slice(-10)
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: ErrorMetric[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorMetrics.filter(m => m.timestamp >= oneHourAgo);

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByComponent = recentErrors.reduce((acc, error) => {
      const component = error.component || 'unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByComponent,
      recentErrors: recentErrors.slice(-10)
    };
  }

  /**
   * Get cache performance summary
   */
  getCacheSummary(): {
    totalOperations: number;
    hitRate: number;
    averageOperationTime: number;
    operationsByType: Record<string, number>;
    recentOperations: CacheMetric[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentOperations = this.cacheMetrics.filter(m => m.timestamp >= oneHourAgo);

    const totalOperations = recentOperations.length;
    const successfulOperations = recentOperations.filter(m => m.success).length;
    const hitRate = totalOperations > 0 ? successfulOperations / totalOperations : 0;

    const averageOperationTime = recentOperations.length > 0
      ? recentOperations.reduce((sum, m) => sum + m.duration, 0) / recentOperations.length
      : 0;

    const operationsByType = recentOperations.reduce((acc, op) => {
      acc[op.operation] = (acc[op.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOperations,
      hitRate,
      averageOperationTime,
      operationsByType,
      recentOperations: recentOperations.slice(-20)
    };
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    performance: ReturnType<typeof this.getPerformanceSummary>;
    errors: ReturnType<typeof this.getErrorSummary>;
    cache: ReturnType<typeof this.getCacheSummary>;
    timestamp: Date;
  } {
    const performance = this.getPerformanceSummary();
    const errors = this.getErrorSummary();
    const cache = this.getCacheSummary();

    // Determine overall health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (errors.totalErrors > 10 || performance.errorRate > 0.1) {
      status = 'critical';
    } else if (errors.totalErrors > 5 || performance.errorRate > 0.05 || cache.hitRate < 0.8) {
      status = 'warning';
    }

    return {
      status,
      performance,
      errors,
      cache,
      timestamp: new Date()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.errorMetrics = [];
    this.performanceMetrics = [];
    this.cacheMetrics = [];
    this.userActionMetrics = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.reportInterval) {
      this.stopReporting();
      this.startReporting();
    }
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  /**
   * Stop periodic reporting
   */
  private stopReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }
  }

  /**
   * Report metrics to remote endpoint
   */
  private async reportMetrics(): Promise<void> {
    if (!this.config.enableRemoteReporting || !this.config.remoteEndpoint) {
      return;
    }

    try {
      // Create new abort controller for this request
      this.abortController = new AbortController();
      const healthStatus = this.getHealthStatus();
      
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthStatus),
        signal: this.abortController.signal
      });

      if (this.config.enableConsoleLogging) {
        console.log('📡 Metrics reported to remote endpoint');
      }
    } catch (error) {
      // Don't log AbortError - it's expected during cleanup
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to report metrics:', error);
      }
    }
  }

  /**
   * Trim metrics to prevent memory leaks
   */
  private trimMetrics(type: 'error' | 'performance' | 'cache' | 'userAction'): void {
    const maxHistory = this.config.maxMetricsHistory;
    
    switch (type) {
      case 'error':
        if (this.errorMetrics.length > maxHistory) {
          this.errorMetrics = this.errorMetrics.slice(-maxHistory);
        }
        break;
      case 'performance':
        if (this.performanceMetrics.length > maxHistory) {
          this.performanceMetrics = this.performanceMetrics.slice(-maxHistory);
        }
        break;
      case 'cache':
        if (this.cacheMetrics.length > maxHistory) {
          this.cacheMetrics = this.cacheMetrics.slice(-maxHistory);
        }
        break;
      case 'userAction':
        if (this.userActionMetrics.length > maxHistory) {
          this.userActionMetrics = this.userActionMetrics.slice(-maxHistory);
        }
        break;
    }
  }

  /**
   * Performance measurement decorator
   */
  static measurePerformance<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    metadata?: Record<string, any>
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.then((value) => {
          const duration = performance.now() - start;
          MonitoringService.getInstance().trackPerformance(name, duration, 'ms', metadata);
          return value;
        });
      } else {
        const duration = performance.now() - start;
        MonitoringService.getInstance().trackPerformance(name, duration, 'ms', metadata);
        return result;
      }
    }) as T;
  }

  /**
   * Error tracking decorator
   */
  static trackErrors<T extends (...args: any[]) => any>(
    fn: T,
    context: {
      component?: string;
      action?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.catch((error) => {
            MonitoringService.getInstance().trackError(error, context);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        MonitoringService.getInstance().trackError(error as Error, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopReporting();
    
    // Abort any pending fetch requests to prevent hanging tests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    
    console.log('✅ MonitoringService: Cleaned up all resources');
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Export convenience functions
export const trackError = (error: Error, context?: Parameters<typeof monitoringService.trackError>[1]) => 
  monitoringService.trackError(error, context);

export const trackPerformance = (name: string, value: number, unit?: string, metadata?: Record<string, any>) =>
  monitoringService.trackPerformance(name, value, unit, metadata);

export const trackCacheOperation = (operation: CacheMetric['operation'], key: string, success: boolean, duration: number, size?: number) =>
  monitoringService.trackCacheOperation(operation, key, success, duration, size);

export const trackUserAction = (action: string, component: string, success: boolean, duration?: number, userId?: string, metadata?: Record<string, any>) =>
  monitoringService.trackUserAction(action, component, success, duration, userId, metadata);

export const getHealthStatus = () => monitoringService.getHealthStatus();
export const getPerformanceSummary = () => monitoringService.getPerformanceSummary();
export const getErrorSummary = () => monitoringService.getErrorSummary();
export const getCacheSummary = () => monitoringService.getCacheSummary();
