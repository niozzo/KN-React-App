import React, { useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import ScheduleView from '../components/ScheduleView';
import PullToRefresh from '../components/common/PullToRefresh';
import useSessionData from '../hooks/useSessionData';
import { analyticsService } from '../services/analyticsService';

/**
 * Schedule Page Component
 * Wraps ScheduleView with proper page layout for /schedule route
 * Story 2.2: Personalized Schedule View - Task 7 Critical Bug Fix
 * Replaces hardcoded SchedulePage with dynamic ScheduleView integration
 */
const SchedulePage = () => {
  // Get refresh function from useSessionData
  const { refreshData } = useSessionData();

  // Track page view on mount
  useEffect(() => {
    analyticsService.trackPageView('schedule', {
      timestamp: Date.now()
    });
  }, []);

  // Pull-to-refresh removed - now handled by timestamp-based smart sync

  const handleSessionClick = (session) => {
    // Track session interaction
    analyticsService.trackUserAction('schedule_item_view', {
      sessionType: session.type || 'unknown',
      itemId: session.id,
      sessionTitle: session.title,
      timestamp: Date.now()
    });
    
    // Handle session click navigation
    console.log('Session clicked:', session);
    // Could navigate to session details or bio page
  };

  return (
    <PageLayout>
      <h1 className="page-title">My Schedule</h1>
      {/* <PullToRefresh onRefresh={handleRefreshData}> */}
        <ScheduleView 
          onSessionClick={handleSessionClick}
          className="schedule-page-content"
        />
      {/* </PullToRefresh> */}
    </PageLayout>
  );
};

export default SchedulePage;