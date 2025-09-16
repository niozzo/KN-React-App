/**
 * TimeService Event Emission Tests
 * Tests for the new event emission functionality when time override changes
 * 
 * Edge Cases Covered:
 * 1. Custom event emission when setting time override
 * 2. Custom event emission when clearing time override
 * 3. Event detail structure and content
 * 4. Error handling during event emission
 * 5. Environment-specific behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimeService from '../../services/timeService';

describe('TimeService Event Emission', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;
  const originalDispatchEvent = window.dispatchEvent;

  let mockDispatchEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    // Mock window.dispatchEvent
    mockDispatchEvent = vi.fn();
    window.dispatchEvent = mockDispatchEvent;

    // Set development environment
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    window.dispatchEvent = originalDispatchEvent;
    vi.clearAllMocks();
  });

  describe('setOverrideTime Event Emission', () => {
    it('should emit timeOverrideChanged event when setting override time', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeOverrideChanged',
          detail: {
            newTime: testDate,
            action: 'set'
          }
        })
      );
    });

    it('should store time in localStorage when setting override', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'kn_time_override',
        testDate.toISOString()
      );
    });

    it('should log the time override setting', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🕐 Time override set:',
        testDate.toISOString()
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if localStorage fails', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      const error = new Error('localStorage failed');
      
      global.localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        TimeService.setOverrideTime(testDate);
      }).toThrow(error);
    });

    it('should not emit event if localStorage fails', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage failed');
      });

      expect(() => {
        TimeService.setOverrideTime(testDate);
      }).toThrow();

      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('clearOverrideTime Event Emission', () => {
    it('should emit timeOverrideChanged event when clearing override time', () => {
      TimeService.clearOverrideTime();

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeOverrideChanged',
          detail: {
            newTime: null,
            action: 'clear'
          }
        })
      );
    });

    it('should remove time from localStorage when clearing override', () => {
      TimeService.clearOverrideTime();

      expect(global.localStorage.removeItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should log the time override clearing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      TimeService.clearOverrideTime();

      expect(consoleSpy).toHaveBeenCalledWith('🕐 Time override cleared');

      consoleSpy.mockRestore();
    });

    it('should throw error if localStorage fails', () => {
      const error = new Error('localStorage failed');
      
      global.localStorage.removeItem.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        TimeService.clearOverrideTime();
      }).toThrow(error);
    });

    it('should not emit event if localStorage fails', () => {
      global.localStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage failed');
      });

      expect(() => {
        TimeService.clearOverrideTime();
      }).toThrow();

      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Event Detail Structure', () => {
    it('should include correct detail structure for set action', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      const eventCall = mockDispatchEvent.mock.calls[0][0];
      expect(eventCall.detail).toEqual({
        newTime: testDate,
        action: 'set'
      });
    });

    it('should include correct detail structure for clear action', () => {
      TimeService.clearOverrideTime();

      const eventCall = mockDispatchEvent.mock.calls[0][0];
      expect(eventCall.detail).toEqual({
        newTime: null,
        action: 'clear'
      });
    });

    it('should create proper CustomEvent instance', () => {
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      const eventCall = mockDispatchEvent.mock.calls[0][0];
      expect(eventCall).toBeInstanceOf(CustomEvent);
      expect(eventCall.type).toBe('timeOverrideChanged');
    });
  });

  describe('Environment Behavior', () => {
    it('should work in development environment', () => {
      process.env.NODE_ENV = 'development';
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(mockDispatchEvent).toHaveBeenCalled();
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('should work in test environment', () => {
      process.env.NODE_ENV = 'test';
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(mockDispatchEvent).toHaveBeenCalled();
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('should work in staging environment', () => {
      process.env.NODE_ENV = 'staging';
      const testDate = new Date('2024-12-19T09:05:00');
      
      TimeService.setOverrideTime(testDate);

      expect(mockDispatchEvent).toHaveBeenCalled();
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Multiple Operations', () => {
    it('should emit separate events for multiple operations', () => {
      const testDate1 = new Date('2024-12-19T09:05:00');
      const testDate2 = new Date('2024-12-19T10:05:00');
      
      TimeService.setOverrideTime(testDate1);
      TimeService.setOverrideTime(testDate2);
      TimeService.clearOverrideTime();

      expect(mockDispatchEvent).toHaveBeenCalledTimes(3);
      
      // First set
      expect(mockDispatchEvent.mock.calls[0][0].detail).toEqual({
        newTime: testDate1,
        action: 'set'
      });
      
      // Second set
      expect(mockDispatchEvent.mock.calls[1][0].detail).toEqual({
        newTime: testDate2,
        action: 'set'
      });
      
      // Clear
      expect(mockDispatchEvent.mock.calls[2][0].detail).toEqual({
        newTime: null,
        action: 'clear'
      });
    });
  });
});

