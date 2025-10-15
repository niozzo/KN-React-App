/**
 * Attendee Data Synchronization Service
 * 
 * Handles synchronization of attendee personalization data to ensure
 * conference_auth localStorage stays current during periodic refreshes.
 * 
 * This service addresses the issue where attendee data becomes stale,
 * breaking personalization for the "Now Next" card.
 */

import { BaseService } from './baseService';
import { getCurrentAttendeeData } from './dataService';
import { sanitizeAttendeeForStorage } from '../types/attendee';
import { logger } from '../utils/logger';
import type { Attendee, SanitizedAttendee } from '../types/attendee';

export interface AttendeeSyncResult {
  success: boolean;
  attendee?: Attendee;
  error?: string;
  lastSync?: Date;
  syncVersion?: string;
}

export class AttendeeSyncError extends Error {
  public originalError?: Error;
  
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'AttendeeSyncError';
    this.originalError = originalError;
  }
}

export class AttendeeSyncService extends BaseService {
  private readonly AUTH_KEY = 'conference_auth';
  private readonly SYNC_VERSION_KEY = 'attendee_sync_version';
  
  /**
   * Refresh attendee data from source and update conference_auth
   */
  async refreshAttendeeData(forceRefresh: boolean = false): Promise<AttendeeSyncResult> {
    try {
      logger.progress(`Starting attendee data refresh${forceRefresh ? ' (force refresh)' : ''}`, null, 'AttendeeSyncService');
      
      // Force refresh: Clear attendee cache before fetching fresh data
      if (forceRefresh) {
        logger.debug('Force refresh: Clearing attendee cache', null, 'AttendeeSyncService');
        localStorage.removeItem('kn_cache_attendees');
        // Don't clear conference_auth - it contains authentication data
        logger.debug('Attendee cache cleared, fetching fresh data from database', null, 'AttendeeSyncService');
      }
      
      const freshAttendeeData = await getCurrentAttendeeData();
      if (!freshAttendeeData) {
        return {
          success: false,
          error: 'No attendee data available'
        };
      }

      // Apply confidential data filtering before updating conference_auth
      const { AttendeeCacheFilterService } = await import('./attendeeCacheFilterService');
      const filteredAttendeeData = AttendeeCacheFilterService.filterConfidentialFields(freshAttendeeData);
      logger.debug('Applied confidential data filtering to attendee refresh', null, 'AttendeeSyncService');

      // Update conference_auth with filtered data
      await this.updateConferenceAuth(filteredAttendeeData);
      
      // Emit change event for reactive updates
      this.emitAttendeeDataUpdated(freshAttendeeData);
      
      logger.success('Attendee data refreshed successfully', null, 'AttendeeSyncService');
      
      return {
        success: true,
        attendee: freshAttendeeData,
        lastSync: new Date(),
        syncVersion: this.getSyncVersion()
      };
      
    } catch (error) {
      logger.error('Failed to refresh attendee data', error, 'AttendeeSyncService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update conference_auth with fresh attendee data
   */
  private async updateConferenceAuth(attendeeData: Attendee): Promise<void> {
    try {
      const currentAuth = this.getCurrentAuth();
      const updatedAuth = {
        ...currentAuth,
        attendee: attendeeData, // Data is already filtered by caller
        lastUpdated: Date.now(),
        syncVersion: this.getSyncVersion(),
        attendeeDataVersion: attendeeData.updated_at || Date.now()
      };
      
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(updatedAuth));
      
      // Update sync version tracking
      this.updateSyncVersion();
      
    } catch (error) {
      throw new AttendeeSyncError('Failed to update conference_auth', error);
    }
  }

  /**
   * Get current attendee data from conference_auth
   */
  getCurrentAttendeeFromAuth(): Attendee | null {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      if (!authData) return null;
      
      const auth = JSON.parse(authData);
      return auth.attendee || null;
    } catch (error) {
      logger.warn('Failed to parse conference_auth', error, 'AttendeeSyncService');
      return null;
    }
  }

  /**
   * Check if attendee data needs refresh based on TTL
   */
  shouldRefreshAttendeeData(ttlMinutes: number = 30): boolean {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      if (!authData) return true;
      
      const auth = JSON.parse(authData);
      const lastUpdated = auth.lastUpdated || 0;
      const ttlMs = ttlMinutes * 60 * 1000;
      
      return (Date.now() - lastUpdated) > ttlMs;
    } catch (error) {
      logger.warn('Failed to check attendee data TTL', error, 'AttendeeSyncService');
      return true;
    }
  }

  /**
   * Get current authentication data
   */
  private getCurrentAuth(): any {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      return authData ? JSON.parse(authData) : {};
    } catch (error) {
      logger.warn('Failed to parse current auth data', error, 'AttendeeSyncService');
      return {};
    }
  }

  /**
   * Get current sync version
   */
  private getSyncVersion(): string {
    return localStorage.getItem(this.SYNC_VERSION_KEY) || '1.0.0';
  }

  /**
   * Update sync version
   */
  private updateSyncVersion(): void {
    const currentVersion = this.getSyncVersion();
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    localStorage.setItem(this.SYNC_VERSION_KEY, newVersion);
  }

  /**
   * Emit attendee data updated event
   */
  private emitAttendeeDataUpdated(attendeeData: Attendee): void {
    const event = new CustomEvent('attendee-data-updated', {
      detail: {
        attendee: attendeeData,
        timestamp: Date.now(),
        syncVersion: this.getSyncVersion()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear sync state (for logout)
   */
  clearSyncState(): void {
    try {
      localStorage.removeItem(this.SYNC_VERSION_KEY);
      logger.debug('Attendee sync state cleared', null, 'AttendeeSyncService');
    } catch (error) {
      logger.warn('Failed to clear sync state', error, 'AttendeeSyncService');
    }
  }
}

// Export singleton instance
export const attendeeSyncService = new AttendeeSyncService();
