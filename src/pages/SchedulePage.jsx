import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import ScheduleView from '../components/ScheduleView';
import PullToRefresh from '../components/common/PullToRefresh';
import useSessionData from '../hooks/useSessionData';

/**
 * Schedule Page Component
 * Wraps ScheduleView with proper page layout for /schedule route
 * Story 2.2: Personalized Schedule View - Task 7 Critical Bug Fix
 * Replaces hardcoded SchedulePage with dynamic ScheduleView integration
 */
const SchedulePage = () => {
  // Get refresh function from useSessionData
  const { refreshData } = useSessionData();

  // Enhanced refresh function that follows settings page pattern
  const handleRefreshData = async () => {
    try {
      console.log('🔄 [PULL-TO-REFRESH] Starting cache clearing and data refresh');
      
      // Step 1: Clear all relevant cache entries to force fresh fetch (same as settings page)
      const cacheKeys = [
        'kn_cache_attendees',
        'kn_cache_agenda_items', 
        'kn_cache_dining_options',
        'kn_cache_sponsors',
        'kn_cache_seat_assignments',
        'kn_cache_seating_configurations',
        'kn_cached_sessions'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [PULL-TO-REFRESH] Cleared cache: ${key}`);
      });
      
      // Step 2: Use serverDataSyncService.syncAllData() (same as settings page)
      const { serverDataSyncService } = await import('../services/serverDataSyncService');
      const result = await serverDataSyncService.syncAllData();
      
      if (result.success) {
        console.log('✅ [PULL-TO-REFRESH] Data refresh successful');
        console.log(`📊 [PULL-TO-REFRESH] Synced tables: ${result.syncedTables.join(', ')}`);
        
        // Step 3: Trigger useSessionData refresh to reload the UI
        await refreshData();
      } else {
        console.error('❌ [PULL-TO-REFRESH] Data refresh failed:', result.errors);
        throw new Error(`Failed to refresh data: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ [PULL-TO-REFRESH] Refresh error:', error);
      throw error;
    }
  };

  const handleSessionClick = (session) => {
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