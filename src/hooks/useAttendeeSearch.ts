/**
 * Attendee Search Hook
 * Story 3.1: Attendee Search & Discovery
 * 
 * React hook for attendee search functionality with debouncing,
 * caching, and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendeeSearchService, SearchFilters, SearchResult } from '../services/attendeeSearchService';
import { Attendee } from '../types/database';

export interface UseAttendeeSearchOptions {
  debounceDelay?: number;
  enableCaching?: boolean;
  initialFilters?: Partial<SearchFilters>;
}

export interface UseAttendeeSearchReturn {
  // Search state
  searchResults: Attendee[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  searchTime: number;
  isCached: boolean;
  
  // Search controls
  searchQuery: string;
  filters: SearchFilters;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  
  // Search actions
  performSearch: () => Promise<void>;
  refreshSearch: () => Promise<void>;
  
  // Filter helpers
  toggleSharedEventsFilter: () => void;
  setSortBy: (sortBy: 'last_name' | 'first_name' | 'company') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // Utility
  hasActiveFilters: boolean;
  hasResults: boolean;
}

export const useAttendeeSearch = (options: UseAttendeeSearchOptions = {}): UseAttendeeSearchReturn => {
  const {
    debounceDelay = 300,
    enableCaching = true,
    initialFilters = {}
  } = options;

  // Search state
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [isCached, setIsCached] = useState(false);

  // Search controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    showSharedEventsOnly: false,
    sortBy: 'last_name',
    sortOrder: 'asc',
    includeSponsors: false,
    ...initialFilters
  });

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() && !hasActiveFilters) {
      setSearchResults([]);
      setTotalCount(0);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await performSearch();
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, debounceDelay]);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() && !hasActiveFilters) {
      setSearchResults([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first if enabled
      if (enableCaching) {
        const cachedResults = attendeeSearchService.getCachedResults(filters);
        if (cachedResults) {
          setSearchResults(cachedResults);
          setTotalCount(cachedResults.length);
          setIsCached(true);
          setIsLoading(false);
          return;
        }
      }

      // Perform search
      const currentFilters = { ...filters, query: searchQuery };
      const result = await attendeeSearchService.searchAttendees(currentFilters);
      
      setSearchResults(result.attendees);
      setTotalCount(result.totalCount);
      setSearchTime(result.searchTime);
      setIsCached(result.cached);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('❌ Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, enableCaching]);

  // Refresh search
  const refreshSearch = useCallback(async () => {
    // Clear cache and search again
    attendeeSearchService.clearCache();
    await performSearch();
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters({
      query: '',
      showSharedEventsOnly: false,
      sortBy: 'last_name',
      sortOrder: 'asc',
      includeSponsors: false
    });
    setSearchResults([]);
    setTotalCount(0);
    setError(null);
  }, []);

  // Filter helpers
  const toggleSharedEventsFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showSharedEventsOnly: !prev.showSharedEventsOnly
    }));
  }, []);

  const setSortBy = useCallback((sortBy: 'last_name' | 'first_name' | 'company') => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortOrder: order }));
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || 
           filters.showSharedEventsOnly || 
           filters.company || 
           filters.role ||
           filters.includeSponsors;
  }, [searchQuery, filters]);

  const hasResults = useMemo(() => {
    return searchResults.length > 0;
  }, [searchResults.length]);

  return {
    // Search state
    searchResults,
    totalCount,
    isLoading,
    error,
    searchTime,
    isCached,
    
    // Search controls
    searchQuery,
    filters,
    setSearchQuery,
    setFilters: updateFilters,
    clearSearch,
    
    // Search actions
    performSearch,
    refreshSearch,
    
    // Filter helpers
    toggleSharedEventsFilter,
    setSortBy,
    setSortOrder,
    
    // Utility
    hasActiveFilters,
    hasResults
  };
};
