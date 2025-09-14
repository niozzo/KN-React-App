/**
 * Server-Side Data Synchronization Service
 * Story 1.3: PWA Polish & Branding
 * 
 * Uses server-side authentication to bypass RLS policies and fetch all data
 * for PWA offline caching. This replicates the spike server approach.
 */

import { createClient } from '@supabase/supabase-js';
import { sanitizeAttendeeForStorage } from '../types/attendee';
import { attendeeInfoService } from './attendeeInfoService';

export interface ServerSyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  totalRecords: number;
}

export class ServerDataSyncService {
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly adminEmail: string;
  private readonly adminPassword: string;
  private authenticatedClient: any = null;
  
  private readonly tableToSync = [
    'attendees',
    'sponsors', 
    'seat_assignments',
    'agenda_items',
    'dining_options',
    'hotels',
    'seating_configurations',
    'user_profiles'
  ];

         constructor() {
           // Get credentials from environment variables
           this.supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iikcgdhztkrexuuqheli.supabase.co';
           this.supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';
           
           // Admin credentials for server-side authentication (using same env vars as spike server)
           this.adminEmail = (import.meta as any).env?.SUPABASE_USER_EMAIL || 'ishan.gammampila@apax.com';
           this.adminPassword = (import.meta as any).env?.SUPABASE_USER_PASSWORD || 'xx8kRx#tn@R?';
         }

  /**
   * Get authenticated Supabase client with admin credentials
   */
  private async getAuthenticatedClient() {
    // Return cached client if already authenticated
    if (this.authenticatedClient) {
      return this.authenticatedClient;
    }
    
    console.log('🔐 Authenticating with Supabase admin credentials...');
    
    const supabaseClient = createClient(this.supabaseUrl, this.supabaseKey);
    
    if (!this.adminEmail || !this.adminPassword) {
      throw new Error('Admin credentials not configured. Please set VITE_SUPABASE_USER_EMAIL and VITE_SUPABASE_USER_PASSWORD');
    }
    
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: this.adminEmail,
      password: this.adminPassword
    });
    
    if (error) {
      console.error('❌ Admin authentication failed:', error.message);
      throw new Error(`Admin authentication failed: ${error.message}`);
    }
    
    console.log('✅ Admin authenticated successfully');
    
    // Cache the authenticated client
    this.authenticatedClient = supabaseClient;
    return supabaseClient;
  }

  /**
   * Sync all tables using server-side authentication
   */
  async syncAllData(): Promise<ServerSyncResult> {
    const result: ServerSyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      totalRecords: 0
    };

    try {
      console.log('🔄 Starting server-side data synchronization...');
      
      const supabaseClient = await this.getAuthenticatedClient();
      
      // Sync each table
      for (const tableName of this.tableToSync) {
        try {
          console.log(`🔄 Syncing ${tableName}...`);
          
          const { data, error } = await supabaseClient
            .from(tableName)
            .select('*');
          
          if (error) {
            console.error(`❌ Failed to sync ${tableName}:`, error.message);
            result.errors.push(`Failed to sync ${tableName}: ${error.message}`);
            continue;
          }
          
          const records = data || [];
          console.log(`✅ ${tableName} synced (${records.length} records)`);
          
          // Cache the data locally
          await this.cacheTableData(tableName, records);
          
          result.syncedTables.push(tableName);
          result.totalRecords += records.length;
          
        } catch (error) {
          const errorMsg = `Failed to sync ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
      
      console.log(`✅ Server-side sync completed: ${result.syncedTables.length} tables, ${result.totalRecords} total records`);
      
    } catch (error) {
      console.error('❌ Server-side sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Cache table data to localStorage
   */
  private async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      const cacheKey = `kn_cache_${tableName}`;
      
      // Sanitize attendees data to remove access_code before caching
      let sanitizedData = data;
      if (tableName === 'attendees') {
        sanitizedData = data.map(attendee => sanitizeAttendeeForStorage(attendee));
        console.log(`🔒 Sanitized ${data.length} attendee records (removed access_code)`);
      }
      
      const cacheData = {
        data: sanitizedData,
        timestamp: Date.now(),
        version: 1,
        source: 'server-sync'
      };

      console.log(`💾 Caching ${tableName} with ${sanitizedData.length} records`);
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cached to localStorage with key: ${cacheKey}`);
      
    } catch (error) {
      console.error(`❌ Failed to cache ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get cached table data
   */
  async getCachedTableData<T>(tableName: string): Promise<T[]> {
    try {
      const cacheKey = `kn_cache_${tableName}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return [];
      }

      const cacheData = JSON.parse(cached);
      return cacheData.data || [];
      
    } catch (error) {
      console.error(`❌ Failed to get cached ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('kn_cache_'));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🗑️ Server sync cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Look up attendee by access code using admin authentication
   */
  async lookupAttendeeByAccessCode(accessCode: string): Promise<{
    success: boolean;
    attendee?: any;
    error?: string;
  }> {
    try {
      console.log('🔍 Looking up attendee with admin authentication...');
      
      // Validate access code format (6-character alphanumeric)
      if (!accessCode || !/^[A-Za-z0-9]{6}$/.test(accessCode)) {
        return {
          success: false,
          error: 'Invalid access code format. Must be 6 alphanumeric characters.'
        };
      }
      
      const supabaseClient = await this.getAuthenticatedClient();
      
      const { data, error } = await supabaseClient
        .from('attendees')
        .select('*')
        .eq('access_code', accessCode);
      
      if (error) {
        console.error('❌ Attendee lookup failed:', error.message);
        return {
          success: false,
          error: 'Invalid access code. Please check and try again.'
        };
      }
      
      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Access code not found. Please check and try again.'
        };
      }
      
      if (data.length > 1) {
        console.warn('⚠️ Multiple attendees found with same access code, using first one');
      }
      
      const attendee = data[0];
      
      // Extract attendee information before returning (for easy access)
      try {
        const attendeeInfo = attendeeInfoService.extractAttendeeInfo(attendee);
        attendeeInfoService.storeAttendeeInfo(attendeeInfo);
        console.log('✅ Attendee info extracted and cached:', attendeeInfo.full_name);
      } catch (error) {
        console.warn('⚠️ Failed to extract attendee info:', error);
        // Continue with authentication even if info extraction fails
      }
      
      console.log('✅ Attendee found:', `${attendee.first_name} ${attendee.last_name}`);
      return {
        success: true,
        attendee: attendee
      };
      
    } catch (error) {
      console.error('❌ Attendee lookup error:', error);
      return {
        success: false,
        error: 'Attendee lookup failed. Please try again.'
      };
    }
  }

  /**
   * Debug method to check what data is cached
   */
  async debugCachedData(): Promise<void> {
    console.log('🔍 Debugging server-synced cached data...');
    
    for (const tableName of this.tableToSync) {
      try {
        const data = await this.getCachedTableData(tableName);
        console.log(`📊 ${tableName}: ${data.length} records cached`);
        if (data.length > 0) {
          console.log(`📊 ${tableName} sample record:`, data[0]);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: Error getting cached data`, error);
      }
    }
  }
}

// Export singleton instance
export const serverDataSyncService = new ServerDataSyncService();
