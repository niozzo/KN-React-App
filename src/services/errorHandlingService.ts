/**
 * Error Handling Service
 * Centralized error handling and recovery patterns
 * Story 2.1f: Enhanced Error Handling
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorRecoveryOptions {
  retryCount?: number;
  retryDelay?: number;
  maxRetries?: number;
  fallbackAction?: () => void;
  shouldRetry?: (error: Error) => boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: Error[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle cache-related errors
   */
  static handleCacheError(error: Error, context: ErrorContext = {}): void {
    console.error(`Cache error in ${context.component || 'unknown'}:`, error);
    
    // Log to monitoring service
    ErrorHandlingService.getInstance().logError(error, {
      ...context,
      category: 'cache',
      action: context.action || 'cache_operation'
    });

    // Attempt recovery
    ErrorHandlingService.getInstance().attemptCacheRecovery(error, context);
  }

  /**
   * Handle network-related errors
   */
  static handleNetworkError(error: Error, context: ErrorContext = {}): void {
    console.error(`Network error in ${context.component || 'unknown'}:`, error);
    
    // Log to monitoring service
    ErrorHandlingService.getInstance().logError(error, {
      ...context,
      category: 'network',
      action: context.action || 'network_request'
    });

    // Show offline indicator
    ErrorHandlingService.getInstance().showOfflineIndicator();
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: Error, context: ErrorContext = {}): void {
    console.error(`Validation error in ${context.component || 'unknown'}:`, error);
    
    // Log to monitoring service
    ErrorHandlingService.getInstance().logError(error, {
      ...context,
      category: 'validation',
      action: context.action || 'validation_check'
    });

    // Show user-friendly error message
    ErrorHandlingService.getInstance().showUserError('Please check your input and try again.');
  }

  /**
   * Handle service errors with retry logic
   */
  static async handleServiceError(
    error: Error, 
    context: ErrorContext = {},
    options: ErrorRecoveryOptions = {}
  ): Promise<void> {
    const {
      retryCount = 0,
      retryDelay = 1000,
      maxRetries = 3,
      fallbackAction,
      shouldRetry = () => true
    } = options;

    console.error(`Service error in ${context.component || 'unknown'}:`, error);
    
    // Log to monitoring service
    ErrorHandlingService.getInstance().logError(error, {
      ...context,
      category: 'service',
      action: context.action || 'service_call',
      retryCount
    });

    // Check if we should retry
    if (retryCount < maxRetries && shouldRetry(error)) {
      console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Retry with exponential backoff
      return ErrorHandlingService.handleServiceError(error, context, {
        ...options,
        retryCount: retryCount + 1,
        retryDelay: retryDelay * 2
      });
    }

    // All retries failed, use fallback
    if (fallbackAction) {
      console.log('Using fallback action after all retries failed');
      fallbackAction();
    } else {
      ErrorHandlingService.getInstance().showUserError('Service temporarily unavailable. Please try again later.');
    }
  }

  /**
   * Log error to monitoring service
   */
  private logError(error: Error, context: ErrorContext): void {
    // Add to local log
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // TODO: Send to external monitoring service
    // errorReportingService.captureException(error, {
    //   extra: context,
    //   tags: {
    //     component: context.component,
    //     action: context.action,
    //     category: context.metadata?.category
    //   }
    // });

    console.log('Error logged:', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  /**
   * Attempt cache recovery
   */
  private attemptCacheRecovery(error: Error, context: ErrorContext): void {
    try {
      // Clear corrupted cache
      if (error.message.includes('cache') || error.message.includes('storage')) {
        localStorage.clear();
        console.log('Cache cleared due to corruption');
      }
    } catch (recoveryError) {
      console.error('Cache recovery failed:', recoveryError);
    }
  }

  /**
   * Show offline indicator
   */
  private showOfflineIndicator(): void {
    // TODO: Implement offline indicator UI
    console.log('Showing offline indicator');
  }

  /**
   * Show user-friendly error message
   */
  private showUserError(message: string): void {
    // TODO: Implement user error notification UI
    console.log('User error:', message);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: Error[];
    errorCategories: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    
    this.errorLog.forEach(error => {
      const category = this.categorizeError(error);
      categories[category] = (categories[category] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      recentErrors: this.errorLog.slice(-10),
      errorCategories: categories
    };
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: Error): string {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('cache') || error.message.includes('storage')) {
      return 'cache';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    if (error.message.includes('service') || error.message.includes('api')) {
      return 'service';
    }
    return 'unknown';
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
