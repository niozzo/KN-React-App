/**
 * Centralized logging utility that respects environment-based log levels
 * Only critical messages should appear in production console
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  timestamp?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * Format log message with timestamp and component
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString();
    const component = entry.component ? `[${entry.component}]` : '';
    return `${timestamp} ${component} ${entry.message}`;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry: LogEntry = {
      level: 'debug',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.debug('🔍', this.formatMessage(entry), data || '');
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry: LogEntry = {
      level: 'info',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.log('ℹ️', this.formatMessage(entry), data || '');
  }

  /**
   * Log warnings (visible in production for important issues)
   */
  warn(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry: LogEntry = {
      level: 'warn',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.warn('⚠️', this.formatMessage(entry), data || '');
  }

  /**
   * Log errors (always visible)
   */
  error(message: string, data?: any, component?: string): void {
    if (!this.shouldLog('error')) return;
    
    const entry: LogEntry = {
      level: 'error',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.error('❌', this.formatMessage(entry), data || '');
  }

  /**
   * Log critical errors (always visible, highest priority)
   */
  critical(message: string, data?: any, component?: string): void {
    const entry: LogEntry = {
      level: 'critical',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.error('🚨', this.formatMessage(entry), data || '');
  }

  /**
   * Log user-facing success messages (always visible)
   */
  success(message: string, data?: any, component?: string): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.log('✅', this.formatMessage(entry), data || '');
  }

  /**
   * Log user-facing progress messages (always visible)
   */
  progress(message: string, data?: any, component?: string): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      data,
      component,
      timestamp: new Date().toISOString()
    };

    console.log('🔄', this.formatMessage(entry), data || '');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
