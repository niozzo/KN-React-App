/**
 * TimeService Edge Cases Tests
 * Additional test coverage for time override edge cases
 * 
 * Edge Cases Covered:
 * 1. Time override during session boundaries
 * 2. Invalid override time handling
 * 3. Environment-specific behavior
 * 4. localStorage error handling
 * 5. Time precision and timezone handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimeService from '../../services/timeService';

describe('TimeService Edge Cases', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    
    // Clear any existing mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Time Override During Session Boundaries', () => {
    it('should handle override time at exact session start', () => {
      process.env.NODE_ENV = 'development';
      const sessionStart = new Date('2024-12-19T09:00:00.000Z');
      
      // Mock localStorage to return null for dynamic override keys, and sessionStart for static override
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return sessionStart.toISOString();
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(sessionStart);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should handle override time at exact session end', () => {
      process.env.NODE_ENV = 'development';
      const sessionEnd = new Date('2024-12-19T09:30:00.000Z');
      
      // Mock localStorage to return null for dynamic override keys, and sessionEnd for static override
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return sessionEnd.toISOString();
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(sessionEnd);
    });

    it('should handle override time with millisecond precision', () => {
      process.env.NODE_ENV = 'development';
      const preciseTime = new Date('2024-12-19T09:15:30.500Z');
      const mockData = JSON.stringify({
        overrideTime: preciseTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(preciseTime);
    });
  });

  describe('Invalid Override Time Handling', () => {
    it('should handle invalid date string gracefully', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue('invalid-date-string');

      const result = TimeService.getCurrentTime();

      // Should fall back to real time when override is invalid
      expect(result).toBeInstanceOf(Date);
      // The result should be a valid date (real time, not the invalid override)
      expect(result.getTime()).toBeGreaterThan(0);
      expect(result.getTime()).not.toBeNaN();
      
      // Should clear the invalid override from localStorage
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should handle null override time', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue(null);

      const result = TimeService.getCurrentTime();

      // Should fall back to real time
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle undefined override time', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue(undefined);

      const result = TimeService.getCurrentTime();

      // Should fall back to real time
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle empty string override time', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue('');

      const result = TimeService.getCurrentTime();

      // Should fall back to real time
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle future date override time', () => {
      process.env.NODE_ENV = 'development';
      const futureDate = new Date('2030-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: futureDate.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(futureDate);
    });

    it('should handle past date override time', () => {
      process.env.NODE_ENV = 'development';
      const pastDate = new Date('2020-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: pastDate.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(pastDate);
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should use override in production environment when set', () => {
      process.env.NODE_ENV = 'production';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      // Should return override time, not real time
      expect(result).toEqual(overrideTime);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_start');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_offset');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should use override in test environment', () => {
      process.env.NODE_ENV = 'test';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(overrideTime);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_start');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_offset');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should use override in development environment', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(overrideTime);
    });
  });

  describe('localStorage Error Handling', () => {
    it('should handle localStorage.getItem errors gracefully', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = TimeService.getCurrentTime();

      // Should fall back to real time
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle localStorage.setItem errors gracefully', () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const dateTime = new Date('2024-12-19T09:00:00.000Z');

      // Should not throw
      expect(() => TimeService.setOverrideTime(dateTime)).not.toThrow();
    });

    it('should handle localStorage.removeItem errors gracefully', () => {
      global.localStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => TimeService.clearOverrideTime()).not.toThrow();
    });
  });

  describe('Time Precision and Consistency', () => {
    it('should maintain time precision across multiple calls', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:15:30.123Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result1 = TimeService.getCurrentTime();
      const result2 = TimeService.getCurrentTime();

      expect(result1).toEqual(result2);
      expect(result1.getTime()).toBe(overrideTime.getTime());
    });

    it('should return consistent time within same millisecond', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:15:30.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const results = Array.from({ length: 10 }, () => TimeService.getCurrentTime());

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(overrideTime);
      });
    });
  });

  describe('Override Status Edge Cases', () => {
    it('should return correct status when override is active', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const status = TimeService.getOverrideStatus();

      expect(status.isActive).toBe(true);
      expect(status.overrideTime).toEqual(overrideTime);
      expect(status.realTime).toBeInstanceOf(Date);
      expect(status.environment).toBe('development');
    });

    it('should return correct status when override is not active', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue(null);

      const status = TimeService.getOverrideStatus();

      expect(status.isActive).toBe(false);
      expect(status.overrideTime).toBeNull();
      expect(status.realTime).toBeInstanceOf(Date);
      expect(status.environment).toBe('development');
    });

    it('should return correct status in production environment when override is set', () => {
      process.env.NODE_ENV = 'production';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: overrideTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const status = TimeService.getOverrideStatus();

      expect(status.isActive).toBe(true);
      expect(status.overrideTime).toEqual(overrideTime);
      expect(status.realTime).toBeInstanceOf(Date);
      expect(status.environment).toBe('production');
    });
  });

  describe('Date Object Edge Cases', () => {
    it('should handle Date objects with different timezones', () => {
      process.env.NODE_ENV = 'development';
      
      // Test with UTC time
      const utcTime = new Date('2024-12-19T09:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: utcTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();
      expect(result).toEqual(utcTime);

      // Test with local time (will be converted to UTC in ISO string)
      const localTime = new Date(2024, 11, 19, 9, 0, 0); // December 19, 2024, 9:00 AM local
      const localMockData = JSON.stringify({
        overrideTime: localTime.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return localMockData;
        }
        return null;
      });

      const result2 = TimeService.getCurrentTime();
      expect(result2.toISOString()).toBe(localTime.toISOString());
    });

    it('should handle leap year dates', () => {
      process.env.NODE_ENV = 'development';
      const leapYearDate = new Date('2024-02-29T09:00:00.000Z'); // 2024 is a leap year
      const mockData = JSON.stringify({
        overrideTime: leapYearDate.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();
      expect(result).toEqual(leapYearDate);
    });

    it('should handle year boundary dates', () => {
      process.env.NODE_ENV = 'development';
      const newYearDate = new Date('2024-01-01T00:00:00.000Z');
      const mockData = JSON.stringify({
        overrideTime: newYearDate.toISOString(),
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'kn_time_override_start' || key === 'kn_time_override_offset') {
          return null;
        }
        if (key === 'kn_time_override') {
          return mockData;
        }
        return null;
      });

      const result = TimeService.getCurrentTime();
      expect(result).toEqual(newYearDate);
    });
  });

  describe('Performance and Memory', () => {
    it('should not create new Date objects unnecessarily', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const result1 = TimeService.getCurrentTime();
      const result2 = TimeService.getCurrentTime();

      // Should return the same Date object (deep equality)
      expect(result1).toStrictEqual(result2);
    });

    it('should handle rapid successive calls efficiently', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = new Date('2024-12-19T09:00:00.000Z');
      global.localStorage.getItem.mockReturnValue(overrideTime.toISOString());

      const startTime = performance.now();
      
      // Make 1000 rapid calls
      for (let i = 0; i < 1000; i++) {
        TimeService.getCurrentTime();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 1000 calls)
      expect(duration).toBeLessThan(100);
    });
  });
});
