import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import AttendeeCard from '../components/attendee/AttendeeCard';
import Button from '../components/common/Button';
import { useMeetList } from '../hooks/useMeetList';
import { useSearch } from '../hooks/useSearch';
import { useSort } from '../hooks/useSort';

/**
 * Meet Page Component
 * Attendee search and discovery with networking hints
 * Refactored from meet.html (1422 lines) to ~150 lines
 */
const MeetPage = () => {
  const [activeTab, setActiveTab] = useState('all-attendees');
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Mock data - would come from API in real implementation
  const allAttendees = [
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      title: 'Chief Technology Officer',
      company: 'TechCorp',
      email: 'sarah@techcorp.com',
      sharedEvents: [
        {
          dateTime: 'Monday October 20 - 9:00 AM',
          title: 'Digital Transformation session',
          location: 'Main Conference Room'
        },
        {
          dateTime: 'Monday October 20 - 7:00 PM',
          title: 'Table 8 dinner',
          location: 'Grand Ballroom'
        }
      ]
    },
    {
      id: 'nigel-lemmon',
      name: 'Nigel Lemmon',
      title: 'Global CIO',
      company: 'Tosca Ltd',
      email: 'nigel@tosca.com'
    },
    {
      id: 'ayla-queiroga',
      name: 'Ayla Queiroga',
      title: 'Managing Director',
      company: 'Accordion',
      email: 'ayla@accordion.com',
      isSponsor: true,
      sharedEvents: [
        {
          dateTime: 'Monday October 20 - 10:30 AM',
          title: 'Revenue Growth Strategies session',
          location: 'Conference Room B'
        }
      ]
    },
    {
      id: 'michael-rodriguez',
      name: 'Michael Rodriguez',
      title: 'CEO',
      company: 'InnovateCorp',
      email: 'michael@innovatecorp.com'
    },
    {
      id: 'evelina-stromberg',
      name: 'Evelina Stromberg',
      title: 'Private Equity Partnerships',
      company: 'Vertice',
      email: 'evelina@vertice.com',
      isSponsor: true,
      sharedEvents: [
        {
          dateTime: 'Monday October 20 - 10:30 AM',
          title: 'Operational Performance session',
          location: 'Conference Room C'
        }
      ]
    }
  ];

  const { meetList, addToMeetList, removeFromMeetList, isInMeetList } = useMeetList([
    allAttendees[0], // Sarah Chen
    allAttendees[3], // Michael Rodriguez
    allAttendees[4]  // Evelina Stromberg
  ]);

  const { 
    searchTerm, 
    showSharedEventsOnly, 
    filteredItems, 
    handleSearchChange, 
    handleSharedEventsFilterChange 
  } = useSearch(allAttendees, ['name', 'title', 'company']);

  const { sortedItems, handleSortChange, getSortOptions } = useSort(filteredItems);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const toggleSearchSection = () => {
    setSearchExpanded(!searchExpanded);
  };

  const handleAttendeeAction = (attendee) => {
    if (isInMeetList(attendee)) {
      removeFromMeetList(attendee);
    } else {
      addToMeetList(attendee);
    }
  };

  const handleViewBio = (attendee) => {
    window.location.href = `bio.html?id=${attendee.id}`;
  };

  const handleEmail = (attendee) => {
    window.location.href = `mailto:${attendee.email}`;
  };

  const currentAttendees = activeTab === 'all-attendees' ? sortedItems : meetList;

  return (
    <PageLayout activeTab="meet">
      <h1 className="page-title">Meet List</h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <Button
          variant={activeTab === 'all-attendees' ? 'primary' : 'secondary'}
          onClick={() => handleTabChange('all-attendees')}
          style={{ flex: 1 }}
        >
          All Attendees
        </Button>
        <Button
          variant={activeTab === 'my-meet-list' ? 'primary' : 'secondary'}
          onClick={() => handleTabChange('my-meet-list')}
          style={{ flex: 1 }}
        >
          My Meet List ({meetList.length})
        </Button>
      </div>

      {/* All Attendees Tab */}
      {activeTab === 'all-attendees' && (
        <>
          {/* Search Section */}
          <section 
            className="search-section-header"
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-lg)',
              boxShadow: 'var(--shadow-md)'
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
              className="search-section"
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)',
                boxShadow: 'var(--shadow-md)',
                borderTop: 'none',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                marginTop: 0
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
                    <span className="toggle-label">Show only people with shared events</span>
                  </label>
                </div>
                
                <div className="sort-section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  <span className="sort-label" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', color: 'var(--ink-700)', whiteSpace: 'nowrap' }}>
                    Sort by:
                  </span>
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
        </>
      )}

      {/* Attendee List */}
      <div className="attendee-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: '200px' }}>
        {currentAttendees.length > 0 ? (
          currentAttendees.map((attendee) => (
            <AttendeeCard
              key={attendee.id}
              attendee={attendee}
              isInMeetList={isInMeetList(attendee)}
              onAddToMeetList={handleAttendeeAction}
              onRemoveFromMeetList={handleAttendeeAction}
              onViewBio={handleViewBio}
              onEmail={handleEmail}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3 className="empty-title">No attendees found</h3>
            <p className="empty-description">
              {activeTab === 'all-attendees' 
                ? 'Try adjusting your search criteria or filters.'
                : 'Add people to your meet list to see them here.'
              }
            </p>
            {activeTab === 'all-attendees' && (
              <Button onClick={() => handleTabChange('all-attendees')}>
                Browse All Attendees
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MeetPage;
