/**
 * Data Initialization Service
 * 
 * Ensures data is properly loaded before admin panel access.
 * Follows authentication-first data access pattern.
 */

// Removed pwaDataSyncService and unifiedCacheService imports - using simplified approach
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
        // Data sync completed
        
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
      const agendaData = localStorage.getItem('cache_agenda_items');
      if (!agendaData) {
        return false;
      }

      // Check for attendees (required for admin panel)
      const attendeeData = localStorage.getItem('cache_attendees');
      if (!attendeeData) {
        return false;
      }

      // Check for application database tables (required for admin panel)
      const agendaItemMetadata = localStorage.getItem('cache_agenda_item_metadata');
      const attendeeMetadata = localStorage.getItem('cache_attendee_metadata');

      // Validate data structure
      const agendaParsed = JSON.parse(agendaData);
      const attendeeParsed = JSON.parse(attendeeData);
      const agendaArray = agendaParsed.data || [];
      const attendeeArray = attendeeParsed.data || [];

      // Ensure we have actual data, not just empty arrays
      const hasBasicData = agendaArray.length > 0 && attendeeArray.length > 0;
      
      // Log application database table status for debugging
      console.log('📊 Application database tables status:', {
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
      const applicationTables = ['attendee_metadata'];
      
      for (const tableName of applicationTables) {
        try {
          // Simplified approach - sync using serverDataSyncService
          await serverDataSyncService.syncTable(tableName);
        } catch (error) {
          console.warn(`⚠️ Failed to sync application table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }
      
      // Application database sync completed
    } catch (error) {
      console.warn('⚠️ Application database sync failed:', error);
      // Don't throw error as this is not critical for basic functionality
    }
  }

  /**
   * Ensure data is loaded for admin panel access (no user authentication required)
   * Admin panel has its own passcode protection, so we skip user auth check
   * See: ADR-005 for architectural justification
   */
  async ensureDataLoadedForAdmin(): Promise<DataInitializationResult> {
    try {
      console.log('🔓 Admin data access (passcode only, no user auth required)');

      // Step 1: Check if data already exists in cache (fast path)
      const hasCachedData = await this.hasCachedData();
      if (hasCachedData) {
        console.log('✅ Cached data found, admin panel ready');
        return {
          success: true,
          hasData: true
        };
      }

      // Step 2: No cached data? Sync using admin credentials
      console.log('🔄 No cached data, syncing with admin credentials...');
      const syncResult = await serverDataSyncService.syncAllData();
      
      if (syncResult.success) {
        // Step 3: Ensure application database tables are synced for admin panel
        await this.ensureApplicationDatabaseSynced();
        
        console.log('✅ Admin data loaded successfully');
        return {
          success: true,
          hasData: true
        };
      } else {
        console.warn('⚠️ Data sync failed:', syncResult.errors);
        return {
          success: false,
          hasData: false,
          error: 'Failed to load conference data. Please check your connection and try again.'
        };
      }

    } catch (error) {
      console.error('❌ Admin data initialization failed:', error);
      return {
        success: false,
        hasData: false,
        error: 'Failed to load admin data. Please check your connection and try again.'
      };
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
        // Force refresh completed
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
