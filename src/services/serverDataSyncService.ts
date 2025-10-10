/**
 * Server-Side Data Synchronization Service
 * Story 1.3: PWA Polish & Branding
 * 
 * Uses server-side authentication to bypass RLS policies and fetch all data
 * for PWA offline caching. This replicates the spike server approach.
 */

import { createClient } from '@supabase/supabase-js';
import { applicationDb } from './applicationDatabaseService.ts';
import { sanitizeAttendeeForStorage } from '../types/attendee.ts';
import { attendeeInfoService } from './attendeeInfoService.ts';
import { BaseService } from './baseService.ts';
import { supabaseClientService } from './supabaseClientService.ts';

export interface ServerSyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  totalRecords: number;
}

export class ServerDataSyncService extends BaseService {
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

  // Application database tables (from separate Supabase project)
  private readonly applicationTablesToSync = [
    'speaker_assignments',
    'agenda_item_metadata', 
    'attendee_metadata',
    'dining_item_metadata'
  ];

  constructor() {
    super();
    // Get credentials from environment variables
    this.supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iikcgdhztkrexuuqheli.supabase.co';
    this.supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';
           
    // Admin credentials for server-side authentication (using same env vars as spike server)
    this.adminEmail = (import.meta as any).env?.SUPABASE_USER_EMAIL || 'ishan.gammampila@apax.com';
    this.adminPassword = (import.meta as any).env?.SUPABASE_USER_PASSWORD || 'xx8kRx#tn@R?';
  }

