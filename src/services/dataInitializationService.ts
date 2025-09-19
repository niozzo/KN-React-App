/**
 * Data Initialization Service
 * 
 * Ensures data is properly loaded before admin panel access.
 * Follows authentication-first data access pattern.
 */

import { pwaDataSyncService } from './pwaDataSyncService';
import { serverDataSyncService } from './serverDataSyncService';
import { getAuthStatus } from './authService';

export interface DataInitializationResult {
  success: boolean;
  hasData: boolean;
  error?: string;
  requiresAuthentication?: boolean;
}

export class DataInitializationService {
  /**
   * Ensure data is loaded before admin panel access
   * Follows authentication-first pattern
   */
  async ensureDataLoaded(): Promise<DataInitializationResult> {
    try {
      // Step 1: Check authentication status first
      const authStatus = getAuthStatus();
      if (!authStatus.isAuthenticated) {
        return {
          success: false,
          hasData: false,
          requiresAuthentication: true,
          error: 'Authentication required to access admin data'
        };
      }

      // Step 2: Check if data already exists in localStorage
      const hasCachedData = this.hasCachedData();
      if (hasCachedData) {
        console.log('✅ Data already cached, admin panel ready');
        return {
          success: true,
          hasData: true
        };
      }

      // Step 3: Data not cached, trigger sync
      console.log('🔄 No cached data found, triggering data sync...');
      const syncResult = await serverDataSyncService.syncAllData();
      
      if (syncResult.success) {
        console.log('✅ Data sync completed successfully');
        return {
          success: true,
          hasData: true
        };
      } else {
        console.warn('⚠️ Data sync failed:', syncResult.errors);
        return {
          success: false,
          hasData: false,
          error: 'Failed to load conference data. Please try refreshing the page.'
        };
      }

    } catch (error) {
      console.error('❌ Data initialization failed:', error);
      return {
        success: false,
        hasData: false,
        error: 'Failed to initialize data. Please check your connection and try again.'
      };
    }
  }

  /**
   * Check if required data exists in localStorage
   */
  private hasCachedData(): boolean {
    try {
      // Check for agenda items (required for admin panel)
      const agendaData = localStorage.getItem('kn_cache_agenda_items');
      if (!agendaData) {
        return false;
      }

      // Check for attendees (required for admin panel)
      const attendeeData = localStorage.getItem('kn_cache_attendees');
      if (!attendeeData) {
        return false;
      }

      // Parse and validate data structure
      const agendaItems = JSON.parse(agendaData);
      const attendees = JSON.parse(attendeeData);
      
      const agendaArray = agendaItems.data || agendaItems || [];
      const attendeeArray = attendees.data || attendees || [];

      // Ensure we have actual data, not just empty arrays
      return agendaArray.length > 0 && attendeeArray.length > 0;

    } catch (error) {
      console.warn('⚠️ Error checking cached data:', error);
      return false;
    }
  }

  /**
   * Force refresh of all data
   */
  async forceRefreshData(): Promise<DataInitializationResult> {
    try {
      console.log('🔄 Force refreshing all data...');
      
      // Check authentication first
      const authStatus = getAuthStatus();
      if (!authStatus.isAuthenticated) {
        return {
          success: false,
          hasData: false,
          requiresAuthentication: true,
          error: 'Authentication required to refresh data'
        };
      }

      // Force sync all data
      const syncResult = await serverDataSyncService.syncAllData();
      
      if (syncResult.success) {
        console.log('✅ Force refresh completed successfully');
        return {
          success: true,
          hasData: true
        };
      } else {
        return {
          success: false,
          hasData: false,
          error: 'Failed to refresh data. Please try again.'
        };
      }

    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return {
        success: false,
        hasData: false,
        error: 'Failed to refresh data. Please check your connection and try again.'
      };
    }
  }
}

export const dataInitializationService = new DataInitializationService();
