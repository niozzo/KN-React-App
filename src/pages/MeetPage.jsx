import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import AttendeeCard from '../components/attendee/AttendeeCard';
import { useSearch } from '../hooks/useSearch';
import { useSort } from '../hooks/useSort';
import { attendeeSearchService } from '../services/attendeeSearchService';

/**
 * Meet Page Component
 * Attendee search and discovery with networking hints
 * Refactored from meet.html (1422 lines) to ~150 lines
 */
const MeetPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Removed searchExpanded state - search is always visible
  const [allAttendees, setAllAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all attendees on component mount
  useEffect(() => {
    const loadAllAttendees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await attendeeSearchService.searchAttendees({});
        setAllAttendees(result.attendees);
        
      } catch (err) {
        console.error('Failed to load attendees:', err);
        setError(err.message || 'Failed to load attendees');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllAttendees();
  }, []);

  // Get search term from URL parameters
  const urlSearchTerm = searchParams.get('search') || '';
  
  const { 
    searchTerm, 
    filteredItems, 
    handleSearchChange: originalHandleSearchChange
  } = useSearch(allAttendees || [], ['first_name', 'last_name', 'title', 'company']);

  // Initialize search with URL parameter
  useEffect(() => {
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      originalHandleSearchChange(urlSearchTerm);
    }
  }, [urlSearchTerm, searchTerm, originalHandleSearchChange]);

  // Override search term with URL parameter
  const effectiveSearchTerm = urlSearchTerm || searchTerm;
  
  // Create custom search handler that updates URL
  const handleSearchChange = (value) => {
    originalHandleSearchChange(value);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newSearchParams.set('search', value);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
  };

  // Apply sorting to filtered items
  const { sortedItems } = useSort(filteredItems, 'last_name');                                                                             

  // Removed toggleSearchSection - search is always visible

  const handleViewBio = (attendee) => {
    navigate(`/bio?id=${attendee.id}`);
  };                                                                              

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="page-title">Bios</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading attendees...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <h1 className="page-title">Bios</h1>
        <div className="error-state">
          <p>Error loading attendees: {error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="page-title" style={{ marginBottom: 'var(--space-sm)' }}>Bios</h1>

      {/* Search Section */}
      {/* Sticky Search Field */}
      <div
        className="sticky-search-container"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--white)',
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--ink-200)',
          marginBottom: 'var(--space-lg)'
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, company, or role..."
          value={effectiveSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            width: '100%',
            fontSize: 'var(--text-lg)',
            padding: 'var(--space-md)',
            border: '2px solid var(--purple-200)',
            borderRadius: 'var(--radius-lg)',
            outline: 'none',
            transition: 'border-color var(--transition-normal)'
          }}
        />
      </div>

      {/* Attendee List */}
      <div className="attendee-list cards-container" style={{ marginBottom: '200px' }}>                                                                         
        {sortedItems.length > 0 ? (
          sortedItems.map((attendee) => (
            <AttendeeCard
              key={attendee.id}
              attendee={attendee}
              onViewBio={handleViewBio}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3 className="empty-title">No attendees found</h3>
            <p className="empty-description">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MeetPage;
