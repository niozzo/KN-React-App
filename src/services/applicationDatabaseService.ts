// Application Database Service
import { createClient } from '@supabase/supabase-js';
import { BaseService } from './baseService.ts';
import { serviceRegistry } from './ServiceRegistry.ts';
import { logger } from '../utils/logger';
import type { AttendeePreferences } from '../types/preferences';

const APPLICATION_DB_URL = import.meta.env.VITE_APPLICATION_DB_URL;
const APPLICATION_DB_ANON_KEY = import.meta.env.VITE_APPLICATION_DB_ANON_KEY;
const APPLICATION_DB_SERVICE_KEY = import.meta.env.VITE_APPLICATION_DB_SERVICE_KEY;


if (!APPLICATION_DB_URL || !APPLICATION_DB_ANON_KEY) {
  logger.critical('Missing application database environment variables', {
    APPLICATION_DB_URL: !!APPLICATION_DB_URL,
    APPLICATION_DB_ANON_KEY: !!APPLICATION_DB_ANON_KEY
  }, 'ApplicationDatabaseService');
  throw new Error('Missing application database environment variables');
}

// Application Database Service Class
class ApplicationDatabaseService extends BaseService {
  private applicationDb: any = null;
  private adminDb: any = null;

  constructor() {
    super('ApplicationDatabaseService');
    this.initializeClients();
  }

  private initializeClients(): void {
    if (!APPLICATION_DB_URL || !APPLICATION_DB_ANON_KEY) {
      logger.warn('Application database environment variables not configured', null, 'ApplicationDatabaseService');
      return;
    }

    // Use anon key for read operations
    this.applicationDb = createClient(APPLICATION_DB_URL, APPLICATION_DB_ANON_KEY);

    // Use service role key for admin operations (if available)
    this.adminDb = APPLICATION_DB_SERVICE_KEY 
      ? createClient(APPLICATION_DB_URL, APPLICATION_DB_SERVICE_KEY)
      : this.applicationDb; // Fallback to anon key if service key not available
  }

  getClient() {
    // Use service registry for consistent client management
    return serviceRegistry.getApplicationDbClient();
  }

  getAdminClient() {
    // Use service registry for consistent client management
    return serviceRegistry.getAdminDbClient();
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const isNetworkError = error.message?.includes('fetch') || 
                              error.code === 'ECONNRESET' ||
                              error.message?.includes('ERR_CONNECTION_CLOSED');
        
        if (isLastAttempt || !isNetworkError) {
          logger.error(`${operationName} failed after ${attempt} attempts`, error, 'ApplicationDatabaseService');
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`, null, 'ApplicationDatabaseService');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  // DEPRECATED: Speaker Assignment Methods - Migrated to main DB agenda_item_speakers
  // These methods are deprecated and will be removed in a future version.
  // Use speakerDataService.getSpeakersForAgendaItem() instead.
  
  /**
   * @deprecated Use speakerDataService.getSpeakersForAgendaItem() instead
   */
  async getSpeakerAssignments(agendaItemId: string): Promise<SpeakerAssignment[]> {
    console.warn('⚠️ DEPRECATED: getSpeakerAssignments() is deprecated. Use speakerDataService.getSpeakersForAgendaItem() instead.');
    return [];
  }

  /**
   * @deprecated Speaker assignments are now managed in the main database
   */
  async assignSpeaker(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    throw new Error('Speaker assignments are now managed in the main database. This method is deprecated.');
  }

  /**
   * @deprecated Speaker assignments are now managed in the main database
   */
  async removeSpeakerAssignment(assignmentId: string): Promise<void> {
    throw new Error('Speaker assignments are now managed in the main database. This method is deprecated.');
  }

  /**
   * @deprecated Speaker assignments are now managed in the main database
   */
  async updateSpeakerOrder(speakerId: string, displayOrder: number): Promise<void> {
    throw new Error('Speaker assignments are now managed in the main database. This method is deprecated.');
  }

  /**
   * @deprecated Speaker assignments are now managed in the main database
   */
  async reorderSpeakersForAgendaItem(
    agendaItemId: string,
    speakerOrders: { id: string; display_order: number }[]
  ): Promise<void> {
    throw new Error('Speaker assignments are now managed in the main database. This method is deprecated.');
  }

  // Metadata Management Methods



  async syncAttendeeMetadata(attendee: any): Promise<void> {
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('attendee_metadata')
      .upsert({
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        last_synced: new Date().toISOString()
      });
    
    if (error) throw error;
  }


  // Bulk Operations
  async syncAllMetadata(agendaItems: any[], attendees: any[]): Promise<void> {
    // Sync attendees
    for (const attendee of attendees) {
      await this.syncAttendeeMetadata(attendee);
    }
  }

  // Implement abstract methods from BaseService
  async initialize(): Promise<void> {
    // Initialization is handled in constructor
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    // Cleanup resources if needed
    this.applicationDb = null;
    this.adminDb = null;
    this.isInitialized = false;
  }

  // Attendee Preferences Management Methods
  async getAllAttendeePreferences(): Promise<AttendeePreferences[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('attendee_preferences')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getAttendeePreferences(attendeeId: string): Promise<AttendeePreferences | null> {
    const client = this.getAdminClient();
    const { data, error } = await client
      .from('attendee_preferences')
      .select('*')
      .eq('id', attendeeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || { id: attendeeId, profile_visible: true }; // Default to visible
  }

  async updateProfileVisibility(attendeeId: string, isVisible: boolean): Promise<void> {
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('attendee_preferences')
      .upsert({
        id: attendeeId,
        profile_visible: isVisible,
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    this.emitPreferencesUpdatedEvent(attendeeId, isVisible);
  }

  private emitPreferencesUpdatedEvent(attendeeId: string, isVisible: boolean): void {
    // Clear the hidden profiles cache in AttendeeCacheFilterService
    import('./attendeeCacheFilterService').then(({ AttendeeCacheFilterService }) => {
      AttendeeCacheFilterService.clearHiddenProfilesCache();
    });
    
    window.dispatchEvent(new CustomEvent('attendeePreferencesUpdated', {
      detail: { attendeeId, profile_visible: isVisible }
    }));
  }

}

// Export singleton instance
export const applicationDatabaseService = new ApplicationDatabaseService();

// Legacy exports for backward compatibility
export const applicationDb = applicationDatabaseService.getClient();
export const adminDb = applicationDatabaseService.getAdminClient();

// Debug logging
logger.debug('Service role key available', !!APPLICATION_DB_SERVICE_KEY, 'ApplicationDatabaseService');
logger.debug('Using admin client for writes', adminDb !== applicationDb, 'ApplicationDatabaseService');
logger.debug('Environment variables', {
  hasUrl: !!APPLICATION_DB_URL,
  hasAnonKey: !!APPLICATION_DB_ANON_KEY,
  hasServiceKey: !!APPLICATION_DB_SERVICE_KEY,
  serviceKeyLength: APPLICATION_DB_SERVICE_KEY?.length || 0
});

export interface SpeakerAssignment {
  id: string;
  agenda_item_id: string;
  attendee_id: string;
  role: 'presenter' | 'co-presenter' | 'moderator' | 'panelist';
  display_order: number; // NEW: Order within agenda item (1, 2, 3, etc.)
  created_at: string;
  updated_at: string;
}


export interface AttendeeMetadata {
  id: string;
  name: string;
  email?: string;
  last_synced: string;
}



