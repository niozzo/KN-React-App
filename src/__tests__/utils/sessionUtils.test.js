/**
 * Session Utils Tests
 * Tests for session utility functions including coffee break detection
 * Story 2.2: Coffee Break Treatment - Comprehensive test coverage
 */

import { describe, it, expect } from 'vitest';
import {
  isCoffeeBreak,
  isMeal,
  getSessionCategory,
  shouldShowCountdown,
  getCountdownPriority,
  formatSessionTitle,
  getSessionIcon,
  getSessionClassName,
  hasSpecialStyling
} from '../../utils/sessionUtils';

describe('sessionUtils', () => {
  describe('isCoffeeBreak', () => {
    it('should identify coffee breaks correctly', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Networking Coffee Break'
      };
      
      expect(isCoffeeBreak(coffeeBreakSession)).toBe(true);
    });

    it('should identify coffee breaks with different title formats', () => {
      const variations = [
        { session_type: 'meal', title: 'Coffee Break' },
        { session_type: 'meal', title: 'Morning Coffee Break' },
        { session_type: 'meal', title: 'Afternoon Coffee Break' },
        { session_type: 'meal', title: 'COFFEE BREAK' },
        { session_type: 'meal', title: 'coffee break' }
      ];

      variations.forEach(session => {
        expect(isCoffeeBreak(session)).toBe(true);
      });
    });

    it('should not identify non-coffee break sessions', () => {
      const nonCoffeeBreakSessions = [
        { session_type: 'meal', title: 'Lunch Break' },
        { session_type: 'meal', title: 'Breakfast' },
        { session_type: 'keynote', title: 'Opening Keynote' },
        { session_type: 'meal', title: 'Networking Reception' }
      ];

      nonCoffeeBreakSessions.forEach(session => {
        expect(isCoffeeBreak(session)).toBe(false);
      });
    });

    it('should handle legacy type field', () => {
      const legacySession = {
        type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(isCoffeeBreak(legacySession)).toBe(true);
    });

    it('should return false for invalid sessions', () => {
      expect(isCoffeeBreak(null)).toBe(false);
      expect(isCoffeeBreak(undefined)).toBe(false);
      expect(isCoffeeBreak({})).toBe(false);
      expect(isCoffeeBreak({ title: null })).toBe(false);
    });
  });

  describe('isMeal', () => {
    it('should identify meal sessions by session_type', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(isMeal(mealSession)).toBe(true);
    });

    it('should identify meal sessions by legacy type field', () => {
      const legacyMealSession = {
        type: 'breakfast',
        title: 'Morning Breakfast'
      };
      
      expect(isMeal(legacyMealSession)).toBe(true);
    });

    it('should identify meal sessions by title keywords', () => {
      const titleBasedMeals = [
        { title: 'Breakfast' },
        { title: 'Lunch Break' },
        { title: 'Dinner Reception' },
        { title: 'Coffee Break' },
        { title: 'Morning Meal' }
      ];

      titleBasedMeals.forEach(session => {
        expect(isMeal(session)).toBe(true);
      });
    });

    it('should not identify non-meal sessions', () => {
      const nonMealSessions = [
        { session_type: 'keynote', title: 'Opening Keynote' },
        { title: 'Panel Discussion' },
        { session_type: 'breakout-session', title: 'Workshop' }
      ];

      nonMealSessions.forEach(session => {
        expect(isMeal(session)).toBe(false);
      });
    });
  });

  describe('getSessionCategory', () => {
    it('should return coffee-break for coffee break sessions', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(getSessionCategory(coffeeBreakSession)).toBe('coffee-break');
    });

    it('should return meal for other meal sessions', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(getSessionCategory(mealSession)).toBe('meal');
    });

    it('should return session for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(getSessionCategory(regularSession)).toBe('session');
    });
  });

  describe('shouldShowCountdown', () => {
    it('should return true for meal sessions', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(shouldShowCountdown(mealSession)).toBe(true);
    });

    it('should return true for coffee break sessions', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(shouldShowCountdown(coffeeBreakSession)).toBe(true);
    });

    it('should return false for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(shouldShowCountdown(regularSession)).toBe(false);
    });
  });

  describe('getCountdownPriority', () => {
    it('should return highest priority for coffee breaks', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(getCountdownPriority(coffeeBreakSession)).toBe(3);
    });

    it('should return medium priority for other meals', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(getCountdownPriority(mealSession)).toBe(2);
    });

    it('should return lowest priority for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(getCountdownPriority(regularSession)).toBe(1);
    });
  });

  describe('formatSessionTitle', () => {
    it('should return original title for coffee breaks', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Networking Coffee Break'
      };
      
      expect(formatSessionTitle(coffeeBreakSession)).toBe('Networking Coffee Break');
    });

    it('should return original title for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(formatSessionTitle(regularSession)).toBe('Opening Keynote');
    });

    it('should handle missing title', () => {
      expect(formatSessionTitle({})).toBe('');
      expect(formatSessionTitle(null)).toBe('');
    });
  });

  describe('getSessionIcon', () => {
    it('should return coffee icon for coffee breaks', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(getSessionIcon(coffeeBreakSession)).toBe('☕');
    });

    it('should return meal icon for other meals', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(getSessionIcon(mealSession)).toBe('🍽️');
    });

    it('should return appropriate icons for session types', () => {
      const sessionTypes = [
        { session_type: 'keynote', expected: '🎤' },
        { session_type: 'breakout-session', expected: '💼' },
        { session_type: 'executive-presentation', expected: '👔' },
        { session_type: 'panel-discussion', expected: '👥' },
        { session_type: 'reception', expected: '🥂' },
        { session_type: 'networking', expected: '🤝' }
      ];

      sessionTypes.forEach(({ session_type, expected }) => {
        const session = { session_type, title: 'Test Session' };
        expect(getSessionIcon(session)).toBe(expected);
      });
    });

    it('should return default icon for unknown types', () => {
      const unknownSession = {
        session_type: 'unknown',
        title: 'Test Session'
      };
      
      expect(getSessionIcon(unknownSession)).toBe('📅');
    });
  });

  describe('getSessionClassName', () => {
    it('should return coffee-break class for coffee breaks', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(getSessionClassName(coffeeBreakSession)).toBe('session-card session-card--coffee-break');
    });

    it('should return meal class for other meals', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(getSessionClassName(mealSession)).toBe('session-card session-card--meal');
    });

    it('should return session class for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(getSessionClassName(regularSession)).toBe('session-card session-card--session');
    });
  });

  describe('hasSpecialStyling', () => {
    it('should return true for coffee breaks', () => {
      const coffeeBreakSession = {
        session_type: 'meal',
        title: 'Coffee Break'
      };
      
      expect(hasSpecialStyling(coffeeBreakSession)).toBe(true);
    });

    it('should return true for other meals', () => {
      const mealSession = {
        session_type: 'meal',
        title: 'Lunch'
      };
      
      expect(hasSpecialStyling(mealSession)).toBe(true);
    });

    it('should return false for regular sessions', () => {
      const regularSession = {
        session_type: 'keynote',
        title: 'Opening Keynote'
      };
      
      expect(hasSpecialStyling(regularSession)).toBe(false);
    });
  });
});
