/**
 * Error Monitoring Service
 * 
 * Provides comprehensive error monitoring, logging, and alerting
 * for the application with detailed error tracking and analysis.
 */

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByComponent: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByType: Record<string, number>;
  lastErrorTime: string;
  errorRate: number; // errors per minute
}

export interface ErrorAlert {
  id: string;
  type: 'error_rate' | 'critical_error' | 'component_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  resolved: boolean;
}

export class ErrorMonitoringService {
  private errors: Array<{
    id: string;
    error: Error;
    context: ErrorContext;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
  }> = [];

  private alerts: Map<string, ErrorAlert> = new Map();
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByComponent: {},
    errorsBySeverity: {},
    errorsByType: {},
    lastErrorTime: '',
    errorRate: 0
  };

  private readonly MAX_ERRORS = 1000; // Keep last 1000 errors
  private readonly ERROR_RATE_THRESHOLD = 10; // errors per minute
  private readonly CRITICAL_ERROR_TYPES = [
    'AUTHENTICATION_REQUIRED',
    'CIRCUIT_OPEN',
    'CACHE_CORRUPTION',
    'API_FAILURE'
  ];

  /**
   * Log an error with context
   */
  logError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    const fullContext: ErrorContext = {
      component: 'unknown',
      action: 'unknown',
      timestamp: new Date().toISOString(),
      ...context
    };

    const errorEntry = {
      id: errorId,
      error,
      context: fullContext,
      severity,
      timestamp: fullContext.timestamp
    };

    // Add to errors array
    this.errors.push(errorEntry);
    
    // Keep only last MAX_ERRORS
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    // Update metrics
    this.updateMetrics(errorEntry);

    // Check for alerts
    this.checkForAlerts(errorEntry);

    // Log to console with appropriate level
    this.logToConsole(errorEntry);

    return errorId;
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): Array<{
    id: string;
    message: string;
    component: string;
    severity: string;
    timestamp: string;
  }> {
    return this.errors
      .slice(-limit)
      .map(error => ({
        id: error.id,
        message: error.error.message,
        component: error.context.component,
        severity: error.severity,
        timestamp: error.timestamp
      }))
      .reverse();
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(component: string, limit: number = 50): Array<{
    id: string;
    message: string;
    severity: string;
    timestamp: string;
  }> {
    return this.errors
      .filter(error => error.context.component === component)
      .slice(-limit)
      .map(error => ({
        id: error.id,
        message: error.error.message,
        severity: error.severity,
        timestamp: error.timestamp
      }))
      .reverse();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get error rate for a time period
   */
  getErrorRate(minutes: number = 5): number {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const recentErrors = this.errors.filter(error => error.timestamp > cutoffTime);
    return recentErrors.length / minutes;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    errorRate: number;
    criticalErrors: number;
    activeAlerts: number;
    lastErrorTime: string;
  } {
    const errorRate = this.getErrorRate(5);
    const criticalErrors = this.errors.filter(error => 
      error.severity === 'critical' || 
      this.CRITICAL_ERROR_TYPES.some(type => error.error.message.includes(type))
    ).length;
    const activeAlerts = this.getActiveAlerts().length;

    return {
      isHealthy: errorRate < this.ERROR_RATE_THRESHOLD && criticalErrors === 0,
      errorRate,
      criticalErrors,
      activeAlerts,
      lastErrorTime: this.metrics.lastErrorTime
    };
  }

  /**
   * Clear old errors
   */
  clearOldErrors(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
    const initialCount = this.errors.length;
    this.errors = this.errors.filter(error => error.timestamp > cutoffTime);
    return initialCount - this.errors.length;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetrics(errorEntry: any): void {
    this.metrics.totalErrors++;
    this.metrics.lastErrorTime = errorEntry.timestamp;

    // Update component count
    const component = errorEntry.context.component;
    this.metrics.errorsByComponent[component] = (this.metrics.errorsByComponent[component] || 0) + 1;

    // Update severity count
    const severity = errorEntry.severity;
    this.metrics.errorsBySeverity[severity] = (this.metrics.errorsBySeverity[severity] || 0) + 1;

    // Update type count
    const errorType = this.getErrorType(errorEntry.error);
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

    // Update error rate
    this.metrics.errorRate = this.getErrorRate(1);
  }

  private getErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('authentication')) return 'AUTHENTICATION';
    if (message.includes('network') || message.includes('fetch')) return 'NETWORK';
    if (message.includes('cache')) return 'CACHE';
    if (message.includes('circuit')) return 'CIRCUIT_BREAKER';
    if (message.includes('validation')) return 'VALIDATION';
    if (message.includes('timeout')) return 'TIMEOUT';
    
    return 'UNKNOWN';
  }

  private checkForAlerts(errorEntry: any): void {
    const component = errorEntry.context.component;
    const errorType = this.getErrorType(errorEntry.error);
    const alertKey = `${component}_${errorType}`;

    // Check for critical errors
    if (errorEntry.severity === 'critical' || 
        this.CRITICAL_ERROR_TYPES.some(type => errorEntry.error.message.includes(type))) {
      this.createAlert(alertKey, {
        type: 'critical_error',
        severity: 'critical',
        message: `Critical error in ${component}: ${errorEntry.error.message}`,
        component,
        count: 1,
        firstOccurrence: errorEntry.timestamp,
        lastOccurrence: errorEntry.timestamp,
        resolved: false
      });
    }

    // Check for high error rate
    const errorRate = this.getErrorRate(1);
    if (errorRate > this.ERROR_RATE_THRESHOLD) {
      this.createAlert('high_error_rate', {
        type: 'error_rate',
        severity: 'high',
        message: `High error rate detected: ${errorRate.toFixed(2)} errors/minute`,
        component: 'system',
        count: Math.floor(errorRate),
        firstOccurrence: errorEntry.timestamp,
        lastOccurrence: errorEntry.timestamp,
        resolved: false
      });
    }

    // Check for component failure
    const componentErrors = this.getErrorsByComponent(component, 10).length;
    if (componentErrors >= 5) {
      this.createAlert(`component_failure_${component}`, {
        type: 'component_failure',
        severity: 'high',
        message: `Component ${component} has ${componentErrors} recent errors`,
        component,
        count: componentErrors,
        firstOccurrence: errorEntry.timestamp,
        lastOccurrence: errorEntry.timestamp,
        resolved: false
      });
    }
  }

  private createAlert(key: string, alert: Omit<ErrorAlert, 'id'>): void {
    const existingAlert = this.alerts.get(key);
    if (existingAlert && !existingAlert.resolved) {
      existingAlert.count++;
      existingAlert.lastOccurrence = alert.lastOccurrence;
    } else {
      this.alerts.set(key, {
        id: key,
        ...alert
      });
    }
  }

  private logToConsole(errorEntry: any): void {
    const { error, context, severity } = errorEntry;
    const logMessage = `[${severity.toUpperCase()}] ${context.component}: ${error.message}`;
    
    switch (severity) {
      case 'critical':
        console.error('🚨', logMessage, { context, stack: error.stack });
        break;
      case 'high':
        console.error('❌', logMessage, { context });
        break;
      case 'medium':
        console.warn('⚠️', logMessage, { context });
        break;
      case 'low':
        console.info('ℹ️', logMessage, { context });
        break;
    }
  }

  // Store handler references for cleanup
  private handleGlobalError = (event: ErrorEvent) => {
    this.logError(
      new Error(event.error?.message || 'Uncaught error'),
      {
        component: 'global',
        action: 'uncaught_error',
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      'high'
    );
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.logError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      {
        component: 'global',
        action: 'unhandled_rejection',
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      'high'
    );
  };

  /**
   * Initialize global error handlers
   */
  init(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  /**
   * Cleanup global error handlers
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      console.log('✅ ErrorMonitoringService: Cleaned up all resources');
    }
  }
}

// Export singleton instance
export const errorMonitoringService = new ErrorMonitoringService();

// Initialize global error handlers
if (typeof window !== 'undefined') {
  errorMonitoringService.init();
}
