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
    console.log('🔍 BreakoutMappingService Debug:', {
      sessionTitle: session.title,
      sessionType: session.session_type,
      attendeeId: attendee.id,
      selectedBreakouts: attendee.selected_breakouts
    });

    if (!attendee.selected_breakouts || attendee.selected_breakouts.length === 0) {
      console.log('❌ No selected breakouts found');
      return false;
    }

    // Get first breakout (as per requirements - AC 3)
    const attendeeBreakout = attendee.selected_breakouts[0];
    console.log('🎯 Using first breakout:', attendeeBreakout);
    
    // Match using key phrases
    const result = this.matchBreakoutToSession(attendeeBreakout, session);
    console.log('✅ Match result:', result);
    
    return result;
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
    
    console.log('🔍 MatchBreakoutToSession Debug:', {
      originalSessionTitle: session.title,
      sessionTitleLower: sessionTitle,
      attendeeBreakoutOriginal: attendeeBreakout,
      attendeeBreakoutLower: attendeeBreakoutLower
    });
    
    // First, try exact title matching (most reliable)
    if (sessionTitle === attendeeBreakoutLower) {
      console.log('✅ Exact title match found');
      return true;
    }
    
    // Handle the specific format: "track-b-operational-performance" -> "Track B: ..."
    // Extract track identifier from attendee breakout (e.g., "track-b" from "track-b-operational-performance")
    const trackMatch = attendeeBreakoutLower.match(/^(track-[ab]|ceo)/);
    console.log('🔍 Track match regex result:', trackMatch);
    
    if (trackMatch) {
      const trackId = trackMatch[1];
      console.log('🎯 Extracted track ID:', trackId);
      
      // Map track identifiers to session title patterns
      if (trackId === 'track-a' && sessionTitle.includes('track a')) {
        console.log('✅ Track A match found');
        return true;
      }
      if (trackId === 'track-b' && sessionTitle.includes('track b')) {
        console.log('✅ Track B match found');
        return true;
      }
      if (trackId === 'ceo' && sessionTitle.includes('ceo')) {
        console.log('✅ CEO match found');
        return true;
      }
    }
    
    // Then try key phrase matching for partial matches
    console.log('🔍 Trying key phrase matching...');
    for (const phrase of this.mappingConfig.keyPhrases) {
      const phraseLower = phrase.toLowerCase();
      console.log(`🔍 Checking phrase: "${phraseLower}"`);
      console.log(`  - Session title contains "${phraseLower}": ${sessionTitle.includes(phraseLower)}`);
      console.log(`  - Attendee breakout contains "${phraseLower}": ${attendeeBreakoutLower.includes(phraseLower)}`);
      
      // Both session title and attendee breakout must contain the key phrase
      if (sessionTitle.includes(phraseLower) && 
          attendeeBreakoutLower.includes(phraseLower)) {
        console.log(`✅ Key phrase match found for: "${phraseLower}"`);
        return true;
      }
    }
    
    console.log('❌ No match found');
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
