/**
 * Cache Error Boundary Component
 * 
 * Provides graceful error handling for cache-related failures
 * and prevents UI crashes from cache issues.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cacheMonitoringService } from '../services/cacheMonitoringService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryDelay?: number;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class CacheErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 Cache Error Boundary caught an error:', error, errorInfo);
    
    // Log to monitoring service
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Log to monitoring service
      cacheMonitoringService.logCacheCorruption(
        'cache_error_boundary',
        `Error: ${error.message} | Component: ${errorInfo.componentStack}`
      );
    } catch (logError) {
      console.warn('⚠️ Failed to log error to monitoring service:', logError);
    }
  }

  private handleRetry = () => {
    const { retryDelay = 1000, maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('⚠️ Maximum retry attempts reached');
      return;
    }

    this.setState({ isRetrying: true });

    // Clear cache to force fresh data load
    this.clearCache();

    // Retry after delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, retryDelay);
  };

  private clearCache = () => {
    try {
      // Clear relevant cache entries
      const cacheKeys = [
        'kn_cache_agenda_items',
        'kn_cache_sessions',
        'kn_cache_attendees',
        'kn_cached_sessions'
      ];

      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Cache cleared due to error boundary activation');
    } catch (error) {
      console.warn('⚠️ Failed to clear cache:', error);
    }
  };

  private handleReload = () => {
    // Force page reload as last resort
    window.location.reload();
  };

  render() {
    const { hasError, error, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="cache-error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Data Loading Issue</h2>
            <p>
              There was a problem loading your schedule data. This might be due to:
            </p>
            <ul>
              <li>Network connectivity issues</li>
              <li>Outdated cached data</li>
              <li>Temporary server problems</li>
            </ul>
            
            {error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{error.message}</pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={this.handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
              
              <button 
                className="reload-button"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            <div className="error-help">
              <p>
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>

          <style jsx>{`
            .cache-error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              margin: 1rem;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
            }

            .error-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }

            .error-content h2 {
              color: #dc3545;
              margin-bottom: 1rem;
            }

            .error-content p {
              color: #6c757d;
              margin-bottom: 1rem;
            }

            .error-content ul {
              text-align: left;
              color: #6c757d;
              margin-bottom: 2rem;
            }

            .error-details {
              text-align: left;
              margin: 1rem 0;
              padding: 1rem;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e9ecef;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }

            .error-details pre {
              font-size: 0.875rem;
              color: #dc3545;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin: 2rem 0;
            }

            .retry-button,
            .reload-button {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              transition: background-color 0.2s;
            }

            .retry-button {
              background: #007bff;
              color: white;
            }

            .retry-button:hover:not(:disabled) {
              background: #0056b3;
            }

            .retry-button:disabled {
              background: #6c757d;
              cursor: not-allowed;
            }

            .reload-button {
              background: #6c757d;
              color: white;
            }

            .reload-button:hover {
              background: #545b62;
            }

            .error-help {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #e9ecef;
            }

            .error-help p {
              font-size: 0.875rem;
              color: #6c757d;
            }
          `}</style>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export function withCacheErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <CacheErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </CacheErrorBoundary>
    );
  };
}

export default CacheErrorBoundary;
