/**
 * Breakout Mapping Service
 * Handles attendee breakout session assignments
 */

export const breakoutMappingService = {
  /**
   * Check if an attendee is assigned to a breakout session
   * @param {Object} session - Session data
   * @param {Object} attendee - Attendee data
   * @returns {boolean} - True if attendee is assigned to breakout
   */
  isAttendeeAssignedToBreakout(session, attendee) {
    // Simple implementation: check if attendee has selected_breakouts
    if (!attendee || !attendee.selected_breakouts) {
      return false;
    }
    
    // Check if session title matches any of the attendee's selected breakouts
    const sessionTitle = session.title?.toLowerCase() || '';
    const selectedBreakouts = attendee.selected_breakouts || [];
    
    return selectedBreakouts.some(breakout => 
      breakout.toLowerCase().includes(sessionTitle) || 
      sessionTitle.includes(breakout.toLowerCase())
    );
  }
};
