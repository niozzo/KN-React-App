import { applicationDatabaseService, SpeakerAssignment } from './applicationDatabaseService';
import { pwaDataSyncService } from './pwaDataSyncService';
import { unifiedCacheService } from './unifiedCacheService';
import { getAllApplicationTables, type ApplicationTableName } from '../config/tableMappings';
import { serviceRegistry } from './ServiceRegistry';
import { SupabaseClientFactory } from './SupabaseClientFactory';

export class AdminService {
  async getAgendaItemsWithAssignments(): Promise<any[]> {
    // Ensure application database tables are synced first
    await this.ensureApplicationDatabaseSynced();
    
    // Get agenda items from unified cache service
    let agendaItems = [];
    
    try {
      // Try kn_cache_agenda_items first (current structure)
      const cachedData = await unifiedCacheService.get('kn_cache_agenda_items');
      if (cachedData) {
        agendaItems = (cachedData as any).data || cachedData || [];
      }
      
      // Fallback to legacy agendaItems if kn_cache_agenda_items is empty
      if (agendaItems.length === 0) {
        const legacyData = await unifiedCacheService.get('agendaItems');
        if (legacyData) {
          agendaItems = (legacyData as any).data || legacyData || [];
        }
      }
    } catch (error) {
      console.error('Error loading agenda items from unified cache:', error);
    }
    
    // Get edited titles from application database metadata
    const agendaItemMetadata = await pwaDataSyncService.getCachedTableData('agenda_item_metadata');
    
    // Get speaker data from new main DB table
    const agendaItemSpeakers = await pwaDataSyncService.getCachedTableData('agenda_item_speakers');
    const attendees = await pwaDataSyncService.getCachedTableData('attendees');
    
    // Map assignments to agenda items and override titles with edited versions
    const itemsWithAssignments = agendaItems.map((item: any) => {
      // Find any edited metadata for this agenda item
      const metadata = agendaItemMetadata.find((meta: any) => meta.id === item.id);
      
      // Override title if it was edited in the application database
      const finalTitle = (metadata as any)?.title || item.title;
      
      // Create attendee lookup map
      const attendeeMap = new Map();
      attendees.forEach((attendee: any) => {
        attendeeMap.set(attendee.id, attendee);
      });
      
      const speakers = agendaItemSpeakers
        .filter((speaker: any) => speaker.agenda_item_id === item.id)
        .sort((a: any, b: any) => (a.speaker_order || 0) - (b.speaker_order || 0))
        .map((speaker: any) => {
          const attendee = attendeeMap.get(speaker.attendee_id);
          return {
            id: speaker.id,
            attendee_id: speaker.attendee_id,
            speaker_order: speaker.speaker_order,
            first_name: attendee?.first_name,
            last_name: attendee?.last_name,
            title: attendee?.title,
            company: attendee?.company
          };
        });
      
      return {
        ...item,
        title: finalTitle, // Use edited title if available
        speakers: speakers // Use new speakers data structure
      };
    });
    
    return itemsWithAssignments;
  }

  async getDiningOptionsWithMetadata(): Promise<any[]> {
    // Ensure application database tables are synced first
    await this.ensureApplicationDatabaseSynced();
    
    // Get dining options from unified cache service
    let diningOptions = [];
    
    try {
      // Try kn_cache_dining_options first (current structure)
      const cachedData = await unifiedCacheService.get('kn_cache_dining_options');
      if (cachedData) {
        diningOptions = (cachedData as any).data || cachedData || [];
      }
      
      // Fallback to legacy diningOptions if kn_cache_dining_options is empty
      if (diningOptions.length === 0) {
        const legacyData = await unifiedCacheService.get('diningOptions');
        if (legacyData) {
          diningOptions = (legacyData as any).data || legacyData || [];
        }
      }
    } catch (error) {
      console.error('Error loading dining options from unified cache:', error);
    }
    
    // Get edited titles from application database metadata
    const diningItemMetadata = await pwaDataSyncService.getCachedTableData('dining_item_metadata');
    
    // Map metadata to dining options and override titles with edited versions
    const optionsWithMetadata = diningOptions.map((option: any) => {
      // Find any edited metadata for this dining option
      const metadata = diningItemMetadata.find((meta: any) => meta.id === option.id);
      
      // Override title if it was edited in the application database
      const finalTitle = (metadata as any)?.title || option.name;
      
      return {
        ...option,
        name: finalTitle, // Use edited title if available
        original_name: option.name // Keep original for reference
      };
    });
    
    return optionsWithMetadata;
  }

