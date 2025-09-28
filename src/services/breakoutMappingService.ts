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
  getBreakoutMappingRules,
  type BreakoutMappingConfig,
  type BreakoutMappingRule 
} from '../config/breakoutMappingConfig';

export class BreakoutMappingService {
  private mappingConfig: BreakoutMappingConfig;
  private mappingRules: BreakoutMappingRule[];

  constructor() {
    this.mappingConfig = getBreakoutMappingConfig();
    this.mappingRules = getBreakoutMappingRules();
  }

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
   * Match attendee breakout selection to session using configuration-based rules
   * @param attendeeBreakout - The attendee's breakout selection
   * @param session - The session to match against
   * @returns true if there's a match
   */
  private matchBreakoutToSession(attendeeBreakout: string, session: AgendaItem): boolean {
    const sessionTitle = this.mappingConfig.caseInsensitive 
      ? session.title.toLowerCase() 
      : session.title;
    const attendeeBreakoutLower = this.mappingConfig.caseInsensitive 
      ? attendeeBreakout.toLowerCase() 
      : attendeeBreakout;
    
    console.log('🔍 MatchBreakoutToSession Debug:', {
      originalSessionTitle: session.title,
      sessionTitleLower: sessionTitle,
      attendeeBreakoutOriginal: attendeeBreakout,
      attendeeBreakoutLower: attendeeBreakoutLower,
      config: this.mappingConfig
    });
    
    // First, try exact title matching if enabled
    if (this.mappingConfig.exactMatchPriority && sessionTitle === attendeeBreakoutLower) {
      console.log('✅ Exact title match found');
      return true;
    }
    
    // Try specific mapping rules (higher priority)
    for (const rule of this.mappingRules) {
      const attendeePattern = this.mappingConfig.caseInsensitive 
        ? rule.attendeePattern.toLowerCase() 
        : rule.attendeePattern;
      const sessionPattern = this.mappingConfig.caseInsensitive 
        ? rule.sessionPattern.toLowerCase() 
        : rule.sessionPattern;
      
      if (attendeeBreakoutLower.includes(attendeePattern) && 
          sessionTitle.includes(sessionPattern)) {
        console.log(`✅ Rule match found: ${rule.description}`);
        return true;
      }
    }
    
    // Then try key phrase matching for partial matches
    console.log('🔍 Trying key phrase matching...');
    for (const phrase of this.mappingConfig.keyPhrases) {
      const phraseLower = this.mappingConfig.caseInsensitive 
        ? phrase.toLowerCase() 
        : phrase;
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
  getMappingConfig(): BreakoutMappingConfig {
    return { ...this.mappingConfig };
  }

  /**
   * Get the mapping rules for external access
   * @returns The current mapping rules
   */
  getMappingRules(): BreakoutMappingRule[] {
    return [...this.mappingRules];
  }

  /**
   * Update configuration (for testing or runtime updates)
   * @param newConfig - New configuration to apply
   */
  updateConfiguration(newConfig: BreakoutMappingConfig): void {
    this.mappingConfig = { ...newConfig };
    console.log('🔄 Breakout mapping configuration updated:', this.mappingConfig);
  }
}

// Export singleton instance
export const breakoutMappingService = new BreakoutMappingService();
