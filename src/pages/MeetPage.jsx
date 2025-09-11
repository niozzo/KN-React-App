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
      company: 'Tosca Ltd'
    },
    {
      id: 'ayla-queiroga',
      name: 'Ayla Queiroga',
      title: 'Managing Director',
      company: 'Accordion',
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
      company: 'InnovateCorp'
    },
    {
      id: 'evelina-stromberg',
      name: 'Evelina Stromberg',
      title: 'Private Equity Partnerships',
      company: 'Vertice',
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

  const { 
    meetList, 
    addToMeetList, 
    removeFromMeetList, 
    isInMeetList,
    meetListButtonRef
  } = useMeetList([
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

  const handleAttendeeAction = (attendee, event) => {
    if (isInMeetList(attendee)) {
      // Trigger remove animation
      triggerRemoveAnimation(event.currentTarget, attendee);
    } else {
      // Trigger business card fly animation
      triggerBusinessCardFlyAnimation(event.currentTarget);
      addToMeetList(attendee);
    }
  };

  const triggerBusinessCardFlyAnimation = (button) => {
    // Get button position for animation start point
    const buttonRect = button.getBoundingClientRect();
    const startX = buttonRect.left + buttonRect.width / 2;
    const startY = buttonRect.top + buttonRect.height / 2;
    
    // Get My Meet List tab position for animation end point
    const meetListTab = meetListButtonRef.current;
    if (!meetListTab) {
      console.log('Meet list tab not found');
      return;
    }
    
    const tabRect = meetListTab.getBoundingClientRect();
    const endX = tabRect.left + tabRect.width / 2;
    const endY = tabRect.top + tabRect.height / 2;
    
    console.log('Animation target:', {
      startX, startY,
      endX, endY,
      deltaX: endX - startX,
      deltaY: endY - startY
    });
    
    // Calculate distance to travel
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // Create business card icon
    const businessCard = document.createElement('div');
    businessCard.className = 'business-card-icon';
    businessCard.innerHTML = '📇';
    businessCard.style.position = 'fixed';
    businessCard.style.fontSize = '24px';
    businessCard.style.zIndex = '1000';
    businessCard.style.pointerEvents = 'none';
    businessCard.style.left = startX + 'px';
    businessCard.style.top = startY + 'px';
    
    // Set CSS custom properties for animation
    businessCard.style.setProperty('--delta-x', deltaX + 'px');
    businessCard.style.setProperty('--delta-y', deltaY + 'px');
    
    document.body.appendChild(businessCard);
    
    // Remove business card after animation
    setTimeout(() => {
      if (businessCard.parentNode) {
        businessCard.parentNode.removeChild(businessCard);
      }
    }, 800);
  };

  const triggerRemoveAnimation = (button, attendee) => {
    try {
      // Get the attendee card
      const attendeeCard = button.closest('.attendee-card');
      const attendeeList = attendeeCard?.closest('.attendee-list');
      
      if (!attendeeCard || !attendeeList) {
        console.log('Card or list not found for remove animation');
        return;
      }
      
      // Reset button state to prevent pressed state
      button.blur();
      
      // Add smooth scroll class to the list
      attendeeList.classList.add('smooth-scroll');
      
      // Add removing animation class
      attendeeCard.classList.add('removing');
      
      // Update counter immediately (like in mockup)
      updateMeetListCounterRemove();
      
      // Remove from meet list after animation completes
      setTimeout(() => {
        try {
          removeFromMeetList(attendee);
          
          // Remove smooth scroll class after state update
          setTimeout(() => {
            if (attendeeList && attendeeList.classList) {
              attendeeList.classList.remove('smooth-scroll');
            }
          }, 100);
        } catch (error) {
          console.error('Error during remove animation:', error);
        }
      }, 600);
    } catch (error) {
      console.error('Error in triggerRemoveAnimation:', error);
    }
  };

  const updateMeetListCounterRemove = () => {
    // Use ref if available, fallback to DOM selector
    const targetButton = meetListButtonRef.current || 
      document.querySelector('.nav-item:nth-child(3)'); // Meet is 3rd tab
    
    if (targetButton) {
      targetButton.classList.add('counter-pulse');
      setTimeout(() => {
        targetButton.classList.remove('counter-pulse');
      }, 600);
    }
  };

  const handleViewBio = (attendee) => {
    window.location.href = `bio.html?id=${attendee.id}`;
  };


  const currentAttendees = activeTab === 'all-attendees' ? sortedItems : meetList;

  return (
    <PageLayout>
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
          ref={meetListButtonRef}
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
            className={`search-section-header ${searchExpanded ? 'expanded' : ''}`}
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
              className="search-section search-section-overlap"
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)',
                boxShadow: 'var(--shadow-md)'
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
      <div className="attendee-list cards-container" style={{ marginBottom: '200px' }}>
        {currentAttendees.length > 0 ? (
          currentAttendees.map((attendee) => (
            <AttendeeCard
              key={attendee.id}
              attendee={attendee}
              isInMeetList={isInMeetList(attendee)}
              onAddToMeetList={handleAttendeeAction}
              onRemoveFromMeetList={handleAttendeeAction}
              onViewBio={handleViewBio}
              currentTab={activeTab}
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
