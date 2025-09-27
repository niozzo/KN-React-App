/**
 * TimeService Tests
 * Tests for centralized time management service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimeService from '../../services/timeService';

describe('TimeService', () => {
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

  describe('getCurrentTime', () => {
    it('should return real time in production environment when no override is set', () => {
      process.env.NODE_ENV = 'production';
      global.localStorage.getItem.mockReturnValue(null);
      
      const result = TimeService.getCurrentTime();
      
      expect(result).toBeInstanceOf(Date);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_start');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override_offset');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should return real time when no override is set in development', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue(null);
      
      const result = TimeService.getCurrentTime();
      
      expect(result).toBeInstanceOf(Date);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should return override time when set in development', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = '2024-12-19T10:00:00.000Z';
      const mockData = JSON.stringify({
        overrideTime: overrideTime,
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockReturnValue(mockData);
      
      const result = TimeService.getCurrentTime();
      
      expect(result).toBeInstanceOf(Date);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should return override time when set in test environment', () => {
      process.env.NODE_ENV = 'test';
      const overrideTime = '2024-12-19T10:00:00.000Z';
      const mockData = JSON.stringify({
        overrideTime: overrideTime,
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockReturnValue(mockData);
      
      const result = TimeService.getCurrentTime();
      
      expect(result).toBeInstanceOf(Date);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });
  });

  describe('isOverrideEnabled', () => {
    it('should return true in production (override enabled for testing)', () => {
      process.env.NODE_ENV = 'production';
      expect(TimeService.isOverrideEnabled()).toBe(true);
    });

    it('should return true in development', () => {
      process.env.NODE_ENV = 'development';
      expect(TimeService.isOverrideEnabled()).toBe(true);
    });

    it('should return true in test', () => {
      process.env.NODE_ENV = 'test';
      expect(TimeService.isOverrideEnabled()).toBe(true);
    });
  });

  describe('getOverrideTime', () => {
    it('should return null when no override is set', () => {
      global.localStorage.getItem.mockReturnValue(null);
      
      const result = TimeService.getOverrideTime();
      
      expect(result).toBeNull();
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should return Date object when override is set', () => {
      const overrideTime = '2024-12-19T10:00:00.000Z';
      const mockData = JSON.stringify({
        overrideTime: overrideTime,
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockReturnValue(mockData);
      
      const result = TimeService.getOverrideTime();
      
      expect(result).toEqual(new Date(overrideTime));
      expect(global.localStorage.getItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = TimeService.getOverrideTime();
      
      expect(result).toBeNull();
    });
  });

  describe('setOverrideTime', () => {
    it('should set override time in localStorage', () => {
      const dateTime = new Date('2024-12-19T10:00:00.000Z');
      
      TimeService.setOverrideTime(dateTime);
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'kn_time_override',
        expect.stringMatching(/^{"overrideTime":"2024-12-19T10:00:00\.000Z","timestamp":\d+}$/)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const dateTime = new Date('2024-12-19T10:00:00.000Z');
      
      // Should not throw in any environment, just log the error
      expect(() => TimeService.setOverrideTime(dateTime)).not.toThrow();
    });
  });

  describe('clearOverrideTime', () => {
    it('should remove override time from localStorage', () => {
      TimeService.clearOverrideTime();
      
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw in any environment, just log the error
      expect(() => TimeService.clearOverrideTime()).not.toThrow();
    });
  });

  describe('isOverrideActive', () => {
    it('should return false in production when no override is set', () => {
      process.env.NODE_ENV = 'production';
      global.localStorage.getItem.mockReturnValue(null);
      expect(TimeService.isOverrideActive()).toBe(false);
    });

    it('should return false when no override is set in development', () => {
      process.env.NODE_ENV = 'development';
      global.localStorage.getItem.mockReturnValue(null);
      
      expect(TimeService.isOverrideActive()).toBe(false);
    });

    it('should return true when override is set in development', () => {
      process.env.NODE_ENV = 'development';
      const mockData = JSON.stringify({
        overrideTime: '2024-12-19T10:00:00.000Z',
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockReturnValue(mockData);
      
      expect(TimeService.isOverrideActive()).toBe(true);
    });
  });

  describe('getOverrideStatus', () => {
    it('should return correct status in production', () => {
      process.env.NODE_ENV = 'production';
      
      const status = TimeService.getOverrideStatus();
      
      expect(status).toEqual({
        isActive: false,
        overrideTime: null,
        currentTime: expect.any(Date),
        realTime: expect.any(Date),
        environment: 'production'
      });
    });

    it('should return correct status when override is active', () => {
      process.env.NODE_ENV = 'development';
      const overrideTime = '2024-12-19T10:00:00.000Z';
      const mockData = JSON.stringify({
        overrideTime: overrideTime,
        timestamp: Date.now()
      });
      global.localStorage.getItem.mockReturnValue(mockData);
      
      const status = TimeService.getOverrideStatus();
      
      expect(status).toEqual({
        isActive: true,
        overrideTime: new Date(overrideTime),
        currentTime: expect.any(Date),
        realTime: expect.any(Date),
        environment: 'development'
      });
    });
  });
});
