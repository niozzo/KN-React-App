/**
 * Speaker Data Service
 * Handles speaker data fetching and enrichment from agenda_item_speakers + attendees join
 * Replaces deprecated speaker_assignments functionality
 */

import { pwaDataSyncService } from './pwaDataSyncService';
import { AgendaItemSpeaker } from '../types/database';

export interface EnrichedSpeaker {
  id: string;
  speaker_order: number;
  attendee_id: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string; // Raw company name (for backward compatibility)
  company_standardized?: string; // Standardized company name (preferred)
  bio?: string;
  photo?: string;
}

export class SpeakerDataService {
  /**
   * Get speakers for an agenda item with enriched attendee data
   */
  async getSpeakersForAgendaItem(agendaItemId: string): Promise<EnrichedSpeaker[]> {
    try {
      // 1. Get agenda_item_speakers from cache
      const speakerLinks = await pwaDataSyncService.getCachedTableData('agenda_item_speakers');
      
      // 2. Get attendees from cache
      const attendees = await pwaDataSyncService.getCachedTableData('attendees');
      
      // 3. Filter for this agenda item
      const itemSpeakers = speakerLinks.filter((s: AgendaItemSpeaker) => s.agenda_item_id === agendaItemId);
      
      // 4. Join with attendee data and sort by speaker_order
      return itemSpeakers
        .map((speaker: AgendaItemSpeaker) => {
          const attendee = attendees.find((a: any) => a.id === speaker.attendee_id);
        return {
          id: speaker.id,
          speaker_order: speaker.speaker_order,
          attendee_id: speaker.attendee_id,
          first_name: attendee?.first_name,
          last_name: attendee?.last_name,
          title: attendee?.title,
          company: attendee?.company, // Raw company name (for backward compatibility)
          company_standardized: attendee?.company_name_standardized, // Standardized company name (preferred)
          bio: attendee?.bio,
          photo: attendee?.photo
        };
        })
        .sort((a, b) => a.speaker_order - b.speaker_order);
    } catch (error) {
      console.error('Error fetching speakers for agenda item:', error);
      return [];
    }
  }

  /**
   * Get all speakers for multiple agenda items (batch operation)
   */
  async getSpeakersForAgendaItems(agendaItemIds: string[]): Promise<Map<string, EnrichedSpeaker[]>> {
    const result = new Map<string, EnrichedSpeaker[]>();
    
    for (const agendaItemId of agendaItemIds) {
      const speakers = await this.getSpeakersForAgendaItem(agendaItemId);
      result.set(agendaItemId, speakers);
    }
    
    return result;
  }
}

// Export singleton instance
export const speakerDataService = new SpeakerDataService();
