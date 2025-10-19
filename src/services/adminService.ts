import { applicationDatabaseService, SpeakerAssignment } from './applicationDatabaseService';
// Removed pwaDataSyncService import - using simplifiedDataService instead
import { simplifiedDataService } from './simplifiedDataService';
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
      // Use simplified cache service
      const result = await simplifiedDataService.getData('agenda_items');
      if (result.success && result.data) {
        agendaItems = result.data;
      }
    } catch (error) {
      console.error('Error loading agenda items from simplified cache:', error);
    }
    
    // Get edited titles from application database metadata
    const agendaItemMetadataResult = await simplifiedDataService.getData('agenda_item_metadata');
    const agendaItemMetadata = agendaItemMetadataResult.success ? agendaItemMetadataResult.data : [];
    
    // Get speaker data from new main DB table
    const agendaItemSpeakersResult = await simplifiedDataService.getData('agenda_item_speakers');
    const agendaItemSpeakers = agendaItemSpeakersResult.success ? agendaItemSpeakersResult.data : [];
    const attendeesResult = await simplifiedDataService.getData('attendees');
    const attendees = attendeesResult.success ? attendeesResult.data : [];
    
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
            company: attendee?.company, // Raw company name (for backward compatibility)
            company_standardized: attendee?.company_name_standardized // Standardized company name (preferred)
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
      // Use simplified cache service
      const result = await simplifiedDataService.getData('dining_options');
      if (result.success && result.data) {
        diningOptions = result.data;
      }
    } catch (error) {
      console.error('Error loading dining options from simplified cache:', error);
    }
    
    // Use dining options directly from cache
    const optionsWithMetadata = diningOptions;
    
    return optionsWithMetadata;
  }

  async updateAgendaItemTitle(agendaItemId: string, newTitle: string): Promise<void> {
    // Note: Override functionality removed from admin panel
    // This method is kept for backward compatibility but does nothing
    
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
    // Note: Override functionality removed from admin panel
    // This method is kept for backward compatibility but does nothing
    
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

  async getSeatAssignmentsForAttendee(attendeeId: string): Promise<any[]> {
    try {
      // ADMIN-ONLY: Fetch seat assignments directly from Supabase
      const { supabase } = await import('../lib/supabase');
      
      // First, get the basic seat assignments
      const { data: seatAssignments, error: seatError } = await supabase
        .from('seat_assignments')
        .select('*')
        .eq('attendee_id', attendeeId)
        .order('assigned_at', { ascending: true });
      
      console.log('🔍 DEBUG: Seat assignments query result:', {
        attendeeId,
        seatAssignmentsCount: seatAssignments?.length || 0,
        seatAssignments,
        error: seatError
      });
      
      if (seatError) {
        throw seatError;
      }
      
      if (!seatAssignments || seatAssignments.length === 0) {
        console.log('🔍 DEBUG: No seat assignments found for attendee:', attendeeId);
        return [];
      }
      
      // Get seating configurations for these assignments
      const configIds = seatAssignments.map(sa => sa.seating_configuration_id);
      console.log('🔍 DEBUG: Configuration IDs to fetch:', configIds);
      
      const { data: configurations, error: configError } = await supabase
        .from('seating_configurations')
        .select('id, agenda_item_id, dining_option_id')
        .in('id', configIds);
      
      console.log('🔍 DEBUG: Configurations fetched:', {
        configurations,
        error: configError
      });
      
      if (configError) {
        console.warn('Error fetching seating configurations:', configError);
      }
      
      // Get agenda items - try local cache first, then database
      const agendaItemIds = configurations?.map(c => c.agenda_item_id).filter(Boolean) || [];
      let agendaItems = [];
      
      // Try local cache first
      try {
        const cachedData = localStorage.getItem('kn_cache_agenda_items');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cachedAgendaItems = parsed.data || parsed || [];
          agendaItems = cachedAgendaItems.filter(ai => agendaItemIds.includes(ai.id));
          console.log('🔍 DEBUG: Found agenda items in cache:', {
            cachedCount: cachedAgendaItems.length,
            matchingCount: agendaItems.length,
            matchingIds: agendaItems.map(ai => ai.id)
          });
        }
      } catch (error) {
        console.warn('Error reading agenda items from cache:', error);
      }
      
      // If cache didn't have all the items we need, fetch from database
      if (agendaItems.length < agendaItemIds.length) {
        console.log('🔍 DEBUG: Cache incomplete for agenda items, fetching from database...');
        const { data: dbAgendaItems, error: agendaError } = await supabase
          .from('agenda_items')
          .select('id, title, start_time, end_time')
          .in('id', agendaItemIds);
        
        if (agendaError) {
          console.warn('Error fetching agenda items from database:', agendaError);
        } else if (dbAgendaItems) {
          // Merge database results with cache results
          const existingIds = agendaItems.map(ai => ai.id);
          const newItems = dbAgendaItems.filter(ai => !existingIds.includes(ai.id));
          agendaItems = [...agendaItems, ...newItems];
        }
      }
      
      // Get dining options - try local cache first, then database
      const diningOptionIds = configurations?.map(c => c.dining_option_id).filter(Boolean) || [];
      console.log('🔍 DEBUG: Dining option IDs to fetch:', diningOptionIds);
      
      let diningOptions = [];
      
      // Try local cache first
      try {
        const cachedData = localStorage.getItem('kn_cache_dining_options');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const cachedDiningOptions = parsed.data || parsed || [];
            diningOptions = cachedDiningOptions.filter(dining => diningOptionIds.includes(dining.id));
          console.log('🔍 DEBUG: Found dining options in cache:', {
            cachedCount: cachedDiningOptions.length,
            matchingCount: diningOptions.length,
            matchingIds: diningOptions.map(dining => dining.id)
          });
        }
      } catch (error) {
        console.warn('Error reading dining options from cache:', error);
      }
      
      // If cache didn't have all the options we need, fetch from database
      if (diningOptions.length < diningOptionIds.length) {
        console.log('🔍 DEBUG: Cache incomplete, fetching from database...');
        const { data: dbDiningOptions, error: diningError } = await supabase
          .from('dining_options')
          .select('id, name, start_time, end_time')
          .in('id', diningOptionIds);
        
        console.log('🔍 DEBUG: Dining options from database:', {
          dbDiningOptions,
          dbCount: dbDiningOptions?.length || 0,
          error: diningError
        });
        
        if (diningError) {
          console.warn('Error fetching dining options from database:', diningError);
        } else if (dbDiningOptions) {
          // Merge database results with cache results
          const existingIds = diningOptions.map(dining => dining.id);
          const newOptions = dbDiningOptions.filter(dining => !existingIds.includes(dining.id));
          diningOptions = [...diningOptions, ...newOptions];
        }
      }
      
      console.log('🔍 DEBUG: Final dining options:', {
        totalCount: diningOptions.length,
        optionIds: diningOptions.map(dining => dining.id),
        optionNames: diningOptions.map(dining => dining.name)
      });
      
      // Transform the data to include session names
      const transformedData = seatAssignments.map(assignment => {
        const config = configurations?.find(c => c.id === assignment.seating_configuration_id);
        let sessionName = 'Unknown Session';
        let sessionType = 'Unknown';
        let sessionTime = null;
        
        console.log('🔍 DEBUG: Processing assignment:', {
          assignmentId: assignment.id,
          configId: assignment.seating_configuration_id,
          config,
          agendaItemId: config?.agenda_item_id,
          diningOptionId: config?.dining_option_id
        });
        
        if (config?.agenda_item_id) {
          const agendaItem = agendaItems?.find(ai => ai.id === config.agenda_item_id);
          if (agendaItem) {
            sessionName = agendaItem.title;
            sessionType = 'Agenda Item';
            sessionTime = {
              start: agendaItem.start_time,
              end: agendaItem.end_time
            };
          } else {
            console.log('🔍 DEBUG: Agenda item not found:', config.agenda_item_id);
          }
        } else if (config?.dining_option_id) {
          const diningOption = diningOptions?.find(dining => dining.id === config.dining_option_id);
          if (diningOption) {
            sessionName = diningOption.name;
            sessionType = 'Dining Option';
            sessionTime = {
              start: diningOption.start_time,
              end: diningOption.end_time
            };
          } else {
            console.log('🔍 DEBUG: Dining option not found:', config.dining_option_id);
            // Fallback: If we have a dining_option_id but can't find the dining option,
            // it's still a dining session, just with unknown details
            sessionName = `Dining Session (${config.dining_option_id.substring(0, 8)}...)`;
            sessionType = 'Dining Option (Unknown)';
            sessionTime = null;
          }
        } else {
          console.log('🔍 DEBUG: No agenda_item_id or dining_option_id in config:', config);
        }
        
        return {
          ...assignment,
          session_name: sessionName,
          session_type: sessionType,
          session_time: sessionTime,
          agenda_item_id: config?.agenda_item_id,
          dining_option_id: config?.dining_option_id
        };
      });
      
      return transformedData;
      
    } catch (error) {
      console.error('Error in getSeatAssignmentsForAttendee:', error);
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
      // Simplified approach - no local cache updates needed
      // Speaker assignments are handled by the database
      console.log('Speaker assignments updated:', newAssignments.length);
    } catch (error) {
      console.error('Failed to update local speaker assignments:', error);
    }
  }

  /**
   * Remove speaker assignment from local cache
   */
  private async removeLocalSpeakerAssignment(assignmentId: string): Promise<void> {
    try {
      // Simplified approach - no local cache updates needed
      // Speaker assignments are handled by the database
      console.log('Speaker assignment removed:', assignmentId);
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
          // Simplified approach - sync using serverDataSyncService
          const { serverDataSyncService } = await import('./serverDataSyncService');
          await serverDataSyncService.syncTable(tableName);
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