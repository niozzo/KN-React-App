import { useState, useMemo, useCallback } from 'react';

/**
 * useSort Hook
 * Manages sorting functionality for lists
 */
export const useSort = (items = [], defaultSortField = 'lastname') => {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState('asc');

  const sortedItems = useMemo(() => {
    if (!items.length) return items;

    return [...items].sort((a, b) => {
      let aValue, bValue;

      // Handle nested properties
      if (sortField.includes('.')) {
        const fields = sortField.split('.');
        aValue = fields.reduce((obj, field) => obj?.[field], a);
        bValue = fields.reduce((obj, field) => obj?.[field], b);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  const handleSortChange = useCallback((field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const getSortOptions = useCallback(() => [
    { value: 'lastname', label: 'Sort by Last Name' },
    { value: 'firstname', label: 'Sort by First Name' },
    { value: 'company', label: 'Sort by Company Name' },
    { value: 'title', label: 'Sort by Title' }
  ], []);

  return {
    sortField,
    sortDirection,
    sortedItems,
    handleSortChange,
    getSortOptions
  };
};
