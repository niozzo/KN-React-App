/**
 * Offline-Enabled AttendeeService
 * Story 1.2: Database Integration & Data Access Layer Setup
 * 
 * Extends AttendeeService with offline capabilities using PWA data sync
 */

import { attendeeService } from './attendeeService';
import { pwaDataSyncService } from './pwaDataSyncService';
import { 
  Attendee, 
  DatabaseResponse, 
  PaginatedResponse 
} from '../types/database';

export class OfflineAttendeeService {
  private readonly tableName = 'attendees';

  /**
   * Get all attendees (offline-first)
   */
  async getAllAttendees(): Promise<PaginatedResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      
      if (cachedData.length > 0) {
        console.log(`📱 Using cached attendees data (${cachedData.length} records)`);
        return {
          data: cachedData,
          count: cachedData.length,
          error: null,
          success: true
        };
      }

      // Only fetch from API if cache is truly empty
      console.log('🌐 No cached data, fetching from server...');
      const result = await attendeeService.getAllAttendees();
      
      if (result.success && result.data.length > 0) {
        // Cache the data for offline use
        await pwaDataSyncService.cacheTableData(this.tableName, result.data);
        console.log(`✅ Cached ${result.data.length} attendees for offline use`);
      } else if (!result.success) {
        // API failed but check if we have stale cache as last resort
        console.warn('⚠️ API failed, checking for any stale cache data');
        // Cache should have already returned stale data above, but log for clarity
        console.log('📱 Cache-first architecture: Serving stale data when API fails');
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.getAllAttendees error:', error);
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendee by ID (offline-first)
   */
  async getAttendeeById(id: string): Promise<DatabaseResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      const attendee = cachedData.find(a => a.id === id);
      
      if (attendee) {
        console.log(`📱 Using cached attendee data for ID: ${id}`);
        return {
          data: attendee,
          error: null,
          success: true
        };
      }

      // Fallback to online service
      console.log('🌐 Attendee not in cache, fetching from server...');
      const result = await attendeeService.getAttendeeById(id);
      
      if (result.success && result.data) {
        // Update cache with this single record
        const updatedCache = cachedData.filter(a => a.id !== id);
        updatedCache.push(result.data);
        await pwaDataSyncService.cacheTableData(this.tableName, updatedCache);
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.getAttendeeById error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendee by access code (offline-first)
   */
  async getAttendeeByAccessCode(accessCode: string): Promise<DatabaseResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      const attendee = cachedData.find(a => a.access_code === accessCode);
      
      if (attendee) {
        console.log(`📱 Using cached attendee data for access code: ${accessCode}`);
        return {
          data: attendee,
          error: null,
          success: true
        };
      }

      // Fallback to online service
      console.log('🌐 Attendee not in cache, fetching from server...');
      const result = await attendeeService.getAttendeeByAccessCode(accessCode);
      
      if (result.success && result.data) {
        // Update cache with this single record
        const updatedCache = cachedData.filter(a => a.id !== result.data!.id);
        updatedCache.push(result.data);
        await pwaDataSyncService.cacheTableData(this.tableName, updatedCache);
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.getAttendeeByAccessCode error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Search attendees (offline-first)
   */
  async searchAttendees(query: string): Promise<PaginatedResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      
      if (cachedData.length > 0) {
        console.log(`📱 Searching cached attendees data (${cachedData.length} records)`);
        
        const filteredData = cachedData.filter(attendee => 
          attendee.first_name.toLowerCase().includes(query.toLowerCase()) ||
          attendee.last_name.toLowerCase().includes(query.toLowerCase()) ||
          attendee.company.toLowerCase().includes(query.toLowerCase()) ||
          attendee.email.toLowerCase().includes(query.toLowerCase())
        );

        return {
          data: filteredData,
          count: filteredData.length,
          error: null,
          success: true
        };
      }

      // Fallback to online service
      console.log('🌐 No cached data for search, fetching from server...');
      const result = await attendeeService.searchAttendees(query);
      
      if (result.success && result.data.length > 0) {
        // Cache the data for offline use
        await pwaDataSyncService.cacheTableData(this.tableName, result.data);
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.searchAttendees error:', error);
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendees by company (offline-first)
   * Filters by company name AND confirmed registration status
   */
  async getAttendeesByCompany(company: string): Promise<PaginatedResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      
      if (cachedData.length > 0) {
        console.log(`📱 Filtering cached attendees by company: ${company}`);
        
        // Apply both company and confirmed registration status filters
        const filteredData = cachedData.filter(attendee => 
          attendee.company.toLowerCase() === company.toLowerCase() &&
          attendee.registration_status === 'confirmed'
        );

        return {
          data: filteredData,
          count: filteredData.length,
          error: null,
          success: true
        };
      }

      // Fallback to online service
      console.log('🌐 No cached data for company filter, fetching from server...');
      const result = await attendeeService.getAttendeesByCompany(company);
      
      if (result.success && result.data.length > 0) {
        // Apply confirmed attendee filter to server data as well
        const filteredServerData = result.data.filter(attendee => 
          attendee.registration_status === 'confirmed'
        );
        
        // Cache the filtered data
        await pwaDataSyncService.cacheTableData(this.tableName, filteredServerData);
        
        return {
          data: filteredServerData,
          count: filteredServerData.length,
          error: null,
          success: true
        };
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.getAttendeesByCompany error:', error);
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendees by breakout selection (offline-first)
   */
  async getAttendeesByBreakout(breakoutId: string): Promise<PaginatedResponse<Attendee>> {
    try {
      // Try to get from cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      
      if (cachedData.length > 0) {
        console.log(`📱 Filtering cached attendees by breakout: ${breakoutId}`);
        
        const filteredData = cachedData.filter(attendee => 
          attendee.selected_breakouts.includes(breakoutId)
        );

        return {
          data: filteredData,
          count: filteredData.length,
          error: null,
          success: true
        };
      }

      // Fallback to online service
      console.log('🌐 No cached data for breakout filter, fetching from server...');
      const result = await attendeeService.getAttendeesByBreakout(breakoutId);
      
      if (result.success && result.data.length > 0) {
        // Cache the data for offline use
        await pwaDataSyncService.cacheTableData(this.tableName, result.data);
      }
      
      return result;

    } catch (error) {
      console.error('❌ OfflineAttendeeService.getAttendeesByBreakout error:', error);
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Validate access code format
   */
  validateAccessCode(accessCode: string): boolean {
    return attendeeService.validateAccessCode(accessCode);
  }

  /**
   * Get offline data status
   */
  async getOfflineStatus(): Promise<{ hasData: boolean; recordCount: number; lastSync: string | null }> {
    try {
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>(this.tableName);
      const syncStatus = pwaDataSyncService.getSyncStatus();
      
      return {
        hasData: cachedData.length > 0,
        recordCount: cachedData.length,
        lastSync: syncStatus.lastSync
      };
    } catch (error) {
      console.error('❌ Failed to get offline status:', error);
      return {
        hasData: false,
        recordCount: 0,
        lastSync: null
      };
    }
  }

  /**
   * Force sync attendees data
   */
  async forceSync(): Promise<boolean> {
    try {
      console.log('🔄 Force syncing attendees data...');
      const result = await pwaDataSyncService.forceSync();
      return result.success && result.syncedTables.includes(this.tableName);
    } catch (error) {
      console.error('❌ Failed to force sync attendees:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineAttendeeService = new OfflineAttendeeService();
