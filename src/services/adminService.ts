import { applicationDbService, SpeakerAssignment } from './applicationDatabaseService';
import { pwaDataSyncService } from './pwaDataSyncService';

export class AdminService {
  async getAgendaItemsWithAssignments(): Promise<any[]> {
    // Get agenda items from local storage - check both possible keys
    let agendaItems = [];
    
    // Try kn_cache_agenda_items first (your current structure)
    const cachedData = localStorage.getItem('kn_cache_agenda_items');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        agendaItems = parsed.data || parsed || [];
      } catch (error) {
        console.error('Error parsing kn_cache_agenda_items:', error);
      }
    }
    
    // Fallback to agendaItems if kn_cache_agenda_items is empty
    if (agendaItems.length === 0) {
      agendaItems = JSON.parse(localStorage.getItem('agendaItems') || '[]');
    }
    
    console.log('Loaded agenda items:', agendaItems);
    
    // Get speaker assignments from local storage first
    const speakerAssignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
    console.log('Loaded speaker assignments from cache:', speakerAssignments);
    
    // Map assignments to agenda items
    const itemsWithAssignments = agendaItems.map((item: any) => {
      const assignments = speakerAssignments
        .filter((assignment: any) => assignment.agenda_item_id === item.id)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      return {
        ...item,
        speaker_assignments: assignments
      };
    });
    
    return itemsWithAssignments;
  }

  async updateAgendaItemTitle(agendaItemId: string, newTitle: string): Promise<void> {
    // Update in application database metadata
    try {
      await applicationDbService.syncAgendaItemMetadata({
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
  }

  async assignSpeakerToAgendaItem(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    // Create assignment object
    const assignment: SpeakerAssignment = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agenda_item_id: agendaItemId,
      attendee_id: attendeeId,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      // Try to save to database first
      const dbAssignment = await applicationDbService.assignSpeaker(agendaItemId, attendeeId, role);
      
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
      await applicationDbService.removeSpeakerAssignment(assignmentId);
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

  // Validation methods
  validatePasscode(passcode: string): boolean {
    return passcode === '616161';
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
        const existingIndex = updatedAssignments.findIndex(a => a.id === newAssignment.id);
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
      const updatedAssignments = existingAssignments.filter(a => a.id !== assignmentId);
      
      // Update cache
      await pwaDataSyncService.cacheTableData('speaker_assignments', updatedAssignments);
    } catch (error) {
      console.error('Failed to remove local speaker assignment:', error);
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
      console.log('🔄 Speakers to reorder:', reorderedSpeakers.map(s => ({ id: s.id, name: s.attendee_name || s.attendee_id, currentOrder: s.display_order })));
      
      // Update database with new order
      const speakerOrders = reorderedSpeakers.map((speaker, index) => ({
        id: speaker.id,
        display_order: index + 1
      }));
      
      console.log('🔄 New speaker orders:', speakerOrders);
      
      await applicationDbService.reorderSpeakersForAgendaItem(agendaItemId, speakerOrders);
      
      // Update local cache with new order
      const updatedSpeakers = reorderedSpeakers.map((speaker, index) => ({
        ...speaker,
        display_order: index + 1,
        updated_at: new Date().toISOString()
      }));
      
      await this.updateLocalSpeakerAssignments(updatedSpeakers);
      
      console.log('✅ Speaker reordering completed successfully');
      
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
