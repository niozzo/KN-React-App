import { applicationDbService, SpeakerAssignment } from './applicationDatabaseService';

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
    
    // Get speaker assignments for each item
    const itemsWithAssignments = await Promise.all(
      agendaItems.map(async (item: any) => {
        try {
          const assignments = await applicationDbService.getSpeakerAssignments(item.id);
          return {
            ...item,
            speaker_assignments: assignments
          };
        } catch (error) {
          console.warn(`Database assignments failed for agenda item ${item.id}, using empty array:`, error);
          return {
            ...item,
            speaker_assignments: []
          };
        }
      })
    );
    
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
    try {
      return await applicationDbService.assignSpeaker(agendaItemId, attendeeId, role);
    } catch (error) {
      console.warn('Database assignment failed, using local assignment:', error);
      // Return a mock assignment for local storage only
      return {
        id: `local-${Date.now()}`,
        agenda_item_id: agendaItemId,
        attendee_id: attendeeId,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async removeSpeakerFromAgendaItem(assignmentId: string): Promise<void> {
    try {
      await applicationDbService.removeSpeakerAssignment(assignmentId);
    } catch (error) {
      console.warn('Database removal failed, continuing with local removal:', error);
      // Continue with local removal
    }
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
}

export const adminService = new AdminService();
