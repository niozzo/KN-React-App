import { useState, useMemo, useCallback } from 'react';

/**
 * useSearch Hook
 * Manages search functionality and filtering
 */
export const useSearch = (items = [], searchFields = ['name', 'title', 'company']) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSharedEventsOnly, setShowSharedEventsOnly] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          return value && value.toLowerCase().includes(term);
        })
      );
    }

    // Apply shared events filter
    if (showSharedEventsOnly) {
      filtered = filtered.filter(item => 
        item.sharedEvents && item.sharedEvents.length > 0
      );
    }

    return filtered;
  }, [items, searchTerm, showSharedEventsOnly, searchFields]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSharedEventsFilterChange = useCallback((checked) => {
    setShowSharedEventsOnly(checked);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowSharedEventsOnly(false);
  }, []);

  return {
    searchTerm,
    showSharedEventsOnly,
    filteredItems,
    handleSearchChange,
    handleSharedEventsFilterChange,
    clearSearch,
    hasActiveFilters: searchTerm.trim() || showSharedEventsOnly
  };
};
