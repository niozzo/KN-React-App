/**
 * Tests for useDataLoading Hook
 * Story 2.1f2: Data Loading Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useDataLoading } from '../../hooks/useDataLoading';
import { unifiedCacheService } from '../../services/unifiedCacheService';

// Mock the unified cache service
jest.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
}));

const mockUnifiedCache = unifiedCacheService as jest.Mocked<typeof unifiedCacheService>;

describe('useDataLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDataLoading());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('should load data from cache when available', async () => {
    const mockData = { id: '1', title: 'Test' };
    mockUnifiedCache.get.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', () => Promise.resolve(mockData));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUnifiedCache.get).toHaveBeenCalledWith('test-key');
  });

  it('should fetch from source when cache is empty', async () => {
    const mockData = { id: '1', title: 'Test' };
    mockUnifiedCache.get.mockResolvedValue(null);
    mockUnifiedCache.set.mockResolvedValue();

    const fetcher = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', fetcher);
    });

    expect(fetcher).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
    expect(mockUnifiedCache.set).toHaveBeenCalledWith('test-key', mockData, 5 * 60 * 1000);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Network error');
    mockUnifiedCache.get.mockResolvedValue(null);

    const fetcher = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', fetcher);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.retryCount).toBe(1);
  });

  it('should retry on failure with exponential backoff', async () => {
    const error = new Error('Network error');
    mockUnifiedCache.get.mockResolvedValue(null);

    const fetcher = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useDataLoading());

    // Mock setTimeout to test retry logic
    jest.useFakeTimers();

    await act(async () => {
      await result.current.loadData('test-key', fetcher, { retries: 2, retryDelay: 1000 });
    });

    expect(result.current.retryCount).toBe(1);

    // Fast-forward time to trigger retry
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetcher).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should refresh data by bypassing cache', async () => {
    const mockData = { id: '1', title: 'Test' };
    mockUnifiedCache.get.mockResolvedValue(null);
    mockUnifiedCache.set.mockResolvedValue();

    const fetcher = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.refresh('test-key', fetcher);
    });

    expect(fetcher).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
    // Should not call get from cache when refreshing
    expect(mockUnifiedCache.get).not.toHaveBeenCalled();
  });

  it('should clear cache', async () => {
    mockUnifiedCache.remove.mockResolvedValue();
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.clearCache('test-key');
    });

    expect(mockUnifiedCache.remove).toHaveBeenCalledWith('test-key');
    expect(result.current.data).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useDataLoading());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('should use custom options', async () => {
    const mockData = { id: '1', title: 'Test' };
    mockUnifiedCache.get.mockResolvedValue(null);
    mockUnifiedCache.set.mockResolvedValue();

    const fetcher = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData('test-key', fetcher, {
        ttl: 10 * 60 * 1000,
        retries: 5,
        retryDelay: 2000
      });
    });

    expect(mockUnifiedCache.set).toHaveBeenCalledWith('test-key', mockData, 10 * 60 * 1000);
  });
});
