/**
 * Cache Error Boundary Component Tests
 * 
 * Tests for error boundary functionality and graceful error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CacheErrorBoundary, withCacheErrorBoundary } from '../../components/CacheErrorBoundary';

// Mock the cache monitoring service
vi.mock('../../services/cacheMonitoringService', () => ({
  cacheMonitoringService: {
    logCacheCorruption: vi.fn()
  }
}));

// Component that throws an error for testing
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws async error
const AsyncThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => {
        throw new Error('Async test error');
      }, 100);
    }
  }, [shouldThrow]);

  return <div>Async component</div>;
};

describe('CacheErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: vi.fn(),
        getItem: vi.fn(),
        setItem: vi.fn()
      },
      writable: true
    });
  });

  describe('Error Catching', () => {
    it('should catch errors and display fallback UI', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      expect(screen.getByText('Data Loading Issue')).toBeInTheDocument();
      expect(screen.getByText(/There was a problem loading your schedule data/)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Cache Error Boundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should render children when no error occurs', () => {
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </CacheErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Data Loading Issue')).not.toBeInTheDocument();
    });

    it('should call custom error handler when provided', () => {
      const onError = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <CacheErrorBoundary onError={onError}>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Retry Functionality', () => {
    it('should retry when retry button is clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      expect(screen.getByText('Data Loading Issue')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(screen.getByText('Retrying...')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should respect max retry limit', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CacheErrorBoundary maxRetries={1}>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      // First retry
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // After first retry, should show "Retrying..." and be disabled
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      // Button should be disabled
      const disabledButton = screen.getByText('Retrying...');
      expect(disabledButton).toBeDisabled();

      consoleSpy.mockRestore();
    });

    it('should clear cache on retry', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const localStorageSpy = vi.spyOn(window.localStorage, 'removeItem');
      
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(localStorageSpy).toHaveBeenCalledWith('kn_cache_agenda_items');
      expect(localStorageSpy).toHaveBeenCalledWith('kn_cache_sessions');
      expect(localStorageSpy).toHaveBeenCalledWith('kn_cache_attendees');
      expect(localStorageSpy).toHaveBeenCalledWith('kn_cached_sessions');

      consoleSpy.mockRestore();
    });
  });

  describe('Reload Functionality', () => {
    it('should reload page when reload button is clicked', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock window.location.reload by replacing the entire location object
      const originalLocation = window.location;
      const mockReload = vi.fn();
      
      // @ts-ignore
      delete window.location;
      window.location = { ...originalLocation, reload: mockReload };
      
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();

      // Restore original location
      window.location = originalLocation;
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom Error UI</div>;
      
      render(
        <CacheErrorBoundary fallback={customFallback}>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByText('Data Loading Issue')).not.toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('should show error details when available', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CacheErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      const detailsButton = screen.getByText('Technical Details');
      fireEvent.click(detailsButton);

      expect(screen.getByText('Test error')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <CacheErrorBoundary retryDelay={1000}>
          <ThrowingComponent shouldThrow={true} />
        </CacheErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});

describe('withCacheErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withCacheErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass through props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
    const WrappedComponent = withCacheErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Wrapped component error');
      }
      return <div>No error</div>;
    };
    
    const WrappedComponent = withCacheErrorBoundary(TestComponent);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Data Loading Issue')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
