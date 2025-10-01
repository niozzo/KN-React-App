/**
 * Session Utility Functions
 * Provides utility functions for session type detection and handling
 * Story 2.2: Coffee Break Treatment - Enhanced session detection
 */

/**
 * Check if a session is a coffee break
 * Coffee breaks are meal-type sessions containing "Coffee Break" in the title
 * @param {Object} session - Session object to check
 * @returns {boolean} Whether the session is a coffee break
 */
export const isCoffeeBreak = (session) => {
  if (!session || !session.title) {
    return false;
  }

  // Check if it's explicitly a coffee break type
  const isCoffeeBreakType = session.type && session.type.toLowerCase() === 'coffee_break';
  
  // Must be a meal type session OR coffee break type OR have "Coffee Break" in title
  const isMealType = session.session_type === 'meal' || 
                     (session.type && session.type.toLowerCase() === 'meal') ||
                     isCoffeeBreakType;

  // Title must contain "Coffee Break" (case insensitive) - must be exact phrase
  const hasCoffeeBreakInTitle = session.title.toLowerCase().includes('coffee break');

  // Fix: Allow coffee break detection based on title even if session_type is not 'meal'
  return Boolean((isMealType || hasCoffeeBreakInTitle) && hasCoffeeBreakInTitle);
};

/**
 * Check if a session is a meal (breakfast, lunch, dinner, coffee break)
 * @param {Object} session - Session object to check
 * @returns {boolean} Whether the session is a meal
 */
export const isMeal = (session) => {
  if (!session) {
    return false;
  }

  // 🔍 DEBUG: Log isMeal function calls for coffee breaks
  if (session.title && session.title.toLowerCase().includes('coffee break')) {
    console.log('🔍 isMeal Debug for Coffee Break:', {
      session: session,
      checks: {
        hasSession: !!session,
        session_type: session.session_type,
        type: session.type,
        title: session.title,
        isDiningEvent: session.type === 'dining',
        sessionTypeCheck: session.session_type === 'meal',
        typeCheck: session.type && ['breakfast', 'lunch', 'dinner', 'coffee_break', 'meal'].includes(session.type.toLowerCase()),
        titleCheck: session.title && session.title.toLowerCase().includes('coffee break')
      }
    });
  }

  // Check if it's a dining event (from 2.1g.1 integration)
  if (session.type === 'dining') {
    return true;
  }

  // Check session_type first (newer format)
  if (session.session_type) {
    return session.session_type === 'meal';
  }

  // Check type field (legacy format)
  if (session.type) {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'coffee_break', 'meal'];
    return mealTypes.includes(session.type.toLowerCase());
  }

  // Check title for meal indicators (fallback)
  if (session.title) {
    const title = session.title.toLowerCase();
    const mealKeywords = ['breakfast', 'lunch', 'dinner', 'coffee break', 'meal', 'break'];
    return mealKeywords.some(keyword => title.includes(keyword));
  }

  return false;
};

/**
 * Check if a session is a dining event (from dining options integration)
 * @param {Object} session - Session object to check
 * @returns {boolean} Whether the session is a dining event
 */
export const isDiningEvent = (session) => {
  return Boolean(session && session.type === 'dining');
};

/**
 * Get dining event type (breakfast, lunch, dinner, etc.)
 * @param {Object} session - Session object to check
 * @returns {string} Dining event type
 */
export const getDiningEventType = (session) => {
  if (!isDiningEvent(session)) {
    return null;
  }

  const title = session.title || session.name || '';
  const titleLower = title.toLowerCase();

  if (titleLower.includes('breakfast')) return 'breakfast';
  if (titleLower.includes('lunch')) return 'lunch';
  if (titleLower.includes('dinner')) return 'dinner';
  if (titleLower.includes('coffee')) return 'coffee';
  if (titleLower.includes('snack')) return 'snack';
  
  return 'meal'; // Default fallback
};

/**
 * Get dining event icon based on type
 * @param {Object} session - Session object to check
 * @returns {string} Icon name for the dining event
 */
export const getDiningEventIcon = (session) => {
  const eventType = getDiningEventType(session);
  
  switch (eventType) {
    case 'breakfast':
      return 'coffee';
    case 'lunch':
      return 'restaurant';
    case 'dinner':
      return 'dinner_dining';
    case 'coffee':
      return 'coffee';
    case 'snack':
      return 'cookie';
    default:
      return 'restaurant_menu';
  }
};

/**
 * Get session type category for display purposes
 * @param {Object} session - Session object to categorize
 * @returns {string} Session category ('coffee-break', 'meal', 'dining', 'session')
 */
export const getSessionCategory = (session) => {
  if (isCoffeeBreak(session)) {
    return 'coffee-break';
  }
  
  if (isDiningEvent(session)) {
    return 'dining';
  }
  
  if (isMeal(session)) {
    return 'meal';
  }
  
  return 'session';
};

/**
 * Check if a session should show countdown when in "Now" status
 * Coffee breaks and meals show countdown, regular sessions show time range
 * @param {Object} session - Session object to check
 * @returns {boolean} Whether the session should show countdown
 */
export const shouldShowCountdown = (session) => {
  return isMeal(session);
};

/**
 * Get countdown priority for session
 * Coffee breaks have highest priority, then other meals, then regular sessions
 * @param {Object} session - Session object to check
 * @returns {number} Priority level (higher = more important)
 */
export const getCountdownPriority = (session) => {
  if (isCoffeeBreak(session)) {
    return 3; // Highest priority
  }
  
  if (isMeal(session)) {
    return 2; // Medium priority
  }
  
  return 1; // Lowest priority
};

/**
 * Format session title for display
 * Adds special indicators for coffee breaks
 * @param {Object} session - Session object to format
 * @returns {string} Formatted title
 */
export const formatSessionTitle = (session) => {
  if (!session || !session.title) {
    return '';
  }

  // Coffee breaks get special treatment
  if (isCoffeeBreak(session)) {
    return session.title; // Keep original title for coffee breaks
  }

  return session.title;
};

/**
 * Get session icon based on type
 * @param {Object} session - Session object to get icon for
 * @returns {string} Icon emoji or character
 */
export const getSessionIcon = (session) => {
  if (isCoffeeBreak(session)) {
    return '☕';
  }
  
  if (isMeal(session)) {
    return '🍽️';
  }
  
  // Default session icons based on type
  const typeIcons = {
    'keynote': '🎤',
    'breakout-session': '💼',
    'executive-presentation': '👔',
    'panel-discussion': '👥',
    'reception': '🥂',
    'networking': '🤝'
  };
  
  const sessionType = session.session_type || session.type;
  return typeIcons[sessionType] || '📅';
};

/**
 * Get CSS class name for session based on type
 * @param {Object} session - Session object to get class for
 * @returns {string} CSS class name
 */
export const getSessionClassName = (session) => {
  const category = getSessionCategory(session);
  return `session-card session-card--${category}`;
};

/**
 * Check if session should have special styling
 * @param {Object} session - Session object to check
 * @returns {boolean} Whether session should have special styling
 */
export const hasSpecialStyling = (session) => {
  return isCoffeeBreak(session) || isMeal(session);
};
