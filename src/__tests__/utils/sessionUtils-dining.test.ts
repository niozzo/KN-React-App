/**
 * Session Utils Dining Integration Tests
 * Story 2.1g.2: Home Page Now/Next Dining Integration
 * 
 * Tests the dining-specific utility functions added to sessionUtils.js
 */

import { describe, it, expect } from 'vitest';
import {
  isCoffeeBreak,
  isDiningEvent,
  getDiningEventType,
  getDiningEventIcon,
  isMeal,
  getSessionCategory,
} from '../../utils/sessionUtils';

describe('Session Utils Dining Integration', () => {
  const mockDiningEvents = [
    {
      id: 'dining-1',
      name: 'Continental Breakfast',
      title: 'Continental Breakfast',
      type: 'dining',
      session_type: 'meal',
      capacity: 100,
      seating_type: 'open',
    },
    {
      id: 'dining-2',
      name: 'Networking Lunch',
      title: 'Networking Lunch',
      type: 'dining',
      session_type: 'meal',
      capacity: 200,
      seating_type: 'assigned',
    },
    {
      id: 'dining-3',
      name: 'Gala Dinner',
      title: 'Gala Dinner',
      type: 'dining',
      session_type: 'meal',
      capacity: 300,
      seating_type: 'assigned',
    },
    {
      id: 'dining-4',
      name: 'Coffee Break',
      title: 'Coffee Break',
      type: 'dining',
      session_type: 'meal',
      capacity: 50,
      seating_type: 'open',
    },
    {
      id: 'dining-5',
      name: 'Afternoon Snack',
      title: 'Afternoon Snack',
      type: 'dining',
      session_type: 'meal',
      capacity: 75,
      seating_type: 'open',
    },
    {
      id: 'dining-6',
      name: 'Generic Meal',
      title: 'Generic Meal',
      type: 'dining',
      session_type: 'meal',
      capacity: 150,
      seating_type: 'open',
    },
  ];

  const mockRegularSessions = [
    {
      id: 'session-1',
      title: 'Opening Keynote',
      type: 'session',
      session_type: 'keynote',
    },
    {
      id: 'session-2',
      title: 'Panel Discussion',
      type: 'session',
      session_type: 'panel-discussion',
    },
  ];

  describe('isDiningEvent', () => {
    it('should return true for dining events', () => {
      mockDiningEvents.forEach(event => {
        expect(isDiningEvent(event)).toBe(true);
      });
    });

    it('should return false for regular sessions', () => {
      mockRegularSessions.forEach(session => {
        expect(isDiningEvent(session)).toBe(false);
      });
    });

    it('should return false for null or undefined', () => {
      expect(isDiningEvent(null)).toBe(false);
      expect(isDiningEvent(undefined)).toBe(false);
    });

    it('should return false for objects without type property', () => {
      const invalidEvent = { id: 'test', name: 'Test' };
      expect(isDiningEvent(invalidEvent)).toBe(false);
    });
  });

  describe('getDiningEventType', () => {
    it('should return correct event type for breakfast', () => {
      expect(getDiningEventType(mockDiningEvents[0])).toBe('breakfast');
    });

    it('should return correct event type for lunch', () => {
      expect(getDiningEventType(mockDiningEvents[1])).toBe('lunch');
    });

    it('should return correct event type for dinner', () => {
      expect(getDiningEventType(mockDiningEvents[2])).toBe('dinner');
    });

    it('should return correct event type for coffee', () => {
      expect(getDiningEventType(mockDiningEvents[3])).toBe('coffee');
    });

    it('should return correct event type for snack', () => {
      expect(getDiningEventType(mockDiningEvents[4])).toBe('snack');
    });

    it('should return default meal type for generic meals', () => {
      expect(getDiningEventType(mockDiningEvents[5])).toBe('meal');
    });

    it('should return null for non-dining events', () => {
      expect(getDiningEventType(mockRegularSessions[0])).toBe(null);
    });

    it('should handle events with name instead of title', () => {
      const eventWithName = {
        ...mockDiningEvents[0],
        title: undefined,
        name: 'Continental Breakfast',
      };
      expect(getDiningEventType(eventWithName)).toBe('breakfast');
    });

    it('should handle events with no title or name', () => {
      const eventWithoutTitle = {
        ...mockDiningEvents[0],
        title: undefined,
        name: undefined,
      };
      expect(getDiningEventType(eventWithoutTitle)).toBe('meal');
    });
  });

  describe('getDiningEventIcon', () => {
    it('should return correct icon for breakfast', () => {
      expect(getDiningEventIcon(mockDiningEvents[0])).toBe('coffee');
    });

    it('should return correct icon for lunch', () => {
      expect(getDiningEventIcon(mockDiningEvents[1])).toBe('restaurant');
    });

    it('should return correct icon for dinner', () => {
      expect(getDiningEventIcon(mockDiningEvents[2])).toBe('dinner_dining');
    });

    it('should return correct icon for coffee', () => {
      expect(getDiningEventIcon(mockDiningEvents[3])).toBe('coffee');
    });

    it('should return correct icon for snack', () => {
      expect(getDiningEventIcon(mockDiningEvents[4])).toBe('cookie');
    });

    it('should return default icon for generic meals', () => {
      expect(getDiningEventIcon(mockDiningEvents[5])).toBe('restaurant_menu');
    });

    it('should return default icon for non-dining events', () => {
      expect(getDiningEventIcon(mockRegularSessions[0])).toBe('restaurant_menu');
    });
  });

  describe('isMeal (enhanced for dining)', () => {
    it('should return true for dining events', () => {
      mockDiningEvents.forEach(event => {
        expect(isMeal(event)).toBe(true);
      });
    });

    it('should return true for legacy meal sessions', () => {
      const legacyMealSession = {
        id: 'legacy-meal',
        title: 'Legacy Breakfast',
        session_type: 'meal',
        type: 'session',
      };
      expect(isMeal(legacyMealSession)).toBe(true);
    });

    it('should return true for coffee break sessions', () => {
      const coffeeBreakSession = {
        id: 'coffee-break',
        title: 'Coffee Break',
        type: 'coffee_break',
        session_type: 'meal',
      };
      expect(isMeal(coffeeBreakSession)).toBe(true);
    });

    it('should return false for regular sessions', () => {
      mockRegularSessions.forEach(session => {
        expect(isMeal(session)).toBe(false);
      });
    });

    it('should return false for null or undefined', () => {
      expect(isMeal(null)).toBe(false);
      expect(isMeal(undefined)).toBe(false);
    });
  });

  describe('getSessionCategory (enhanced for dining)', () => {
    it('should return "dining" for dining events (except coffee breaks)', () => {
      mockDiningEvents.forEach(event => {
        if (event.title === 'Coffee Break') {
          // Coffee Break dining events should be treated as coffee breaks
          expect(getSessionCategory(event)).toBe('coffee-break');
        } else {
          // Other dining events should be treated as dining
          expect(getSessionCategory(event)).toBe('dining');
        }
      });
    });

    it('should return "coffee-break" for coffee break sessions', () => {
      const coffeeBreakSession = {
        id: 'coffee-break',
        title: 'Coffee Break',
        type: 'coffee_break',
        session_type: 'meal',
      };
      expect(getSessionCategory(coffeeBreakSession)).toBe('coffee-break');
    });

    it('should return "meal" for legacy meal sessions', () => {
      const legacyMealSession = {
        id: 'legacy-meal',
        title: 'Legacy Breakfast',
        session_type: 'meal',
        type: 'session',
      };
      expect(getSessionCategory(legacyMealSession)).toBe('meal');
    });

    it('should return "session" for regular sessions', () => {
      mockRegularSessions.forEach(session => {
        expect(getSessionCategory(session)).toBe('session');
      });
    });

    it('should handle null or undefined gracefully', () => {
      expect(getSessionCategory(null)).toBe('session');
      expect(getSessionCategory(undefined)).toBe('session');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle dining events with missing properties', () => {
      const minimalDiningEvent = {
        type: 'dining',
      };
      expect(isDiningEvent(minimalDiningEvent)).toBe(true);
      expect(getDiningEventType(minimalDiningEvent)).toBe('meal');
      expect(getDiningEventIcon(minimalDiningEvent)).toBe('restaurant_menu');
    });

    it('should handle case-insensitive title matching', () => {
      const upperCaseEvent = {
        type: 'dining',
        title: 'BREAKFAST BUFFET',
      };
      expect(getDiningEventType(upperCaseEvent)).toBe('breakfast');
    });

    it('should handle mixed case title matching', () => {
      const mixedCaseEvent = {
        type: 'dining',
        title: 'Coffee Break & Networking',
      };
      expect(getDiningEventType(mixedCaseEvent)).toBe('coffee');
    });

    it('should handle events with multiple meal keywords', () => {
      const multiKeywordEvent = {
        type: 'dining',
        title: 'Breakfast and Coffee Service',
      };
      // Should match the first keyword found (breakfast)
      expect(getDiningEventType(multiKeywordEvent)).toBe('breakfast');
    });
  });
});
