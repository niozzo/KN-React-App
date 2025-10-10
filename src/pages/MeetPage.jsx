import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [searchExpanded, setSearchExpanded] = useState(false);
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

  const { 
    searchTerm, 
    showSharedEventsOnly, 
    filteredItems, 
    handleSearchChange, 
    handleSharedEventsFilterChange 
  } = useSearch(allAttendees || [], ['name', 'title', 'company']);

  const { sortedItems, handleSortChange, getSortOptions } = useSort(filteredItems);                                                                             

  const toggleSearchSection = () => {
    setSearchExpanded(!searchExpanded);
  };

  const handleViewBio = (attendee) => {
    navigate(`/bio?id=${attendee.id}`);
  };                                                                              

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="page-title">Meet List</h1>
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
        <h1 className="page-title">Meet List</h1>
        <div className="error-state">
          <p>Error loading attendees: {error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="page-title">Meet List</h1>

      {/* Search Section */}
      <section 
        className={`search-section-header ${searchExpanded ? 'expanded' : ''}`}                                                                             
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <button 
          className="search-toggle"
          onClick={toggleSearchSection}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-900)',
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            cursor: 'pointer',
            transition: 'color var(--transition-normal)'
          }}
        >
          <span>Find People to Meet</span>
          <span 
            style={{
              transition: 'transform var(--transition-normal)',
              color: 'var(--ink-500)',
              fontSize: 'var(--text-base)',
              transform: searchExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            ▼
          </span>
        </button>
      </section>

      {searchExpanded && (
        <section 
          className="search-section search-section-overlap"
          style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-lg)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div className="search-controls" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>                                    
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, company, or role..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            
            <div className="filter-section" style={{ marginTop: 'var(--space-md)' }}>                                                                       
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={showSharedEventsOnly}
                  onChange={(e) => handleSharedEventsFilterChange(e.target.checked)}                                                                        
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Shared events only</span>
              </label>
            </div>
            
            <div className="sort-section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>                      
              <select 
                className="form-select"
                onChange={(e) => handleSortChange(e.target.value)}
              >
                {getSortOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

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
