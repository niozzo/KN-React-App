/**
 * Cache Monitoring Service
 * Story 2.1d: Implement Comprehensive Logging Strategy
 * Story 2.1e2: Advanced Monitoring Dashboard
 * 
 * Provides centralized logging and metrics collection for cache operations
 */

export interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  cacheCorruptions: number;
  syncFailures: number;
  stateResets: number;
  totalOperations: number;
  averageResponseTime: number;
  totalDataSize?: number;
  lastUpdated?: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'cache' | 'state' | 'visibility' | 'sync';
  message: string;
  data: object;
  timestamp: string;
  sessionId?: string;
}

export class CacheMonitoringService {
  private metrics: CacheMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheCorruptions: 0,
    syncFailures: 0,
    stateResets: 0,
    totalOperations: 0,
    averageResponseTime: 0,
    totalDataSize: 0,
    lastUpdated: new Date().toISOString()
  };

  private responseTimes: number[] = [];
  private sessionId: string;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupLogLevel();
  }

  /**
   * Generate unique session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup log level based on environment
   */
  private setupLogLevel(): void {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      this.logLevel = 'warn';
    } else if (env === 'test') {
      this.logLevel = 'error';
    } else {
      this.logLevel = 'debug';
    }
  }

  /**
   * Log cache hit with performance metrics
   */
  logCacheHit(cacheKey: string, dataSize: number, responseTime?: number): void {
    this.metrics.cacheHits++;
    this.metrics.totalOperations++;
    this.metrics.totalDataSize! += dataSize;
    this.metrics.lastUpdated = new Date().toISOString();
    
    if (responseTime) {
      this.responseTimes.push(responseTime);
      this.updateAverageResponseTime();
    }

    this.log({
      level: 'info',
      category: 'cache',
      message: 'Cache hit',
      data: {
        cacheKey,
        dataSize,
        responseTime: responseTime || 'N/A',
        hitRate: this.getHitRate()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log cache miss with reason
   */
  logCacheMiss(cacheKey: string, reason: string, responseTime?: number): void {
    this.metrics.cacheMisses++;
    this.metrics.totalOperations++;
    this.metrics.lastUpdated = new Date().toISOString();
    
    if (responseTime) {
      this.responseTimes.push(responseTime);
      this.updateAverageResponseTime();
    }

    this.log({
      level: 'info',
      category: 'cache',
      message: 'Cache miss',
      data: {
        cacheKey,
        reason,
        responseTime: responseTime || 'N/A',
        hitRate: this.getHitRate()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log cache corruption with error details
   */
  logCacheCorruption(cacheKey: string, error: string, data?: any): void {
    this.metrics.cacheCorruptions++;
    this.metrics.totalOperations++;
    this.metrics.lastUpdated = new Date().toISOString();

    this.log({
      level: 'error',
      category: 'cache',
      message: 'Cache corruption detected',
      data: {
        cacheKey,
        error,
        corruptedData: this.sanitizeData(data),
        corruptionCount: this.metrics.cacheCorruptions
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log cache repair with details
   */
  logCacheRepair(cacheKey: string, reason: string): void {
    this.metrics.totalOperations++;
    this.metrics.lastUpdated = new Date().toISOString();

    this.log({
      level: 'info',
      category: 'cache',
      message: 'Cache repair successful',
      data: {
        cacheKey,
        reason,
        repairCount: this.metrics.totalOperations
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log sync failure with details
   */
  logSyncFailure(operation: string, error: string, context?: any): void {
    this.metrics.syncFailures++;
    this.metrics.totalOperations++;
    this.metrics.lastUpdated = new Date().toISOString();

    this.log({
      level: 'error',
      category: 'sync',
      message: 'Sync operation failed',
      data: {
        operation,
        error,
        context: this.sanitizeData(context),
        failureCount: this.metrics.syncFailures
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log state reset with context
   */
  logStateReset(component: string, reason: string, previousState?: any): void {
    this.metrics.stateResets++;
    this.metrics.totalOperations++;
    this.metrics.lastUpdated = new Date().toISOString();

    this.log({
      level: 'warn',
      category: 'state',
      message: 'State reset occurred',
      data: {
        component,
        reason,
        previousState: this.sanitizeData(previousState),
        resetCount: this.metrics.stateResets
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log visibility change with sync decision
   */
  logVisibilityChange(hidden: boolean, willSync: boolean, context: any): void {
    this.log({
      level: 'info',
      category: 'visibility',
      message: 'Page visibility changed',
      data: {
        hidden,
        willSync,
        isOnline: context.isOnline,
        isAuthenticated: context.isAuthenticated,
        lastSync: context.lastSync
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log state transition with details
   */
  logStateTransition(component: string, fromState: any, toState: any, loadingSource: string): void {
    this.log({
      level: 'info',
      category: 'state',
      message: 'State transition occurred',
      data: {
        component,
        fromState: this.sanitizeData(fromState),
        toState: this.sanitizeData(toState),
        loadingSource
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get hit rate percentage
   */
  getHitRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return Math.round((this.metrics.cacheHits / this.metrics.totalOperations) * 100);
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheCorruptions: 0,
      syncFailures: 0,
      stateResets: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      totalDataSize: 0,
      lastUpdated: new Date().toISOString()
    };
    this.responseTimes = [];
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = Math.round(sum / this.responseTimes.length);
    }
  }

  /**
   * Sanitize data to prevent sensitive information in logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'access_code'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }

  /**
   * Centralized logging with level filtering
   */
  private log(entry: LogEntry): void {
    const shouldLog = this.shouldLog(entry.level);
    if (!shouldLog) return;

    const logMessage = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(logMessage, entry.data);
        break;
      case 'warn':
        console.warn(logMessage, entry.data);
        break;
      case 'info':
        console.log(logMessage, entry.data);
        break;
      case 'debug':
        console.debug(logMessage, entry.data);
        break;
    }
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log entry for consistent output
   */
  private formatLogEntry(entry: LogEntry): string {
    const emoji = this.getCategoryEmoji(entry.category);
    return `${emoji} ${entry.category.toUpperCase()}: ${entry.message}`;
  }

  /**
   * Get emoji for log category
   */
  private getCategoryEmoji(category: string): string {
    const emojis = {
      cache: '💾',
      state: '🔄',
      visibility: '👁️',
      sync: '🌐'
    };
    return emojis[category as keyof typeof emojis] || '📝';
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): LogEntry[] {
    // In a real implementation, this would return stored logs
    // For now, return current metrics as a log entry
    return [{
      level: 'info',
      category: 'cache',
      message: 'Metrics export',
      data: this.getMetrics(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }];
  }
}

// Export singleton instance
export const cacheMonitoringService = new CacheMonitoringService();
