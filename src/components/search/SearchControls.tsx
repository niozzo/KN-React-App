/**
 * Search Controls Component
 * Story 3.1: Attendee Search & Discovery
 * 
 * Search input, filters, and sorting controls
 */

import React from 'react';
import { SearchFilters } from '../../services/attendeeSearchService';

interface SearchControlsProps {
  searchQuery: string;
  filters: SearchFilters;
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  onClearSearch: () => void;
  isLoading: boolean;
  hasActiveFilters: boolean;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  searchQuery,
  filters,
  onSearchChange,
  onFilterChange,
  onClearSearch,
  isLoading,
  hasActiveFilters
}) => {
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSharedEventsToggle = () => {
    onFilterChange({
      showSharedEventsOnly: !filters.showSharedEventsOnly
    });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      sortBy: e.target.value as 'last_name' | 'first_name' | 'company'
    });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      sortOrder: e.target.value as 'asc' | 'desc'
    });
  };

  const handleSponsorToggle = () => {
    onFilterChange({
      includeSponsors: !filters.includeSponsors
    });
  };

  return (
    <div className="search-controls">
      {/* Search Input */}
      <div className="search-input-group">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, company, or role..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="loading-spinner" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        )}
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        {/* Shared Events Filter */}
        <label className={`filter-toggle ${filters.showSharedEventsOnly ? 'active' : ''}`}>
          <input
            type="checkbox"
            checked={filters.showSharedEventsOnly}
            onChange={handleSharedEventsToggle}
            disabled={isLoading}
          />
          <span>Show only people with shared events</span>
        </label>

        {/* Sponsor Filter */}
        <label className={`filter-toggle ${filters.includeSponsors ? 'active' : ''}`}>
          <input
            type="checkbox"
            checked={filters.includeSponsors}
            onChange={handleSponsorToggle}
            disabled={isLoading}
          />
          <span>Include sponsor attendees</span>
        </label>

        {/* Sort Controls */}
        <div className="sort-controls">
          <label className="sort-label">Sort by:</label>
          <select
            className="sort-select"
            value={filters.sortBy || 'last_name'}
            onChange={handleSortByChange}
            disabled={isLoading}
          >
            <option value="last_name">Last Name</option>
            <option value="first_name">First Name</option>
            <option value="company">Company Name</option>
          </select>
          
          <select
            className="sort-select"
            value={filters.sortOrder || 'asc'}
            onChange={handleSortOrderChange}
            disabled={isLoading}
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            className="clear-button"
            onClick={onClearSearch}
            disabled={isLoading}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--gray-100)',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--gray-700)'
            }}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchControls;
