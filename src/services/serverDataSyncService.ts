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
import { logger } from '../utils/logger';

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
    // 'sponsors' removed - DEPRECATED, using standardized_companies instead
    'standardized_companies', // NEW: Source of truth for sponsors
    'company_aliases', // NEW: Company name aliases for normalization
    'seat_assignments',
    'agenda_items',
    'agenda_item_speakers', // NEW: Speaker assignments from main DB
    'dining_options',
    'hotels',
    'seating_configurations'
    // 'user_profiles' removed - table is unused (see login-cache-optimization-findings.md)
  ];

  // Application database tables (from separate Supabase project)
  private readonly applicationTablesToSync = [
    // 'speaker_assignments' removed - DEPRECATED, migrated to main DB agenda_item_speakers
    'agenda_item_metadata', 
    // 'attendee_metadata' removed - no read operations found (see login-cache-optimization-findings.md)
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
      records = agendaTransformer.filterActiveAgendaItems(records); // Filter before caching
      records = agendaTransformer.sortAgendaItems(records);
    }
    
    // Attendees transformation - filter company for specific edge cases
    if (tableName === 'attendees') {
      const { AttendeeTransformer } = await import('../transformers/attendeeTransformer.js');
      const attendeeTransformer = new AttendeeTransformer();
      
      // Edge case: These speakers were assigned "Apax" in the main DB but 
      // don't have a company affiliation. Clear company to prevent display.
      const ATTENDEES_WITHOUT_COMPANY = [
        'de8cb880-e6f5-425d-9267-1eb0a2817f6b',
        '21d75c80-9560-4e4c-86f0-9345ddb705a1'
      ];
      
      records = records.map(attendee => {
        if (ATTENDEES_WITHOUT_COMPANY.includes(attendee.id)) {
          return { ...attendee, company: '' };
        }
        return attendee;
      });
      
      // ✅ NEW: Use centralized AttendeeDataProcessor for consistent filtering
      const { AttendeeDataProcessor } = await import('./attendeeDataProcessor');
      const processingResult = await AttendeeDataProcessor.processAttendeeData(records);
      
      if (!processingResult.success) {
        logger.error('Failed to process attendee data in server sync', processingResult.errors, 'ServerDataSyncService');
        throw new Error(`Attendee data processing failed: ${processingResult.errors.join(', ')}`);
      }
      
      records = processingResult.data;
      logger.debug(`Applied centralized data processing: ${processingResult.originalCount} → ${processingResult.filteredCount} attendees`, null, 'ServerDataSyncService');
    }
    
    // Standardized companies transformation - use centralized transformer
    if (tableName === 'standardized_companies') {
      const { StandardizedCompanyTransformer } = await import('../transformers/standardizedCompanyTransformer.js');
      const companyTransformer = new StandardizedCompanyTransformer();
      records = companyTransformer.filterForCache(records);
      logger.debug(`Filtered confidential fields and fixed URLs for ${records.length} standardized companies`, null, 'ServerDataSyncService');
    }
    
    // Dining options transformation
    if (tableName === 'dining_options') {
      const { DiningTransformer } = await import('../transformers/diningTransformer.js');
      const diningTransformer = new DiningTransformer();
      records = diningTransformer.transformArrayFromDatabase(records);
      // 🔧 FIX: Don't filter out inactive dining options - they may have seat assignments
      // records = diningTransformer.filterActiveDiningOptions(records);
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
      logger.error('Admin authentication failed', error.message, 'ServerDataSyncService');
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
            logger.error(`Failed to sync ${tableName}`, error.message, 'ServerDataSyncService');
            result.errors.push(`Failed to sync ${tableName}: ${error.message}`);
            continue;
          }
          
          let records = data || [];
          
          // Debug logging removed - these diagnostic messages are not needed in production
          
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
      // Using admin authentication for attendee lookup
      
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
      
      console.log(`🔍 [MAIN-DB-SINGLE-SYNC] Query to MAIN database table: ${tableName}`);
      
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*');
      
      if (error) {
        throw new Error(`Failed to sync ${tableName}: ${error.message}`);
      }
      
      let records = data || [];
      
      console.log(`📊 [MAIN-DB-SINGLE-SYNC] Results from MAIN DB table "${tableName}":`, {
        table: tableName,
        recordCount: records.length,
        allFieldsInFirstRecord: records.length > 0 ? Object.keys(records[0]) : [],
        sampleRecord: records.length > 0 ? records[0] : null
      });
      
      // Debug logging removed - these diagnostic messages are not needed in production
      
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
    // Debug method - removed console logging
    
    for (const tableName of this.tableToSync) {
      try {
        const data = await this.getCachedTableData(tableName);
        // Debug data available - no console logging needed
      } catch (error) {
        // Debug error - no console logging needed
      }
    }
  }
}

// Export singleton instance
export const serverDataSyncService = new ServerDataSyncService();
