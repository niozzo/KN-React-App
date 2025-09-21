/**
 * Data Initialization Service
 * 
 * Ensures data is properly loaded before admin panel access.
 * Follows authentication-first data access pattern.
 */

import { pwaDataSyncService } from './pwaDataSyncService';
import { serverDataSyncService } from './serverDataSyncService';
import { getAuthStatus } from './authService';
import { unifiedCacheService } from './unifiedCacheService';

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
      const hasCachedData = await this.hasCachedData();
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
        
        // Step 4: Ensure application database tables are synced for admin panel
        await this.ensureApplicationDatabaseSynced();
        
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
   * Check if required data exists in unified cache
   */
  private async hasCachedData(): Promise<boolean> {
    try {
      // Check for agenda items (required for admin panel)
      const agendaData = await unifiedCacheService.get('kn_cache_agenda_items');
      if (!agendaData) {
        return false;
      }

      // Check for attendees (required for admin panel)
      const attendeeData = await unifiedCacheService.get('kn_cache_attendees');
      if (!attendeeData) {
        return false;
      }

      // Check for application database tables (required for admin panel)
      const speakerAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
      const agendaItemMetadata = await pwaDataSyncService.getCachedTableData('agenda_item_metadata');
      const attendeeMetadata = await pwaDataSyncService.getCachedTableData('attendee_metadata');

      // Validate data structure
      const agendaArray = (agendaData as any).data || agendaData || [];
      const attendeeArray = (attendeeData as any).data || attendeeData || [];

      // Ensure we have actual data, not just empty arrays
      const hasBasicData = agendaArray.length > 0 && attendeeArray.length > 0;
      
      // Log application database table status for debugging
      console.log('📊 Application database tables status:', {
        speaker_assignments: speakerAssignments.length,
        agenda_item_metadata: agendaItemMetadata.length,
        attendee_metadata: attendeeMetadata.length
      });

      return hasBasicData;

    } catch (error) {
      console.warn('⚠️ Error checking cached data:', error);
      return false;
    }
  }

  /**
   * Ensure application database tables are synced for admin panel
   */
  private async ensureApplicationDatabaseSynced(): Promise<void> {
    try {
      console.log('🔄 Ensuring application database tables are synced...');
      
      // Sync application database tables using PWA data sync service
      const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata'];
      
      for (const tableName of applicationTables) {
        try {
          await pwaDataSyncService.syncApplicationTable(tableName);
          console.log(`✅ Application table ${tableName} synced`);
        } catch (error) {
          console.warn(`⚠️ Failed to sync application table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }
      
      console.log('✅ Application database sync completed');
    } catch (error) {
      console.warn('⚠️ Application database sync failed:', error);
      // Don't throw error as this is not critical for basic functionality
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
