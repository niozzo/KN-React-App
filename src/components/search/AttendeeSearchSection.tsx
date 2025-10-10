/**
 * Attendee Search Section Component
 * Story 3.1: Attendee Search & Discovery
 * 
 * Progressive reveal search interface with collapsible "Find People to Meet" section
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAttendeeSearch } from '../../hooks/useAttendeeSearch';
import SearchControls from './SearchControls';
import AttendeeList from './AttendeeList';
import SearchResults from './SearchResults';
import './AttendeeSearchSection.css';

interface AttendeeSearchSectionProps {
  className?: string;
  onAttendeeSelect?: (attendee: any) => void;
}

const AttendeeSearchSection: React.FC<AttendeeSearchSectionProps> = ({
  className = '',
  onAttendeeSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Show by default
  const [isAnimating, setIsAnimating] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    searchResults,
    totalCount,
    isLoading,
    error,
    searchTime,
    isCached,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearSearch,
    hasActiveFilters,
    hasResults
  } = useAttendeeSearch({
    debounceDelay: 300,
    enableCaching: true
  });

  // Toggle search section
  const toggleSearchSection = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Handle clear search
  const handleClearSearch = () => {
    clearSearch();
  };

  // Handle attendee selection
  const handleAttendeeSelect = (attendee: any) => {
    if (onAttendeeSelect) {
      onAttendeeSelect(attendee);
    }
  };

  // Sticky navigation effect
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        if (rect.top <= 0) {
          headerRef.current.classList.add('sticky');
        } else {
          headerRef.current.classList.remove('sticky');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`attendee-search-section ${className}`}>
      {/* Search Section Header */}
      <div 
        ref={headerRef}
        className={`search-section-header ${isExpanded ? 'expanded' : ''}`}
      >
        <button 
          className="search-toggle"
          onClick={toggleSearchSection}
          disabled={isAnimating}
          aria-expanded={isExpanded}
          aria-controls="search-section"
        >
          <span className="search-toggle-text">Find People to Meet</span>
          <span className={`search-arrow ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Search Section Content */}
      <div 
        id="search-section"
        ref={searchSectionRef}
        className={`search-section ${isExpanded ? 'expanded' : ''}`}
        style={{ display: isExpanded ? 'block' : 'none' }}
      >
        {/* Search Controls */}
        <SearchControls
          searchQuery={searchQuery}
          filters={filters}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onClearSearch={handleClearSearch}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Search Results */}
        <SearchResults
          results={searchResults}
          totalCount={totalCount}
          isLoading={isLoading}
          error={error}
          searchTime={searchTime}
          isCached={isCached}
          hasResults={hasResults}
          onAttendeeSelect={handleAttendeeSelect}
        />

        {/* Attendee List */}
        {hasResults && (
          <AttendeeList
            attendees={searchResults}
            onAttendeeSelect={handleAttendeeSelect}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default AttendeeSearchSection;
