import { supabaseClientService } from './supabaseClientService';
import { serverDataSyncService } from './serverDataSyncService';
import { BaseService } from './baseService';
import { logger } from '../utils/logger';

/**
 * Timestamp-Based Cache Service
 * 
 * CRITICAL: READ-ONLY operations only
 * - Uses SELECT queries to check timestamps
 * - Never writes to database
 * - Only updates localStorage cache
 */
export class TimestampCacheService extends BaseService {
  private readonly TIMESTAMP_KEY_PREFIX = 'kn_last_sync_';
  
  private readonly tablesToMonitor = [
    'attendees',
    'agenda_items',
    'dining_options',
    'seat_assignments',
    'seating_configurations',
    'standardized_companies',
    'company_aliases'
  ];

  // Track sync statistics for monitoring
  private syncStats = {
    totalChecks: 0,
    tablesChanged: 0,
    tablesSkipped: 0,
    totalSyncTime: 0,
    errors: 0
  };

  /**
   * Check if a table has changed since last sync
   * READ-ONLY: Uses SELECT with .gte() filter
   */
  async hasTableChanged(tableName: string): Promise<boolean> {
    try {
      const lastSyncTimestamp = this.getLastSyncTimestamp(tableName);
      
      if (!lastSyncTimestamp) {
        logger.debug(`No last sync timestamp for ${tableName}, needs sync`, null, 'TimestampCacheService');
        return true; // First sync
      }
      
      // READ-ONLY: Query for records updated since last sync
      const supabase = supabaseClientService.getClient();
      const { data, error } = await supabase
        .from(tableName)
        .select('updated_at')
        .gte('updated_at', lastSyncTimestamp)
        .neq('updated_at', lastSyncTimestamp)
        .limit(1);
      
      if (error) {
        logger.error(`Failed to check ${tableName} timestamp`, error, 'TimestampCacheService');
        return true; // Sync on error to be safe
      }
      
      const hasChanged = data && data.length > 0;
      logger.debug(`${tableName} changed: ${hasChanged}`, null, 'TimestampCacheService');
      
      return hasChanged;
      
    } catch (error) {
      logger.error(`Error checking ${tableName} timestamp`, error, 'TimestampCacheService');
      return true; // Sync on error
    }
  }

  /**
   * Sync only tables that have changed
   * MAINTAINS: All existing data processing pipeline
   */
  async syncChangedTables(): Promise<{
    success: boolean;
    syncedTables: string[];
    skippedTables: string[];
    errors: string[];
  }> {
    const startTime = performance.now();
    const result = {
      success: true,
      syncedTables: [] as string[],
      skippedTables: [] as string[],
      errors: [] as string[]
    };
    
    logger.progress('Checking for changed tables', null, 'TimestampCacheService');
    
    for (const tableName of this.tablesToMonitor) {
      try {
        const hasChanged = await this.hasTableChanged(tableName);
        
        if (hasChanged) {
          logger.progress(`Syncing changed table: ${tableName}`, null, 'TimestampCacheService');
          
          // Use existing serverDataSyncService.syncTable() to maintain ALL processing:
          // - Transformations (applyTransformations)
          // - Company normalization
          // - Privacy filtering
          // - Business rules
          await serverDataSyncService.syncTable(tableName);
          
          // Update timestamp after successful sync
          this.updateLastSyncTimestamp(tableName);
          
          result.syncedTables.push(tableName);
          logger.success(`Synced ${tableName}`, null, 'TimestampCacheService');
        } else {
          result.skippedTables.push(tableName);
          logger.debug(`Skipped ${tableName} (no changes)`, null, 'TimestampCacheService');
        }
        
      } catch (error) {
        const errorMsg = `Failed to sync ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg, error, 'TimestampCacheService');
        result.errors.push(errorMsg);
        this.syncStats.errors++;
      }
    }
    
    if (result.errors.length > 0) {
      result.success = false;
    }
    
    // Update sync statistics
    this.syncStats.totalChecks++;
    this.syncStats.tablesChanged += result.syncedTables.length;
    this.syncStats.tablesSkipped += result.skippedTables.length;
    this.syncStats.totalSyncTime += performance.now() - startTime;
    
    // Log sync statistics for monitoring
    this.logSyncStats(result);
    
    return result;
  }

  /**
   * Get last sync timestamp for a table (from localStorage)
   */
  private getLastSyncTimestamp(tableName: string): string | null {
    try {
      const key = `${this.TIMESTAMP_KEY_PREFIX}${tableName}`;
      return localStorage.getItem(key);
    } catch (error) {
      logger.warn(`Failed to get last sync timestamp for ${tableName}`, error, 'TimestampCacheService');
      return null;
    }
  }

  /**
   * Update last sync timestamp for a table (in localStorage)
   */
  private updateLastSyncTimestamp(tableName: string): void {
    try {
      const key = `${this.TIMESTAMP_KEY_PREFIX}${tableName}`;
      const timestamp = new Date().toISOString();
      localStorage.setItem(key, timestamp);
      logger.debug(`Updated last sync timestamp for ${tableName}: ${timestamp}`, null, 'TimestampCacheService');
    } catch (error) {
      logger.warn(`Failed to update last sync timestamp for ${tableName}`, error, 'TimestampCacheService');
    }
  }

  /**
   * Clear all timestamp tracking (for logout or force refresh)
   */
  clearAllTimestamps(): void {
    try {
      for (const tableName of this.tablesToMonitor) {
        const key = `${this.TIMESTAMP_KEY_PREFIX}${tableName}`;
        localStorage.removeItem(key);
      }
      logger.debug('Cleared all sync timestamps', null, 'TimestampCacheService');
    } catch (error) {
      logger.warn('Failed to clear timestamps', error, 'TimestampCacheService');
    }
  }

  /**
   * Force sync all tables (for manual refresh)
   * Clears timestamps to force full sync
   */
  async forceSyncAll(): Promise<{
    success: boolean;
    syncedTables: string[];
    errors: string[];
  }> {
    logger.progress('Force syncing all tables', null, 'TimestampCacheService');
    
    // Clear timestamps to force sync
    this.clearAllTimestamps();
    
    // Sync all tables
    const result = await this.syncChangedTables();
    
    return {
      success: result.success,
      syncedTables: result.syncedTables,
      errors: result.errors
    };
  }

  /**
   * Log sync statistics for monitoring
   */
  private logSyncStats(result: any): void {
    const efficiency = result.skippedTables.length > 0 
      ? ((result.skippedTables.length / this.tablesToMonitor.length) * 100).toFixed(0)
      : '0';
    
    logger.debug('Sync cycle complete', {
      syncedTables: result.syncedTables,
      skippedTables: result.skippedTables,
      efficiency: `${efficiency}% saved`,
      cumulativeStats: this.syncStats
    }, 'TimestampCacheService');
  }

  /**
   * Get current sync statistics
   */
  getSyncStats() {
    return { ...this.syncStats };
  }
}

export const timestampCacheService = new TimestampCacheService();
