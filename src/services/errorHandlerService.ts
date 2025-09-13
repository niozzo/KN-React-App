/**
 * Error Handler Service
 * Story 1.2: Database Integration & Data Access Layer Setup
 * 
 * Centralized error handling, validation, and logging
 */

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  timestamp: string;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export interface ServiceError {
  code: string;
  message: string;
  context: ErrorContext;
  validationErrors?: ValidationError[];
  originalError?: Error;
  retryable: boolean;
  userMessage: string;
}

export class ErrorHandlerService {
  private readonly ERROR_CODES = {
    // Database errors
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_QUERY_FAILED: 'DB_QUERY_FAILED',
    DB_TIMEOUT: 'DB_TIMEOUT',
    DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
    
    // Authentication errors
    AUTH_INVALID_ACCESS_CODE: 'AUTH_INVALID_ACCESS_CODE',
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    
    // Validation errors
    VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    VALIDATION_INVALID_RANGE: 'VALIDATION_INVALID_RANGE',
    VALIDATION_DUPLICATE_VALUE: 'VALIDATION_DUPLICATE_VALUE',
    
    // Network errors
    NETWORK_OFFLINE: 'NETWORK_OFFLINE',
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
    NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
    
    // PWA errors
    PWA_CACHE_FULL: 'PWA_CACHE_FULL',
    PWA_SYNC_FAILED: 'PWA_SYNC_FAILED',
    PWA_OFFLINE_DATA_UNAVAILABLE: 'PWA_OFFLINE_DATA_UNAVAILABLE',
    
    // General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  };

  private readonly USER_MESSAGES = {
    [this.ERROR_CODES.DB_CONNECTION_FAILED]: 'Unable to connect to the database. Please try again later.',
    [this.ERROR_CODES.DB_QUERY_FAILED]: 'Database query failed. Please try again.',
    [this.ERROR_CODES.DB_TIMEOUT]: 'Database request timed out. Please try again.',
    [this.ERROR_CODES.DB_CONSTRAINT_VIOLATION]: 'Data validation failed. Please check your input.',
    
    [this.ERROR_CODES.AUTH_INVALID_ACCESS_CODE]: 'Invalid access code. Please check your code and try again.',
    [this.ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
    [this.ERROR_CODES.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action.',
    
    [this.ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
    [this.ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format. Please check your input.',
    [this.ERROR_CODES.VALIDATION_INVALID_RANGE]: 'Value is out of acceptable range.',
    [this.ERROR_CODES.VALIDATION_DUPLICATE_VALUE]: 'This value already exists.',
    
    [this.ERROR_CODES.NETWORK_OFFLINE]: 'You are offline. Some features may not be available.',
    [this.ERROR_CODES.NETWORK_TIMEOUT]: 'Request timed out. Please check your connection.',
    [this.ERROR_CODES.NETWORK_SERVER_ERROR]: 'Server error. Please try again later.',
    
    [this.ERROR_CODES.PWA_CACHE_FULL]: 'Storage is full. Some data may not be available offline.',
    [this.ERROR_CODES.PWA_SYNC_FAILED]: 'Data synchronization failed. Please try again.',
    [this.ERROR_CODES.PWA_OFFLINE_DATA_UNAVAILABLE]: 'Data not available offline. Please connect to the internet.',
    
    [this.ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    [this.ERROR_CODES.INTERNAL_ERROR]: 'Internal error. Please contact support if this persists.'
  };

  /**
   * Create a standardized service error
   */
  createServiceError(
    code: string,
    message: string,
    context: ErrorContext,
    originalError?: Error,
    validationErrors?: ValidationError[]
  ): ServiceError {
    return {
      code,
      message,
      context,
      validationErrors,
      originalError,
      retryable: this.isRetryableError(code),
      userMessage: this.USER_MESSAGES[code] || this.USER_MESSAGES[this.ERROR_CODES.UNKNOWN_ERROR]
    };
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any, context: ErrorContext): ServiceError {
    console.error(`❌ Database error in ${context.service}.${context.operation}:`, error);

    if (error.code) {
      switch (error.code) {
        case 'PGRST301':
          return this.createServiceError(
            this.ERROR_CODES.DB_CONNECTION_FAILED,
            'Database connection failed',
            context,
            error
          );
        case 'PGRST116':
          return this.createServiceError(
            this.ERROR_CODES.DB_QUERY_FAILED,
            'Database query failed',
            context,
            error
          );
        case '23505': // Unique constraint violation
          return this.createServiceError(
            this.ERROR_CODES.DB_CONSTRAINT_VIOLATION,
            'Duplicate value found',
            context,
            error
          );
        case '23503': // Foreign key constraint violation
          return this.createServiceError(
            this.ERROR_CODES.DB_CONSTRAINT_VIOLATION,
            'Referenced record not found',
            context,
            error
          );
        default:
          return this.createServiceError(
            this.ERROR_CODES.DB_QUERY_FAILED,
            error.message || 'Database operation failed',
            context,
            error
          );
      }
    }

    if (error.message) {
      if (error.message.includes('timeout')) {
        return this.createServiceError(
          this.ERROR_CODES.DB_TIMEOUT,
          'Database request timed out',
          context,
          error
        );
      }
    }

    return this.createServiceError(
      this.ERROR_CODES.DB_QUERY_FAILED,
      error.message || 'Database operation failed',
      context,
      error
    );
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any, context: ErrorContext): ServiceError {
    console.error(`❌ Auth error in ${context.service}.${context.operation}:`, error);

    if (error.message?.includes('Access code not found')) {
      return this.createServiceError(
        this.ERROR_CODES.AUTH_INVALID_ACCESS_CODE,
        'Invalid access code',
        context,
        error
      );
    }

    if (error.message?.includes('session expired')) {
      return this.createServiceError(
        this.ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session expired',
        context,
        error
      );
    }

    return this.createServiceError(
      this.ERROR_CODES.AUTH_UNAUTHORIZED,
      error.message || 'Authentication failed',
      context,
      error
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    validationErrors: ValidationError[],
    context: ErrorContext
  ): ServiceError {
    console.error(`❌ Validation error in ${context.service}.${context.operation}:`, validationErrors);

    return this.createServiceError(
      this.ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      'Validation failed',
      context,
      undefined,
      validationErrors
    );
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any, context: ErrorContext): ServiceError {
    console.error(`❌ Network error in ${context.service}.${context.operation}:`, error);

    if (!navigator.onLine) {
      return this.createServiceError(
        this.ERROR_CODES.NETWORK_OFFLINE,
        'Network is offline',
        context,
        error
      );
    }

    if (error.name === 'TimeoutError') {
      return this.createServiceError(
        this.ERROR_CODES.NETWORK_TIMEOUT,
        'Request timed out',
        context,
        error
      );
    }

    if (error.status >= 500) {
      return this.createServiceError(
        this.ERROR_CODES.NETWORK_SERVER_ERROR,
        'Server error',
        context,
        error
      );
    }

    return this.createServiceError(
      this.ERROR_CODES.NETWORK_SERVER_ERROR,
      error.message || 'Network error',
      context,
      error
    );
  }

  /**
   * Handle PWA errors
   */
  handlePWAError(error: any, context: ErrorContext): ServiceError {
    console.error(`❌ PWA error in ${context.service}.${context.operation}:`, error);

    if (error.message?.includes('QuotaExceededError')) {
      return this.createServiceError(
        this.ERROR_CODES.PWA_CACHE_FULL,
        'Storage quota exceeded',
        context,
        error
      );
    }

    if (error.message?.includes('sync failed')) {
      return this.createServiceError(
        this.ERROR_CODES.PWA_SYNC_FAILED,
        'Data synchronization failed',
        context,
        error
      );
    }

    return this.createServiceError(
      this.ERROR_CODES.PWA_SYNC_FAILED,
      error.message || 'PWA operation failed',
      context,
      error
    );
  }

  /**
   * Validate access code format
   */
  validateAccessCode(accessCode: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!accessCode) {
      errors.push({
        field: 'accessCode',
        message: 'Access code is required',
        value: accessCode,
        rule: 'required'
      });
    } else if (!/^\d{6}$/.test(accessCode)) {
      errors.push({
        field: 'accessCode',
        message: 'Access code must be 6 digits',
        value: accessCode,
        rule: 'format'
      });
    }

    return errors;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        value: email,
        rule: 'required'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        value: email,
        rule: 'format'
      });
    }

    return errors;
  }

  /**
   * Validate required string field
   */
  validateRequiredString(value: string, fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!value || value.trim().length === 0) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value,
        rule: 'required'
      });
    }