  /**
   * Apply data transformations and filtering for specific tables
   * @param tableName - Name of table
   * @param records - Raw records from database
   * @returns Transformed and filtered records
   */
  private async applyTransformations(tableName: string, records: any[]): Promise<any[]> {
    // Agenda items transformation
    if (tableName === 'agenda_items') {
      const { AgendaTransformer } = await import('../transformers/agendaTransformer.js');
      const agendaTransformer = new AgendaTransformer();
      records = agendaTransformer.transformArrayFromDatabase(records);
      records = agendaTransformer.sortAgendaItems(records);
    }
    
    // Dining options transformation
    if (tableName === 'dining_options') {
      const { DiningTransformer } = await import('../transformers/diningTransformer.js');
      const diningTransformer = new DiningTransformer();
      records = diningTransformer.transformArrayFromDatabase(records);
      records = diningTransformer.filterActiveDiningOptions(records);
      records = diningTransformer.sortDiningOptions(records);
    }
    
    // Sponsors and hotels filtering/sorting
    if (tableName === 'sponsors' || tableName === 'hotels') {
      records = records
        .filter(r => r.is_active !== false)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    
    return records;
  }

  /**
   * Get authenticated Supabase client with admin credentials
   * Uses singleton service to prevent multiple GoTrueClient instances
   */
  private async getAuthenticatedClient() {
    // Return cached client if already authenticated
    if (this.authenticatedClient) {
      return this.authenticatedClient;
    }
    
    
    // Always use singleton service to prevent multiple instances
    const baseClient = supabaseClientService.getClient();
    
    if (!this.adminEmail || !this.adminPassword) {
      throw new Error('Admin credentials not configured. Please set VITE_SUPABASE_USER_EMAIL and VITE_SUPABASE_USER_PASSWORD');
    }
    
    const { error } = await baseClient.auth.signInWithPassword({
      email: this.adminEmail,
      password: this.adminPassword
    });
    
    if (error) {
      console.error('❌ Admin authentication failed:', error.message);
      throw new Error(`Admin authentication failed: ${error.message}`);
    }
    
    
    // Cache the authenticated client (same instance as base client)
    this.authenticatedClient = baseClient;
    return baseClient;
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
      
      const supabaseClient = await this.getAuthenticatedClient();
      
      // Sync each table
      for (const tableName of this.tableToSync) {
        try {
          
          const { data, error } = await supabaseClient
            .from(tableName)
            .select('*');
          
          if (error) {
            console.error(`❌ Failed to sync ${tableName}:`, error.message);
            result.errors.push(`Failed to sync ${tableName}: ${error.message}`);
            continue;
          }
          
          let records = data || [];
          
          // Apply transformations using shared method
          records = await this.applyTransformations(tableName, records);
          
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
      
      // Sync application database tables
      for (const tableName of this.applicationTablesToSync) {
        try {
          
          const { data, error } = await applicationDb
            .from(tableName)
            .select('*');
          
          if (error) {
            console.error(`❌ Failed to sync application table ${tableName}:`, error.message);
            result.errors.push(`Failed to sync application table ${tableName}: ${error.message}`);
            continue;
          }
          
          const records = data || [];
          
          // Cache the data locally
          await this.cacheTableData(tableName, records);
          
          result.syncedTables.push(tableName);
          result.totalRecords += records.length;
          
        } catch (error) {
          const errorMsg = `Failed to sync application table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
      
      
    } catch (error) {
      console.error('❌ Server-side sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Cache table data using unified cache service
   */
  private async cacheTableData(tableName: string, data: any[]): Promise<void> {
    try {
      const cacheKey = `kn_cache_${tableName}`;
      
      // Apply comprehensive confidential data filtering for attendees
      let sanitizedData = data;
      if (tableName === 'attendees') {
        // Use AttendeeCacheFilterService for comprehensive filtering
        const { AttendeeCacheFilterService } = await import('./attendeeCacheFilterService');
        sanitizedData = AttendeeCacheFilterService.filterAttendeesArray(data);
        console.log(`🔒 Filtered ${data.length} attendee records for cache storage`);
      }

      // Use unified cache service for consistent caching
      const { unifiedCacheService } = await import('./unifiedCacheService');
      await unifiedCacheService.set(cacheKey, sanitizedData);
      
      
    } catch (error) {
      console.error(`❌ Failed to cache ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get cached table data using unified cache service
   */
  async getCachedTableData<T>(tableName: string): Promise<T[]> {
    try {
      const cacheKey = `kn_cache_${tableName}`;
      
      // Use unified cache service for consistent data retrieval
      const { unifiedCacheService } = await import('./unifiedCacheService');
      const cachedData = await unifiedCacheService.get(cacheKey);
      
      if (!cachedData) {
        return [];
      }

      // Handle both direct array format and wrapped format
      const data = cachedData.data || cachedData;
      return Array.isArray(data) ? data : [];
      
    } catch (error) {
      console.error(`❌ Failed to get cached ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Clear all cached data using unified cache service
   */
  async clearCache(): Promise<void> {
    try {
      // Use unified cache service for consistent cache clearing
      const { unifiedCacheService } = await import('./unifiedCacheService');
      await unifiedCacheService.clear();

      console.log('🗑️ Server sync cache cleared using unified cache service');
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
      
      try {
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
        
      } catch (authError) {
        console.warn('⚠️ Admin authentication failed, trying fallback authentication:', authError);
        
        // Fallback: Try with basic Supabase client (without admin auth)
        const basicClient = createClient(this.supabaseUrl, this.supabaseKey);
        
        const { data, error } = await basicClient
          .from('attendees')
          .select('*')
          .eq('access_code', accessCode);
        
        if (error) {
          console.error('❌ Fallback attendee lookup failed:', error.message);
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
        
        const attendee = data[0];
        
        // Extract attendee information before returning (for easy access)
        try {
          const attendeeInfo = attendeeInfoService.extractAttendeeInfo(attendee);
          attendeeInfoService.storeAttendeeInfo(attendeeInfo);
          console.log('✅ Attendee info extracted and cached (fallback):', attendeeInfo.full_name);
        } catch (error) {
          console.warn('⚠️ Failed to extract attendee info (fallback):', error);
          // Continue with authentication even if info extraction fails
        }
        
        console.log('✅ Attendee found (fallback):', `${attendee.first_name} ${attendee.last_name}`);
        return {
          success: true,
          attendee: attendee
        };
      }
      
    } catch (error) {
      console.error('❌ Attendee lookup error:', error);
      return {
        success: false,
        error: 'Attendee lookup failed. Please try again.'
      };
    }
  }

  /**
   * Sync a single table and return the data
   * @param tableName - Name of table to sync
   * @returns Synced and processed data
   */
  async syncTable(tableName: string): Promise<any[]> {
    try {
      const supabaseClient = await this.getAuthenticatedClient();
      
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*');
      
      if (error) {
        throw new Error(`Failed to sync ${tableName}: ${error.message}`);
      }
      
      let records = data || [];
      
      // Apply transformations using shared method
      records = await this.applyTransformations(tableName, records);
      
      // Cache the data (includes filtering for attendees)
      await this.cacheTableData(tableName, records);
      
      return records;
    } catch (error) {
      console.error(`Failed to sync ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Sync attendees table specifically
   */
  async syncAttendees(): Promise<any[]> {
    return this.syncTable('attendees');
  }

  /**
   * Sync dining options table specifically
   */
  async syncDiningOptions(): Promise<any[]> {
    return this.syncTable('dining_options');
  }

  /**
   * Sync sponsors table specifically
   */
  async syncSponsors(): Promise<any[]> {
    return this.syncTable('sponsors');
  }

  /**
   * Sync hotels table specifically
   */
  async syncHotels(): Promise<any[]> {
    return this.syncTable('hotels');
  }

  /**
   * Sync seating configurations table specifically
   */
  async syncSeatingConfigurations(): Promise<any[]> {
    return this.syncTable('seating_configurations');
  }

  /**
   * Sync agenda items table specifically
   */
  async syncAgendaItems(): Promise<any[]> {
    return this.syncTable('agenda_items');
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
