/**
 * Search Results Component
 * Story 3.1: Attendee Search & Discovery
 * 
 * Displays search results with metadata and performance indicators
 */

import React from 'react';
import { Attendee } from '../../types/database';

interface SearchResultsProps {
  results: Attendee[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  searchTime: number;
  isCached: boolean;
  hasResults: boolean;
  onAttendeeSelect?: (attendee: Attendee) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalCount,
  isLoading,
  error,
  searchTime,
  isCached,
  hasResults,
  onAttendeeSelect
}) => {
  // Format search time
  const formatSearchTime = (time: number): string => {
    if (time < 1) return '< 1ms';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  // Format count
  const formatCount = (count: number): string => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 person found';
    return `${count.toLocaleString()} people found`;
  };

  if (error) {
    return (
      <div className="search-results">
        <div className="error-message">
          <strong>Search Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="search-results">
        <div className="results-header">
          <div className="results-count">Searching...</div>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="search-results">
        <div className="results-header">
          <div className="results-count">No results found</div>
        </div>
        <div style={{ 
          padding: 'var(--space-lg)', 
          textAlign: 'center', 
          color: 'var(--gray-500)',
          fontSize: '14px'
        }}>
          Try adjusting your search terms or filters
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <div className="results-count">
          {formatCount(totalCount)}
        </div>
        <div className="results-meta">
          {isCached && (
            <span className="cache-indicator">
              Cached
            </span>
          )}
          <span>Search time: {formatSearchTime(searchTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
