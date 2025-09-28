/**
 * Breakout Mapping Service
 * Story 2.2.1: Breakout Session Filtering
 * 
 * Handles mapping between attendee breakout selections and agenda items
 * using key phrase matching (Track A, Track B, CEO)
 */

import type { AgendaItem } from '../types/agenda';
import type { Attendee } from '../types/attendee';

export class BreakoutMappingService {
  private mappingConfig = {
    keyPhrases: ['Track A', 'Track B', 'CEO'],
    caseInsensitive: true
  };

  /**
   * Check if an attendee is assigned to a specific breakout session
   * @param session - The agenda item to check
   * @param attendee - The attendee with selected_breakouts
   * @returns true if attendee is assigned to this breakout session
   */
  isAttendeeAssignedToBreakout(session: AgendaItem, attendee: Attendee): boolean {
    if (!attendee.selected_breakouts || attendee.selected_breakouts.length === 0) {
      return false;
    }

    // Get first breakout (as per requirements - AC 3)
    const attendeeBreakout = attendee.selected_breakouts[0];
    
    // Match using key phrases
    return this.matchBreakoutToSession(attendeeBreakout, session);
  }

  /**
   * Match attendee breakout selection to session using key phrases
   * @param attendeeBreakout - The attendee's breakout selection
   * @param session - The session to match against
   * @returns true if there's a match
   */
  private matchBreakoutToSession(attendeeBreakout: string, session: AgendaItem): boolean {
    const sessionTitle = session.title.toLowerCase();
    const attendeeBreakoutLower = attendeeBreakout.toLowerCase();
    
    // First, try exact title matching (most reliable)
    if (sessionTitle === attendeeBreakoutLower) {
      return true;
    }
    
    // Then try key phrase matching for partial matches
    for (const phrase of this.mappingConfig.keyPhrases) {
      const phraseLower = phrase.toLowerCase();
      // Both session title and attendee breakout must contain the key phrase
      if (sessionTitle.includes(phraseLower) && 
          attendeeBreakoutLower.includes(phraseLower)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the mapping configuration for external access
   * @returns The current mapping configuration
   */
  getMappingConfig() {
    return { ...this.mappingConfig };
  }
}

// Export singleton instance
export const breakoutMappingService = new BreakoutMappingService();
