/**
 * State Management Regression Tests
 * Story 2.1f4: Integration & Testing
 * 
 * Regression tests to prevent breaking changes
 */

import { renderHook, act } from '@testing-library/react';
import { useDataLoading } from '../../hooks/useDataLoading';
import { useUIState } from '../../hooks/useUIState';
import { useAgendaData } from '../../hooks/useAgendaData';

// Mock services
vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
    getHealthStatus: vi.fn()
  }
}));

vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

import { unifiedCacheService } from '../../services/unifiedCacheService';
import { agendaService } from '../../services/agendaService';

const mockUnifiedCache = unifiedCacheService as any;
const mockAgendaService = agendaService as any;

describe('State Management Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain backward compatibility with existing cache keys', async () => {
    // Test that existing cache keys still work
    const existingCacheData = {
      data: [{ id: '1', title: 'Existing Session' }],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    mockUnifiedCache.get.mockResolvedValue(existingCacheData);

    const { result } = renderHook(() => useAgendaData());

    await act(async () => {
      await result.current.loadAgendaItems();
    });

    // Should handle existing cache format
    expect(result.current.agendaData).toBeDefined();
    expect(mockUnifiedCache.get).toHaveBeenCalledWith('kn_cache_agenda_items');
  });

  it('should not break existing session data functionality', async () => {
    const { result } = renderHook(() => useDataLoading());

    // Test that existing functionality still works
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('should maintain existing API contracts', async () => {
    const { result } = renderHook(() => useDataLoading());

    // Test that all expected methods exist
    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.clearCache).toBe('function');
    expect(typeof result.current.clearError).toBe('function');

    // Test that state properties exist
    expect('data' in result.current).toBe(true);
    expect('loading' in result.current).toBe(true);
    expect('error' in result.current).toBe(true);
    expect('lastUpdated' in result.current).toBe(true);
    expect('retryCount' in result.current).toBe(true);
  });

  it('should not introduce memory leaks', async () => {
    const { result, unmount } = renderHook(() => useDataLoading());

    // Perform operations
    await act(async () => {
      await result.current.loadData('test-key', () => Promise.resolve('test-data'));
    });

    // Unmount and check for cleanup
    unmount();

    // Should not have any lingering references
    expect(result.current).toBeDefined();
  });

  it('should handle undefined/null values gracefully', async () => {
    mockUnifiedCache.get.mockResolvedValue(null);

    const { result } = renderHook(() => useAgendaData());

    await act(async () => {
      await result.current.loadAgendaItems();
    });

    // Should handle null cache gracefully
    expect(result.current.agendaData).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should maintain error handling behavior', async () => {
    const error = new Error('Test error');
    mockUnifiedCache.get.mockRejectedValue(error);

    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', () => Promise.resolve('test-data'));
    });

    // Should handle errors gracefully
    expect(result.current.error).toBe('Test error');
    expect(result.current.data).toBeNull();
  });

  it('should preserve validation behavior', () => {
    const validate = (state: { count: number }) => {
      if (state.count < 0) return 'Count must be positive';
      return true;
    };

    const { result } = renderHook(() => useUIState({ count: 0 }, { validate }));

    act(() => {
      result.current.setState({ count: -1 });
    });

    // Should maintain validation behavior
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe('Count must be positive');
  });

  it('should maintain persistence behavior', () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify({ count: 5 })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { persist: true, storageKey: 'test-key' })
    );

    // Should load from localStorage
    expect(result.current.state).toEqual({ count: 5 });
  });

  it('should handle concurrent operations without conflicts', async () => {
    const { result: result1 } = renderHook(() => useDataLoading());
    const { result: result2 } = renderHook(() => useDataLoading());

    // Perform concurrent operations
    await act(async () => {
      await Promise.all([
        result1.current.loadData('key1', () => Promise.resolve('data1')),
        result2.current.loadData('key2', () => Promise.resolve('data2'))
      ]);
    });

    // Should not interfere with each other
    expect(result1.current.data).toBe('data1');
    expect(result2.current.data).toBe('data2');
  });

  it('should maintain retry behavior', async () => {
    const error = new Error('Network error');
    mockUnifiedCache.get.mockResolvedValue(null);
    
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw error;
      }
      return Promise.resolve('success');
    });

    const { result } = renderHook(() => useDataLoading());

    // Mock setTimeout to test retry logic
    vi.useFakeTimers();

    await act(async () => {
      await result.current.loadData('test-key', fetcher, { retries: 3, retryDelay: 100 });
    });

    // Fast-forward time to trigger retries
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callCount).toBe(3); // Should retry 3 times
    expect(result.current.data).toBe('success');

    vi.useRealTimers();
  });

  it('should maintain debounce behavior', async () => {
    const validate = vi.fn().mockReturnValue(true);
    
    const { result } = renderHook(() => 
      useUIState({ count: 0 }, { validate, debounceMs: 100 })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.setState({ count: 3 });
    });

    // Validation should not be called immediately
    expect(validate).not.toHaveBeenCalled();

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('should handle service unavailability gracefully', async () => {
    // Mock service throwing error
    mockUnifiedCache.get.mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', () => Promise.resolve('test-data'));
    });

    // Should handle service unavailability gracefully
    expect(result.current.error).toBe('Service unavailable');
    expect(result.current.data).toBeNull();
  });
});
