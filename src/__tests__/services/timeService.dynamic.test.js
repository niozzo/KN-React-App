/**
 * TimeService Dynamic Override Tests
 * Tests the dynamic time advancement functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TimeService from '../../services/timeService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Date constructor and Date.now for consistent testing
const mockNow = new Date('2025-09-16T21:00:00.000Z');
const mockNowTime = mockNow.getTime();

// Mock Date constructor to return our mock date
const OriginalDate = global.Date;
global.Date = class extends OriginalDate {
  constructor(...args) {
    if (args.length === 0) {
      return new OriginalDate(mockNowTime);
    }
    return new OriginalDate(...args);
  }
  static now() {
    return mockNowTime;
  }
};

describe('TimeService Dynamic Override', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Restore original Date constructor
    global.Date = OriginalDate;
  });

  describe('setDynamicOverrideTime', () => {
    it('should set dynamic override time starting at specified seconds', () => {
      const startDateTime = new Date('2025-10-21T09:00:00.000Z');
      const startSeconds = 50;

      TimeService.setDynamicOverrideTime(startDateTime, startSeconds);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_time_override_start',
        '2025-10-21T09:00:50.000Z'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_time_override_offset',
        mockNowTime.toString()
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_time_override');
    });

    it('should default to 50 seconds if not specified', () => {
      const startDateTime = new Date('2025-10-21T09:00:00.000Z');

      TimeService.setDynamicOverrideTime(startDateTime);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_time_override_start',
        '2025-10-21T09:00:50.000Z'
      );
    });
  });

  describe('getDynamicOverrideTime', () => {
    it('should return null when no dynamic override is set', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TimeService.getDynamicOverrideTime();

      expect(result).toBeNull();
    });

    it('should calculate current time based on elapsed real time', () => {
      const startTime = '2025-10-21T09:00:40.000Z';
      const offsetTime = mockNowTime - 10000; // 10 seconds ago

      localStorageMock.getItem
        .mockReturnValueOnce(startTime) // start time
        .mockReturnValueOnce(offsetTime.toString()); // offset

      const result = TimeService.getDynamicOverrideTime();

      // Should be start time + 10 seconds elapsed
      const expectedTime = new Date('2025-10-21T09:00:50.000Z');
      expect(result).toEqual(expectedTime);
    });

    it('should return null for invalid data', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('invalid-date')
        .mockReturnValueOnce('invalid-offset');

      const result = TimeService.getDynamicOverrideTime();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentTime with dynamic override', () => {
    it('should return dynamic override time when available', () => {
      const startTime = '2025-10-21T09:00:40.000Z';
      const offsetTime = mockNowTime - 5000; // 5 seconds ago

      localStorageMock.getItem
        .mockReturnValueOnce(startTime) // start time
        .mockReturnValueOnce(offsetTime.toString()); // offset

      const result = TimeService.getCurrentTime();

      // Should be start time + 5 seconds elapsed
      const expectedTime = new Date('2025-10-21T09:00:45.000Z');
      expect(result).toEqual(expectedTime);
    });

    it('should fallback to static override when dynamic is not available', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(null) // no dynamic start time
        .mockReturnValueOnce(null) // no dynamic offset
        .mockReturnValueOnce('2025-10-21T09:00:00.000Z'); // static override

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(new Date('2025-10-21T09:00:00.000Z'));
    });

    it('should return real time when no overrides are set', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TimeService.getCurrentTime();

      expect(result).toEqual(mockNow);
    });
  });

  describe('clearOverrideTime', () => {
    it('should clear both static and dynamic overrides', () => {
      TimeService.clearOverrideTime();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_time_override');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_time_override_start');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_time_override_offset');
    });
  });

  describe('isOverrideActive', () => {
    it('should return true when dynamic override is active', () => {
      const startTime = '2025-10-21T09:00:40.000Z';
      const offsetTime = mockNow.getTime() - 5000;

      localStorageMock.getItem
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(offsetTime.toString());

      const result = TimeService.isOverrideActive();

      expect(result).toBe(true);
    });

    it('should return true when static override is active', () => {
      localStorageMock.getItem
        .mockReturnValueOnce(null) // no dynamic
        .mockReturnValueOnce(null) // no dynamic offset
        .mockReturnValueOnce('2025-10-21T09:00:00.000Z'); // static override

      const result = TimeService.isOverrideActive();

      expect(result).toBe(true);
    });

    it('should return false when no overrides are set', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TimeService.isOverrideActive();

      expect(result).toBe(false);
    });
  });
});
