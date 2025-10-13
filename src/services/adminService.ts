import { applicationDatabaseService, SpeakerAssignment } from './applicationDatabaseService';
import { pwaDataSyncService } from './pwaDataSyncService';
import { unifiedCacheService } from './unifiedCacheService';
import { getAllApplicationTables, type ApplicationTableName } from '../config/tableMappings';
import { serviceRegistry } from './ServiceRegistry';
import { SupabaseClientFactory } from './SupabaseClientFactory';

export class AdminService {
  async getAgendaItemsWithAssignments(): Promise<any[]> {
    console.log('🔄 AdminService: Starting getAgendaItemsWithAssignments...');
    
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
    
    console.log('📋 AdminService: Loaded agenda items:', agendaItems.length, 'items');
    
    // Get edited titles from application database metadata
    const agendaItemMetadata = await pwaDataSyncService.getCachedTableData('agenda_item_metadata');
    console.log('📊 AdminService: Loaded agenda item metadata from cache:', agendaItemMetadata.length, 'records');
    
    // Get speaker assignments from local storage first
    const speakerAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
    console.log('👥 AdminService: Loaded speaker assignments from cache:', speakerAssignments.length, 'assignments');
    
    // Debug: Show all agenda item IDs and speaker assignment agenda_item_ids
    console.log('🔍 AdminService: Agenda item IDs:', agendaItems.map((item: any) => item.id));
    console.log('🔍 AdminService: Speaker assignment agenda_item_ids:', speakerAssignments.map((assignment: any) => assignment.agenda_item_id));
    
    // Map assignments to agenda items and override titles with edited versions
    const itemsWithAssignments = agendaItems.map((item: any) => {
      // Find any edited metadata for this agenda item
      const metadata = agendaItemMetadata.find((meta: any) => meta.id === item.id);
      
      // Override title if it was edited in the application database
      const finalTitle = (metadata as any)?.title || item.title;
      
      const assignments = speakerAssignments
        .filter((assignment: any) => assignment.agenda_item_id === item.id)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      
      // Debug logging for this specific agenda item
      console.log(`🔍 AdminService: Processing agenda item "${item.title}" (ID: ${item.id})`);
      console.log(`🔍 AdminService: Found ${assignments.length} speaker assignments for this item`);
      if (assignments.length > 0) {
        console.log(`🔍 AdminService: Speaker assignments:`, assignments);
      }
      
      return {
        ...item,
        title: finalTitle, // Use edited title if available
        speaker_assignments: assignments
      };
    });
    
    return itemsWithAssignments;
  }

  async getDiningOptionsWithMetadata(): Promise<any[]> {
    console.log('🔄 AdminService: Starting getDiningOptionsWithMetadata...');
    
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
    
    console.log('🍽️ AdminService: Loaded dining options:', diningOptions.length, 'items');
    
    // Get edited titles from application database metadata
    const diningItemMetadata = await pwaDataSyncService.getCachedTableData('dining_item_metadata');
    console.log('📊 AdminService: Loaded dining item metadata from cache:', diningItemMetadata.length, 'records');
    
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
    console.log('📋 Emitting agendaMetadataUpdated event');
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
      // Triggering cache invalidation
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
    console.log('🍽️ Emitting diningMetadataUpdated event');
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
    
    console.log('Loaded attendees:', attendees);
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
      console.log('🔐 Admin: Fetching attendees with access codes from database...');
      
      // Use the existing Supabase client (following architecture pattern)
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('attendees')
        .select('id, first_name, last_name, email, access_code')
        .not('access_code', 'is', null)
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching attendees:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} attendees with access codes`);
      
      return data || [];
      
    } catch (error) {
      console.error('❌ getAllAttendeesWithAccessCodes error:', error);
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
      console.log('🔄 Ensuring application database tables are synced for admin panel...');
      
      // Use centralized configuration for application tables
      const applicationTables = getAllApplicationTables();
      
      for (const tableName of applicationTables) {
        try {
          await pwaDataSyncService.syncApplicationTable(tableName);
          
          // Verify the data was cached
          const cachedData = await pwaDataSyncService.getCachedTableData(tableName);
          console.log(`📊 Verified: ${tableName} has ${cachedData.length} records in cache`);
          
        } catch (error) {
          console.error(`❌ Failed to sync application table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }
      
      // Application database sync completed
    } catch (error) {
      console.error('❌ Application database sync failed for admin panel:', error);
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
      console.log('🔄 Reordering speakers for agenda item:', agendaItemId);
      console.log('🔄 Speakers to reorder:', reorderedSpeakers.map(s => ({ id: s.id, name: (s as any).attendee_name || s.attendee_id, currentOrder: s.display_order })));
      
      // Update database with new order
      const speakerOrders = reorderedSpeakers.map((speaker, index) => ({
        id: speaker.id,
        display_order: index + 1
      }));
      
      console.log('🔄 New speaker orders:', speakerOrders);
      
      await applicationDatabaseService.reorderSpeakersForAgendaItem(agendaItemId, speakerOrders);
      
      // Update local cache with new order
      const updatedSpeakers = reorderedSpeakers.map((speaker, index) => ({
        ...speaker,
        display_order: index + 1,
        updated_at: new Date().toISOString()
      }));
      
      await this.updateLocalSpeakerAssignments(updatedSpeakers);
      
      // Speaker reordering completed
      
    } catch (error) {
      console.error('❌ Failed to reorder speakers:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        agendaItemId,
        speakerCount: reorderedSpeakers.length
      });
      throw error;
    }
  }
}

export const adminService = new AdminService();
