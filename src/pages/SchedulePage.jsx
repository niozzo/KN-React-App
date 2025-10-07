import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import ScheduleView from '../components/ScheduleView';

/**
 * Schedule Page Component
 * Wraps ScheduleView with proper page layout for /schedule route
 * Story 2.2: Personalized Schedule View - Task 7 Critical Bug Fix
 * Replaces hardcoded SchedulePage with dynamic ScheduleView integration
 */
const SchedulePage = () => {
  const handleSessionClick = (session) => {
    // Handle session click navigation
    console.log('Session clicked:', session);
    // Could navigate to session details or bio page
  };

  return (
    <PageLayout>
      <h1 className="page-title">My Schedule</h1>
      <ScheduleView 
        onSessionClick={handleSessionClick}
        className="schedule-page-content"
      />
    </PageLayout>
  );
};

export default SchedulePage;