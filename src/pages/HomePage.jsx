import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import SessionCard from '../components/session/SessionCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Home Page Component
 * Main dashboard with Now/Next cards and quick actions
 * Refactored from home.html (587 lines) to ~80 lines
 */
const HomePage = () => {
  // Mock data - would come from props or API in real implementation
  const currentSession = {
    title: "Networking Coffee Break",
    time: "10:00 AM - 10:30 AM",
    countdown: "23 minutes left"
  };

  const nextSession = {
    title: "Track A: Revenue Growth Strategies",
    time: "1:30 PM - 3:00 PM",
    location: "Conference Room B",
    speaker: "Michael Rodriguez, CEO at InnovateCorp",
    seatInfo: {
      table: "Table 5",
      href: "seat-map.html",
      onClick: (e) => {
        e.preventDefault();
        // Handle seat map navigation
        console.log('Navigate to seat map');
      }
    }
  };

  const handleScheduleClick = () => {
    // Navigate to schedule page
    window.location.href = 'schedule.html#current';
  };

  return (
    <PageLayout>
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1 className="welcome-title">Good morning, John</h1>
        <p className="welcome-subtitle">Here's what's happening at the conference today</p>
      </section>

      {/* Now/Next Section */}
      <section className="now-next-section">
        <h2 className="section-title">Now & Next</h2>
        <div className="cards-container">
          <SessionCard 
            session={currentSession} 
            variant="now"
            onClick={() => console.log('Current session clicked')}
          />
          <SessionCard 
            session={nextSession} 
            variant="next"
            onClick={() => console.log('Next session clicked')}
          />
        </div>
      </section>

      {/* Schedule CTA */}
      <section className="schedule-cta">
        <Card 
          className="schedule-button"
          onClick={handleScheduleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            background: 'var(--white)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-xl)',
            transition: 'all var(--transition-slow)',
            textDecoration: 'none',
            color: 'inherit',
            border: '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          <div 
            className="cta-icon"
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--purple-050)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-3xl)',
              flexShrink: 0
            }}
          >
            📅
          </div>
          <div className="cta-content" style={{ flex: 1, minWidth: 0 }}>
            <h3 
              className="cta-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--ink-900)',
                marginBottom: 'var(--space-xs)'
              }}
            >
              View Full Schedule
            </h3>
            <p 
              className="cta-description"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--ink-700)'
              }}
            >
              See your complete agenda
            </p>
          </div>
          <div 
            className="cta-arrow"
            style={{
              fontSize: 'var(--text-3xl)',
              color: 'var(--purple-700)',
              fontWeight: 'var(--font-semibold)',
              flexShrink: 0
            }}
          >
            →
          </div>
        </Card>
      </section>
    </PageLayout>
  );
};

export default HomePage;
