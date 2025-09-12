import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/layout/PageLayout';
import SessionCard from '../components/session/SessionCard';
import StatusTag from '../components/common/StatusTag';
import Card from '../components/common/Card';

/**
 * Schedule Page Component
 * Displays conference schedule with day headers and session cards
 * Refactored from schedule.html (720 lines) to React component
 */
const SchedulePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stickyHeaders, setStickyHeaders] = useState({});

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mock data - would come from props or API in real implementation
  const scheduleData = [
    {
      id: 'monday',
      day: 'Monday, October 20',
      subtitle: 'Welcome Reception & Opening',
      sessions: [
        {
          id: 'opening-reception',
          title: 'Opening Reception & Networking',
          time: '6:00 PM - 8:00 PM',
          location: 'Grand Ballroom Foyer',
          status: 'past',
          seatInfo: {
            table: 'Table 8',
            href: 'seat-map.html',
            onClick: (e) => {
              e.preventDefault();
              console.log('Navigate to seat map for Table 8');
            }
          }
        }
      ]
    },
    {
      id: 'tuesday',
      day: 'Tuesday, October 21',
      subtitle: 'Main Conference Day',
      sessions: [
        {
          id: 'breakfast',
          title: 'Continental Breakfast',
          time: '8:00 AM - 9:00 AM',
          location: 'Terrace Restaurant',
          status: 'past'
        },
        {
          id: 'digital-transformation',
          title: 'Digital Transformation in Manufacturing',
          time: '9:00 AM - 10:00 AM',
          location: 'Grand Ballroom A',
          speaker: 'Sarah Chen, CTO at TechCorp',
          status: 'current',
          seatInfo: {
            table: 'Table 12',
            href: 'seat-map.html',
            onClick: (e) => {
              e.preventDefault();
              console.log('Navigate to seat map for Table 12');
            }
          }
        },
        {
          id: 'coffee-break',
          title: 'Coffee & Networking Break',
          time: '10:00 AM - 10:30 AM',
          location: 'Foyer & Terrace',
          status: 'upcoming'
        },
        {
          id: 'revenue-growth',
          title: 'Track A: Revenue Growth Strategies',
          time: '10:30 AM - 12:00 PM',
          location: 'Conference Room B',
          status: 'upcoming',
          seatInfo: {
            table: 'Table 5',
            href: 'seat-map.html',
            onClick: (e) => {
              e.preventDefault();
              console.log('Navigate to seat map for Table 5');
            }
          }
        },
        {
          id: 'networking-lunch',
          title: 'Networking Lunch',
          time: '12:00 PM - 1:30 PM',
          location: 'Grand Ballroom',
          status: 'upcoming',
          seatInfo: {
            table: 'Table 8',
            href: 'seat-map.html',
            onClick: (e) => {
              e.preventDefault();
              console.log('Navigate to seat map for Table 8');
            }
          }
        }
      ]
    },
    {
      id: 'wednesday',
      day: 'Wednesday, October 22',
      subtitle: 'Closing & Departure',
      sessions: [
        {
          id: 'closing-address',
          title: 'Apax Closing Address',
          time: '9:00 AM - 10:00 AM',
          location: 'Grand Ballroom A',
          speaker: 'Michael Smith, Managing Partner',
          status: 'upcoming',
          seatInfo: {
            table: 'Table 12',
            href: 'seat-map.html',
            onClick: (e) => {
              e.preventDefault();
              console.log('Navigate to seat map for Table 12');
            }
          }
        }
      ]
    }
  ];

  // Handle sticky header state
  const handleScroll = () => {
    const dayHeaders = document.querySelectorAll('.day-header');
    const newStickyHeaders = {};
    
    dayHeaders.forEach(header => {
      const rect = header.getBoundingClientRect();
      const isStuck = rect.top <= 0;
      newStickyHeaders[header.id] = isStuck;
    });
    
    setStickyHeaders(newStickyHeaders);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to current session on mount if hash is present
  useEffect(() => {
    if (window.location.hash === '#current') {
      const currentSession = document.getElementById('current');
      if (currentSession) {
        setTimeout(() => {
          currentSession.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Add highlight effect
          currentSession.style.boxShadow = '0 0 0 4px rgba(124, 76, 196, 0.2)';
          setTimeout(() => {
            currentSession.style.boxShadow = '';
          }, 2000);
        }, 100);
      }
    }
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case 'current': return 'Now';
      case 'upcoming': return 'Next';
      case 'past': return 'Past';
      default: return 'Upcoming';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'current': return 'now';
      case 'upcoming': return 'next';
      case 'past': return 'past';
      default: return 'upcoming';
    }
  };

  return (
    <PageLayout>
      <h1 className="page-title">My Schedule</h1>
      
      <div className="schedule-content">
        {scheduleData.map((day) => (
          <div key={day.id} className="day-group">
            <div 
              id={day.id}
              className={`day-header ${stickyHeaders[day.id] ? 'sticky' : ''}`}
            >
              <div className="day-title">{day.day}</div>
              <div className="day-subtitle">{day.subtitle}</div>
            </div>
            
            <div className="session-list">
              {day.sessions.map((session) => (
                <div 
                  key={session.id}
                  id={session.status === 'current' ? 'current' : undefined}
                  className={`session-item ${session.status}`}
                >
                  <div className="session-header">
                    <div className="session-time-container">
                      <div className="session-time">{session.time}</div>
                      {session.location && (
                        <div className="session-location">{session.location}</div>
                      )}
                    </div>
                    <StatusTag variant={getStatusVariant(session.status)}>
                      {getStatusText(session.status)}
                    </StatusTag>
                  </div>
                  
                  <h3 className="session-title">{session.title}</h3>
                  
                  <div className="session-details">
                    {session.speaker && (
                      <div className="session-detail">
                        <a 
                          href={`/bio?speaker=${encodeURIComponent(session.speaker)}`}
                          className="speaker-link"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Navigate to speaker bio:', session.speaker);
                          }}
                        >
                          {session.speaker}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {session.seatInfo && (
                    <a 
                      href={session.seatInfo.href}
                      className="seat-assignment"
                      onClick={session.seatInfo.onClick}
                    >
                      <div className="seat-label">Your Table</div>
                      <div className="seat-details">
                        <span>{session.seatInfo.table}</span>
                        <span className="seat-map-link">View table map</span>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default SchedulePage;
