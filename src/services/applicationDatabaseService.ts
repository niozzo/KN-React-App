// Application Database Service
import { createClient } from '@supabase/supabase-js';
import { BaseService } from './baseService.ts';
import { serviceRegistry } from './ServiceRegistry.ts';
import type { AttendeePreferences } from '../types/preferences';

const APPLICATION_DB_URL = import.meta.env.VITE_APPLICATION_DB_URL;
const APPLICATION_DB_ANON_KEY = import.meta.env.VITE_APPLICATION_DB_ANON_KEY;
const APPLICATION_DB_SERVICE_KEY = import.meta.env.VITE_APPLICATION_DB_SERVICE_KEY;


if (!APPLICATION_DB_URL || !APPLICATION_DB_ANON_KEY) {
  console.error('❌ Missing application database environment variables');
  console.error('❌ APPLICATION_DB_URL:', APPLICATION_DB_URL);
  console.error('❌ APPLICATION_DB_ANON_KEY:', APPLICATION_DB_ANON_KEY);
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
      console.warn('⚠️ Application database environment variables not configured');
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
          console.error(`❌ ${operationName} failed after ${attempt} attempts:`, error);
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  // Speaker Assignment Methods
  async getSpeakerAssignments(agendaItemId: string): Promise<SpeakerAssignment[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('speaker_assignments')
      .select('*')
      .eq('agenda_item_id', agendaItemId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async assignSpeaker(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    const adminClient = this.getAdminClient();
    
    // Get the next display_order value for this agenda item
    const { data: existingAssignments } = await adminClient
      .from('speaker_assignments')
      .select('display_order')
      .eq('agenda_item_id', agendaItemId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const nextOrder = existingAssignments && existingAssignments.length > 0 
      ? (existingAssignments[0].display_order || 0) + 1 
      : 1;

    const { data, error } = await adminClient
      .from('speaker_assignments')
      .insert({
        agenda_item_id: agendaItemId,
        attendee_id: attendeeId,
        role,
        display_order: nextOrder
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async removeSpeakerAssignment(assignmentId: string): Promise<void> {
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('speaker_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (error) throw error;
  }

  /**
   * Update speaker display order
   */
  async updateSpeakerOrder(speakerId: string, displayOrder: number): Promise<void> {
    console.log(`🔄 Updating speaker ${speakerId} to order ${displayOrder}`);
    
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('speaker_assignments')
      .update({ 
        display_order: displayOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', speakerId);
    
    if (error) {
      console.error(`❌ Failed to update speaker ${speakerId} order:`, error);
      throw error;
    }
    
    console.log(`✅ Updated speaker ${speakerId} to order ${displayOrder}`);
  }

  /**
   * Reorder all speakers for an agenda item
   */
  async reorderSpeakersForAgendaItem(
    agendaItemId: string,
    speakerOrders: { id: string; display_order: number }[]
  ): Promise<void> {
    // Update each speaker's display_order
    for (const speakerOrder of speakerOrders) {
      await this.updateSpeakerOrder(speakerOrder.id, speakerOrder.display_order);
    }
  }

  // Metadata Management Methods
  async syncAgendaItemMetadata(agendaItem: any): Promise<void> {
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('agenda_item_metadata')
      .upsert({
        id: agendaItem.id,
        title: agendaItem.title,
        start_time: agendaItem.start_time,
        end_time: agendaItem.end_time,
        time_override_enabled: agendaItem.time_override_enabled || false,
        last_synced: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  async updateAgendaItemTimes(
    agendaItemId: string, 
    startTime: string, 
    endTime: string, 
    enabled: boolean,
    title?: string
  ): Promise<void> {
    const adminClient = this.getAdminClient();
    
    // Convert time strings (HH:MM) to timestamp format for database
    const convertTimeToTimestamp = (timeStr: string): string => {
      if (!timeStr) return '';
      
      // If it's already a full timestamp, return as-is
      if (timeStr.includes('T') || timeStr.includes(' ')) {
        return timeStr;
      }
      
      // Convert HH:MM to HH:MM:SS format
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr; return timeStr.padStart(5, "0") + ":00";
    };
    
    const startTimestamp = convertTimeToTimestamp(startTime);
    const endTimestamp = convertTimeToTimestamp(endTime);
    
    console.log('🕐 Storing time overrides (time-only approach):', {
      original: { startTime, endTime },
      normalized: { startTimestamp, endTimestamp }
    });
    
    const { error } = await adminClient
      .from('agenda_item_metadata')
      .upsert({
        id: agendaItemId,
        title: title || 'Session', // Provide default title if not provided
        start_time: startTimestamp,
        end_time: endTimestamp,
        time_override_enabled: enabled,
        last_synced: new Date().toISOString()
      });
    
    if (error) throw error;

    // Emit cache invalidation events for time override updates
    this.emitTimeOverrideUpdatedEvent(agendaItemId, startTime, endTime, enabled);
  }

  /**
   * Emit time override updated event for cache invalidation
   */
  private emitTimeOverrideUpdatedEvent(
    agendaItemId: string, 
    startTime: string, 
    endTime: string, 
    enabled: boolean
  ): void {
    try {
      // Emit custom event for time override updates
      const event = new CustomEvent('agendaTimeOverrideUpdated', {
        detail: {
          agendaItemId,
          startTime,
          endTime,
          enabled,
          timestamp: new Date().toISOString()
        }
      });
      
      window.dispatchEvent(event);
      
      // Also trigger cache invalidation through service registry
      serviceRegistry.invalidateCache('agenda_items');
      serviceRegistry.invalidateCache('agenda_item_metadata');
      
      console.log(`🔄 Time override event emitted for agenda item: ${agendaItemId}`);
    } catch (error) {
      console.error('❌ Failed to emit time override event:', error);
    }
  }

  async getAgendaItemTimeOverrides(): Promise<AgendaItemMetadata[]> {
    return this.retryOperation(
      async () => {
        const client = this.getClient();
        const { data, error } = await client
          .from('agenda_item_metadata')
          .select('*')
          .eq('time_override_enabled', true);
        
        if (error) throw error;
    
    // Convert timestamps back to time format for UI consumption
    const convertTimeForUI = (timeStr: string): string => {
      
      // If HH:MM:SS format, convert to HH:MM for UI
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr.substring(0, 5); // Remove :SS part
      }
      
      // If already HH:MM format, return as-is
      return timeStr;    };
    
    const processedData = (data || []).map(item => ({
      ...item,
      start_time: convertTimeForUI(item.start_time || ''),
      end_time: convertTimeForUI(item.end_time || '')
    }));
    
        console.log('🕐 Retrieved time overrides from database:', processedData);
        return processedData;
      },
      'getAgendaItemTimeOverrides'
    );
  }

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

  async syncDiningItemMetadata(diningItem: any): Promise<void> {
    const adminClient = this.getAdminClient();
    const { error } = await adminClient
      .from('dining_item_metadata')
      .upsert({
        id: diningItem.id,
        title: diningItem.title,
        date: diningItem.date,
        time: diningItem.time,
        last_synced: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  // Bulk Operations
  async syncAllMetadata(agendaItems: any[], attendees: any[]): Promise<void> {
    // Sync agenda items
    for (const item of agendaItems) {
      await this.syncAgendaItemMetadata(item);
    }
    
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
    const client = this.getClient();
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
console.log('Service role key available:', !!APPLICATION_DB_SERVICE_KEY);
console.log('Using admin client for writes:', adminDb !== applicationDb);
console.log('Environment variables:', {
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

export interface AgendaItemMetadata {
  id: string;
  title: string;
  start_time?: string;
  end_time?: string;
  time_override_enabled?: boolean;
  last_synced: string;
}

export interface AttendeeMetadata {
  id: string;
  name: string;
  email?: string;
  last_synced: string;
}


