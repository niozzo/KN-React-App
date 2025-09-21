// Application Database Service
import { createClient } from '@supabase/supabase-js';
import { BaseService } from './baseService.js';

const APPLICATION_DB_URL = import.meta.env.VITE_APPLICATION_DB_URL;
const APPLICATION_DB_ANON_KEY = import.meta.env.VITE_APPLICATION_DB_ANON_KEY;
const APPLICATION_DB_SERVICE_KEY = import.meta.env.VITE_APPLICATION_DB_SERVICE_KEY;

if (!APPLICATION_DB_URL || !APPLICATION_DB_ANON_KEY) {
  throw new Error('Missing application database environment variables');
}

// Application Database Service Class
class ApplicationDatabaseService extends BaseService {
  private applicationDb: any = null;
  private adminDb: any = null;

  constructor() {
    super();
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
    return this.applicationDb;
  }

  getAdminClient() {
    return this.adminDb;
  }

  // Speaker Assignment Methods
  async getSpeakerAssignments(agendaItemId: string): Promise<SpeakerAssignment[]> {
    const { data, error } = await this.applicationDb
      .from('speaker_assignments')
      .select('*')
      .eq('agenda_item_id', agendaItemId)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async assignSpeaker(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    // Get the next display_order value for this agenda item
    const { data: existingAssignments } = await this.adminDb
      .from('speaker_assignments')
      .select('display_order')
      .eq('agenda_item_id', agendaItemId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const nextOrder = existingAssignments && existingAssignments.length > 0 
      ? (existingAssignments[0].display_order || 0) + 1 
      : 1;

    const { data, error } = await this.adminDb
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
    const { error } = await this.adminDb
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
    
    const { error } = await this.adminDb
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
    const { error } = await this.adminDb
      .from('agenda_item_metadata')
      .upsert({
        id: agendaItem.id,
        title: agendaItem.title,
        start_time: agendaItem.start_time,
        end_time: agendaItem.end_time,
        last_synced: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  async syncAttendeeMetadata(attendee: any): Promise<void> {
    const { error } = await this.adminDb
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
    // Sync agenda items
    for (const item of agendaItems) {
      await this.syncAgendaItemMetadata(item);
    }
    
    // Sync attendees
    for (const attendee of attendees) {
      await this.syncAttendeeMetadata(attendee);
    }
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
  last_synced: string;
}

export interface AttendeeMetadata {
  id: string;
  name: string;
  email?: string;
  last_synced: string;
}

