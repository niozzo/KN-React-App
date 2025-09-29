/**
 * Breakout Mapping Service
 * Story 2.2.1: Breakout Session Filtering
 * 
 * Handles mapping between attendee breakout selections and agenda items
 * using key phrase matching (Track A, Track B, CEO)
 */

import type { AgendaItem } from '../types/agenda';
import type { Attendee } from '../types/attendee';
import { 
  getBreakoutMappingConfig,
  type BreakoutMappingConfig
} from '../config/breakoutMappingConfig';

export class BreakoutMappingService {
  private mappingConfig: BreakoutMappingConfig;

  constructor() {
    this.mappingConfig = getBreakoutMappingConfig();
  }

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
    const result = this.matchBreakoutToSession(attendeeBreakout, session);
    
    return result;
  }

  /**
   * Match attendee breakout selection to session using simple business rules
   * @param attendeeBreakout - The attendee's breakout selection
   * @param session - The session to match against
   * @returns true if there's a match
   */
  private matchBreakoutToSession(attendeeBreakout: string, session: AgendaItem): boolean {
    const sessionTitle = session.title.toLowerCase();
    const attendeeBreakoutLower = attendeeBreakout.toLowerCase();
    
    // Normalize both strings to handle variations like "Track-b", "Track B", "track b"
    const normalizedAttendee = this.normalizeTrackNames(attendeeBreakoutLower);
    const normalizedSession = this.normalizeTrackNames(sessionTitle);
    
    // Simple business rules:
    // 1. If database contains "Track A" -> map to agenda session containing "Track A"
    // 2. If database contains "Track B" -> map to agenda session containing "Track B"  
    // 3. If database contains "CEO" -> map to agenda session containing "CEO"
    
    if (normalizedAttendee.includes('track a') && normalizedSession.includes('track a')) {
      console.log('🎯 Track A match:', { attendeeBreakout, sessionTitle, normalizedAttendee, normalizedSession });
      return true;
    }
    
    if (normalizedAttendee.includes('track b') && normalizedSession.includes('track b')) {
      console.log('🎯 Track B match:', { attendeeBreakout, sessionTitle, normalizedAttendee, normalizedSession });
      return true;
    }
    
    if (attendeeBreakoutLower.includes('ceo') && sessionTitle.includes('ceo')) {
      console.log('🎯 CEO match:', { attendeeBreakout, sessionTitle });
      return true;
    }
    
    console.log('❌ No match found:', { attendeeBreakout, sessionTitle, normalizedAttendee, normalizedSession });
    return false;
  }

  /**
   * Normalize track names to handle variations like "Track-b", "Track B", "track b"
   * @param text - Text to normalize
   * @returns Normalized text with consistent track naming
   */
  private normalizeTrackNames(text: string): string {
    return text
      .replace(/track\s*-\s*a/gi, 'track a')  // "Track-A", "Track -A", "track-a" -> "track a"
      .replace(/track\s*-\s*b/gi, 'track b')  // "Track-B", "Track -B", "track-b" -> "track b"
      .replace(/\s+/g, ' ');                   // Normalize multiple spaces to single space
  }


  /**
   * Get the mapping configuration for external access
   * @returns The current mapping configuration
   */
  getMappingConfig(): BreakoutMappingConfig {
    return { ...this.mappingConfig };
  }


  /**
   * Update configuration (for testing or runtime updates)
   * @param newConfig - New configuration to apply
   */
  updateConfiguration(newConfig: BreakoutMappingConfig): void {
    this.mappingConfig = { ...newConfig };
  }
}

// Export singleton instance
export const breakoutMappingService = new BreakoutMappingService();