  async updateAgendaItemTitle(agendaItemId: string, newTitle: string): Promise<void> {
    // Update in application database metadata
    try {
      await applicationDatabaseService.syncAgendaItemMetadata({
        id: agendaItemId,
        title: newTitle
      });
    } catch (error) {
      console.warn('Database sync failed, updating local storage only:', error);
      // Continue with local storage update even if database fails
    }
    
    // Update local storage - check both possible keys
    const cachedData = localStorage.getItem('kn_cache_agenda_items');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const agendaItems = parsed.data || parsed || [];
        const updatedItems = agendaItems.map((item: any) => 
          item.id === agendaItemId ? { ...item, title: newTitle } : item
        );
        
        // Update the cached structure
        const updatedCache = {
          ...parsed,
          data: updatedItems
        };
        localStorage.setItem('kn_cache_agenda_items', JSON.stringify(updatedCache));
      } catch (error) {
        console.error('Error updating kn_cache_agenda_items:', error);
      }
    } else {
      // Fallback to agendaItems
      const agendaItems = JSON.parse(localStorage.getItem('agendaItems') || '[]');
      const updatedItems = agendaItems.map((item: any) => 
        item.id === agendaItemId ? { ...item, title: newTitle } : item
      );
      localStorage.setItem('agendaItems', JSON.stringify(updatedItems));
    }

    // Emit custom event to notify components of agenda metadata update
    window.dispatchEvent(new CustomEvent('agendaMetadataUpdated', {
      detail: { agendaItemId, newTitle }
    }));
  }

  async updateDiningOptionTitle(diningOptionId: string, newTitle: string): Promise<void> {
    // Update in application database metadata
    try {
      await applicationDatabaseService.syncDiningItemMetadata({
        id: diningOptionId,
        title: newTitle
      });
      
      // Trigger cache invalidation for dining metadata
      serviceRegistry.invalidateCache('dining_item_metadata');
      
    } catch (error) {
      console.warn('Database sync failed, updating local storage only:', error);
      // Continue with local storage update even if database fails
    }
    
    // Update local storage - check both possible keys
    const cachedData = localStorage.getItem('kn_cache_dining_options');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const diningOptions = parsed.data || parsed || [];
        const updatedOptions = diningOptions.map((option: any) => 
          option.id === diningOptionId ? { ...option, name: newTitle } : option
        );
        
        // Update the cached structure
        const updatedCache = {
          ...parsed,
          data: updatedOptions
        };
        localStorage.setItem('kn_cache_dining_options', JSON.stringify(updatedCache));
      } catch (error) {
        console.error('Error updating kn_cache_dining_options:', error);
      }
    } else {
      // Fallback to diningOptions
      const diningOptions = JSON.parse(localStorage.getItem('diningOptions') || '[]');
      const updatedOptions = diningOptions.map((option: any) => 
        option.id === diningOptionId ? { ...option, name: newTitle } : option
      );
      localStorage.setItem('diningOptions', JSON.stringify(updatedOptions));
    }

    // Emit custom event to notify components of dining metadata update
    window.dispatchEvent(new CustomEvent('diningMetadataUpdated', {
      detail: { diningOptionId, newTitle }
    }));
  }

  async assignSpeakerToAgendaItem(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    // Create assignment object
    const assignment: SpeakerAssignment = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agenda_item_id: agendaItemId,
      attendee_id: attendeeId,
      role: role as 'presenter' | 'co-presenter' | 'moderator' | 'panelist',
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      // Try to save to database first
      const dbAssignment = await applicationDatabaseService.assignSpeaker(agendaItemId, attendeeId, role);
      
      // Update local cache with database assignment (which has real ID)
      await this.updateLocalSpeakerAssignments([dbAssignment]);
      
      return dbAssignment;
    } catch (error) {
      console.warn('Database assignment failed, using local assignment:', error);
      
      // Save to local storage
      await this.updateLocalSpeakerAssignments([assignment]);
      
      return assignment;
    }
  }

  async removeSpeakerFromAgendaItem(assignmentId: string): Promise<void> {
    try {
      // Try to remove from database first
      await applicationDatabaseService.removeSpeakerAssignment(assignmentId);
    } catch (error) {
      console.warn('Database removal failed, continuing with local removal:', error);
    }
    
    // Always remove from local storage
    await this.removeLocalSpeakerAssignment(assignmentId);
  }

  async getAvailableAttendees(): Promise<any[]> {
    // Get attendees from local storage - check both possible keys
    let attendees = [];
    
    // Try kn_cache_attendees first (your current structure)
    const cachedData = localStorage.getItem('kn_cache_attendees');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        attendees = parsed.data || parsed || [];
      } catch (error) {
        console.error('Error parsing kn_cache_attendees:', error);
      }
    }
    
    // Fallback to attendees if kn_cache_attendees is empty
    if (attendees.length === 0) {
      attendees = JSON.parse(localStorage.getItem('attendees') || '[]');
    }
    
    return attendees;
  }

  async getAllAttendeesWithAccessCodes(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    access_code: string;
  }>> {
    try {
      // ADMIN-ONLY: Fetch directly from Supabase to get access codes
      // Note: access_code is filtered from cached data for security,
      // so we must fetch from database for admin functions
      
      // Use the existing Supabase client (following architecture pattern)
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('attendees')
        .select('id, first_name, last_name, email, access_code')
        .not('access_code', 'is', null)
        .order('last_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getAllAttendeesWithAccessCodes:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  // Validation methods
  validatePasscode(passcode: string): boolean {
    return passcode === 'da1sy';
  }

  validateTitle(title: string): boolean {
    return title.trim().length > 0;
  }

  validateAssignmentCount(assignments: SpeakerAssignment[]): boolean {
    return assignments.length >= 0 && assignments.length <= 10;
  }

  validateAttendeeExists(attendeeId: string, attendees: any[]): boolean {
    return attendees.some(attendee => attendee.id === attendeeId);
  }

  /**
   * Update local speaker assignments cache
   */
  private async updateLocalSpeakerAssignments(newAssignments: SpeakerAssignment[]): Promise<void> {
    try {
      const existingAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
      
      // Merge new assignments with existing ones
      const updatedAssignments = [...existingAssignments];
      
      for (const newAssignment of newAssignments) {
        const existingIndex = updatedAssignments.findIndex((a: any) => a.id === newAssignment.id);
        if (existingIndex >= 0) {
          updatedAssignments[existingIndex] = newAssignment;
        } else {
          updatedAssignments.push(newAssignment);
        }
      }
      
      // Update cache
      await pwaDataSyncService.cacheTableData('speaker_assignments', updatedAssignments);
    } catch (error) {
      console.error('Failed to update local speaker assignments:', error);
    }
  }

  /**
   * Remove speaker assignment from local cache
   */
  private async removeLocalSpeakerAssignment(assignmentId: string): Promise<void> {
    try {
      const existingAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
      const updatedAssignments = existingAssignments.filter((a: any) => a.id !== assignmentId);
      
      // Update cache
      await pwaDataSyncService.cacheTableData('speaker_assignments', updatedAssignments);
    } catch (error) {
      console.error('Failed to remove local speaker assignment:', error);
    }
  }

  /**
   * Ensure application database tables are synced
   */
  private async ensureApplicationDatabaseSynced(): Promise<void> {
    try {
      // Use centralized configuration for application tables
      const applicationTables = getAllApplicationTables();
      
      for (const tableName of applicationTables) {
        try {
          await pwaDataSyncService.syncApplicationTable(tableName);
        } catch (error) {
          console.error(`Failed to sync application table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }
    } catch (error) {
      console.error('Application database sync failed:', error);
      // Don't throw error as this is not critical for basic functionality
    }
  }

  /**
   * Reorder speakers for an agenda item
   */
  async reorderSpeakers(
    agendaItemId: string, 
    reorderedSpeakers: SpeakerAssignment[]
  ): Promise<void> {
    try {
      // Update database with new order
      const speakerOrders = reorderedSpeakers.map((speaker, index) => ({
        id: speaker.id,
        display_order: index + 1
      }));
      
      await applicationDatabaseService.reorderSpeakersForAgendaItem(agendaItemId, speakerOrders);
      
      // Update local cache with new order
      const updatedSpeakers = reorderedSpeakers.map((speaker, index) => ({
        ...speaker,
        display_order: index + 1,
        updated_at: new Date().toISOString()
      }));
      
      await this.updateLocalSpeakerAssignments(updatedSpeakers);
      
    } catch (error) {
      console.error('Failed to reorder speakers:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();