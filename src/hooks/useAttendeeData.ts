/**
 * Attendee Data Hook
 * Story 2.1f2: Data Loading Hook
 * 
 * Specialized hook for loading attendee data with caching
 */

import { useCallback } from 'react';
import { useDataLoading } from './useDataLoading';
import type { Attendee } from '../types/database';

// Mock function for getting current attendee data
// This would typically come from an auth service or API
const getCurrentAttendeeData = async (): Promise<Attendee> => {
  // This is a placeholder - in a real implementation, this would fetch from an API
  // or get from auth context
  return {
    id: 'current-user',
    name: 'Current User',
    email: 'user@example.com',
    first_name: 'Current',
    last_name: 'User'
  } as Attendee;
};

export const useAttendeeData = () => {
  const { data, loading, error, loadData, refresh, clearCache } = useDataLoading<Attendee>();

  const loadAttendee = useCallback(async () => {
    return loadData(
      'kn_cache_attendee',
      () => getCurrentAttendeeData(),
      { ttl: 10 * 60 * 1000 } // 10 minutes
    );
  }, [loadData]);

  const refreshAttendee = useCallback(async () => {
    return refresh(
      'kn_cache_attendee',
      () => getCurrentAttendeeData(),
      { ttl: 10 * 60 * 1000 }
    );
  }, [refresh]);

  const clearAttendeeCache = useCallback(async () => {
    return clearCache('kn_cache_attendee');
  }, [clearCache]);

  return {
    attendeeData: data,
    loading,
    error,
    loadAttendee,
    refreshAttendee,
    clearAttendeeCache
  };
};
