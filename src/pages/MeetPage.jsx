import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import AttendeeCard from '../components/attendee/AttendeeCard';
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

  // Single source of truth: URL parameters
  const searchTerm = searchParams.get('search') || '';
  
  // Direct filtering without useSearch hook
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allAttendees || [];
    }
    
    const term = searchTerm.toLowerCase();
    return (allAttendees || []).filter(attendee => 
      ['first_name', 'last_name', 'title', 'company'].some(field => {
        const value = attendee[field];
        return value && value.toLowerCase().includes(term);
      })
    );
  }, [allAttendees, searchTerm]);
  
  // Create search handler that updates URL (single source of truth)
  const handleSearchChange = (value) => {
    // Update URL parameters directly
    const newSearchParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newSearchParams.set('search', value);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
  };

  // Handle Enter key to blur search field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Return') {
      e.target.blur();
    }
  };


  // Clear search and scroll to top
  const handleClearSearch = (e) => {
    // Only prevent default, don't stop propagation
    e.preventDefault();
    
    // Clear URL parameter (single source of truth)
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    setSearchParams(newSearchParams);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to top functionality
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div
        className="search-container"
        style={{
          background: 'var(--white)',
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--ink-200)',
          marginBottom: 'var(--space-lg)'
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, company, or role..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              fontSize: 'var(--text-lg)',
              padding: 'var(--space-md)',
              paddingRight: searchTerm ? '50px' : 'var(--space-md)',
              border: '2px solid var(--purple-200)',
              borderRadius: 'var(--radius-lg)',
              outline: 'none',
              transition: 'border-color var(--transition-normal), padding-right var(--transition-normal)'
            }}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--transition-normal)',
                color: 'var(--ink-400)',
                fontSize: '18px',
                zIndex: 10,
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--ink-100)';
                e.target.style.color = 'var(--ink-600)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--ink-400)';
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
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

      {/* Floating Back to Top Button */}
      <button
        onClick={handleBackToTop}
        style={{
          position: 'fixed',
          bottom: '80px', // Position above nav bar (nav bar is typically ~60px)
          right: '20px',
          width: '60px',
          height: '70px',
          borderRadius: '30px',
          backgroundColor: 'var(--purple-600)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          boxShadow: '0 6px 20px rgba(139, 69, 19, 0.3)',
          transition: 'all var(--transition-normal)',
          zIndex: 1000,
          opacity: 1,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          padding: '8px 4px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 19, 0.4)';
          e.target.style.backgroundColor = 'var(--purple-700)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 6px 20px rgba(139, 69, 19, 0.3)';
          e.target.style.backgroundColor = 'var(--purple-600)';
        }}
        title="Back to top"
      >
        <div style={{ fontSize: '18px', marginBottom: '2px' }}>▲</div>
        <div style={{ fontSize: '10px', fontWeight: 'normal' }}>Top</div>
      </button>
    </PageLayout>
  );
};

export default MeetPage;
