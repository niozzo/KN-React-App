/**
 * Data Loading Hook
 * Story 2.1f2: Data Loading Hook
 * 
 * Reusable hook for data loading with caching, error handling, and retry logic
 */

import { useState, useCallback, useMemo } from 'react';
import { unifiedCacheService } from '../services/unifiedCacheService';

export interface LoadOptions {
  useCache?: boolean;
  cache?: boolean;
  ttl?: number;
  retries?: number;
  retryDelay?: number;
}

export interface DataLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  retryCount: number;
}

export const useDataLoading = <T>() => {
  const [state, setState] = useState<DataLoadingState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0
  });

  const unifiedCache = useMemo(() => unifiedCacheService, []);

  const loadData = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    options: LoadOptions = {}
  ): Promise<T | null> => {
    const {
      useCache = true,
      cache = true,
      ttl = 5 * 60 * 1000, // 5 minutes default
      retries = 3,
      retryDelay = 1000
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Try cache first
      if (useCache) {
        const cached = await unifiedCache.get<T>(key);
        if (cached) {
          setState(prev => ({
            ...prev,
            data: cached,
            loading: false,
            lastUpdated: new Date(),
            retryCount: 0
          }));
          return cached;
        }
      }

      // Fetch from source
      const data = await fetcher();
      
      // Cache the result
      if (cache) {
        await unifiedCache.set(key, data, ttl);
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        lastUpdated: new Date(),
        retryCount: 0
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newRetryCount = state.retryCount + 1;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: newRetryCount
      }));

      // Retry logic
      if (newRetryCount < retries) {
        setTimeout(() => {
          loadData(key, fetcher, options);
        }, retryDelay * Math.pow(2, newRetryCount)); // Exponential backoff
      }

      return null;
    }
  }, [unifiedCache, state.retryCount]);

  const refresh = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    options: LoadOptions = {}
  ): Promise<T | null> => {
    // Force refresh by bypassing cache
    return loadData(key, fetcher, { ...options, useCache: false });
  }, [loadData]);

  const clearCache = useCallback(async (key: string) => {
    try {
      await unifiedCache.remove(key);
      setState(prev => ({ ...prev, data: null, lastUpdated: null }));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, [unifiedCache]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, retryCount: 0 }));
  }, []);

  return {
    ...state,
    loadData,
    refresh,
    clearCache,
    clearError
  };
};