    return errors;
  }

  /**
   * Validate numeric range
   */
  validateNumericRange(
    value: number,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (min !== undefined && value < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        value,
        rule: 'min'
      });
    }

    if (max !== undefined && value > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        value,
        rule: 'max'
      });
    }

    return errors;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(code: string): boolean {
    const retryableCodes = [
      this.ERROR_CODES.DB_CONNECTION_FAILED,
      this.ERROR_CODES.DB_TIMEOUT,
      this.ERROR_CODES.NETWORK_TIMEOUT,
      this.ERROR_CODES.NETWORK_SERVER_ERROR,
      this.ERROR_CODES.PWA_SYNC_FAILED
    ];

    return retryableCodes.includes(code);
  }

  /**
   * Log error for monitoring
   */
  logError(error: ServiceError): void {
    const logData = {
      code: error.code,
      message: error.message,
      context: error.context,
      retryable: error.retryable,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, this would send to a logging service
    console.error('🚨 Service Error:', logData);

    // Store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('kn_error_log') || '[]');
      errorLog.push(logData);
      
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      localStorage.setItem('kn_error_log', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): any[] {
    try {
      return JSON.parse(localStorage.getItem('kn_error_log') || '[]');
    } catch (e) {
      console.error('Failed to get error log:', e);
      return [];
    }
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    localStorage.removeItem('kn_error_log');
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: ServiceError): string {
    return error.userMessage;
  }

  /**
   * Check if error should be shown to user
   */
  shouldShowToUser(error: ServiceError): boolean {
    // Don't show internal errors to users
    const internalErrors = [
      this.ERROR_CODES.INTERNAL_ERROR,
      this.ERROR_CODES.UNKNOWN_ERROR
    ];

    return !internalErrors.includes(error.code);
  }
}

// Export singleton instance
export const errorHandlerService = new ErrorHandlerService();
