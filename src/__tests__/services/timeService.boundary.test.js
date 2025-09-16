/**
 * TimeService Boundary Detection Tests
 * Tests for session boundary crossing detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimeService from '../../services/timeService';

describe('TimeService Boundary Detection', () => {
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
    
    // Mock window.dispatchEvent
    global.window.dispatchEvent = vi.fn();
    
    // Clear any existing intervals
    TimeService.stopBoundaryMonitoring();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
    TimeService.stopBoundaryMonitoring();
  });

  describe('registerSessionBoundaries', () => {
    it('should register session start and end times', () => {
      const sessions = [
        {
          id: '1',
          date: '2024-12-19',
          start_time: '09:00:00',
          end_time: '09:30:00'
        },
        {
          id: '2', 
          date: '2024-12-19',
          start_time: '10:00:00',
          end_time: '11:00:00'
        }
      ];

      TimeService.registerSessionBoundaries(sessions);

      // Should have registered 4 boundaries (2 start times + 2 end times)
      expect(TimeService._sessionBoundaries.size).toBe(4);
    });

    it('should handle empty or invalid sessions gracefully', () => {
      TimeService.registerSessionBoundaries([]);
      expect(TimeService._sessionBoundaries.size).toBe(0);

      TimeService.registerSessionBoundaries(null);
      expect(TimeService._sessionBoundaries.size).toBe(0);

      TimeService.registerSessionBoundaries(undefined);
      expect(TimeService._sessionBoundaries.size).toBe(0);
    });
  });

  describe('checkSessionBoundaryCrossing', () => {
    beforeEach(() => {
      const sessions = [
        {
          id: '1',
          date: '2024-12-19',
          start_time: '09:00:00',
          end_time: '09:30:00'
        }
      ];
      TimeService.registerSessionBoundaries(sessions);
    });

    it('should return false when no override is active', () => {
      process.env.NODE_ENV = 'production';
      const result = TimeService.checkSessionBoundaryCrossing(new Date());
      expect(result).toBe(false);
    });

    it('should return false when no boundaries are registered', () => {
      process.env.NODE_ENV = 'development';
      TimeService._sessionBoundaries.clear();
      const result = TimeService.checkSessionBoundaryCrossing(new Date());
      expect(result).toBe(false);
    });

    it('should detect boundary crossing when time moves past a boundary', () => {
      process.env.NODE_ENV = 'development';
      
      // Mock override active
      global.localStorage.getItem.mockReturnValue(JSON.stringify({
        overrideTime: '2024-12-19T08:59:00.000Z',
        timestamp: Date.now()
      }));

      // First check - before boundary
      const beforeBoundary = new Date('2024-12-19T08:59:59.000Z');
      TimeService.checkSessionBoundaryCrossing(beforeBoundary);
      
      // Second check - after boundary (9:00:00) - need to use the same timezone
      const afterBoundary = new Date('2024-12-19T15:00:01.000Z'); // 9:00 AM in UTC
      const result = TimeService.checkSessionBoundaryCrossing(afterBoundary);
      
      expect(result).toBe(true);
    });
  });

  describe('startBoundaryMonitoring', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start monitoring when override is active', () => {
      // Mock override active
      global.localStorage.getItem.mockReturnValue(JSON.stringify({
        overrideTime: '2024-12-19T08:59:00.000Z',
        timestamp: Date.now()
      }));

      const sessions = [{
        id: '1',
        date: '2024-12-19',
        start_time: '09:00:00',
        end_time: '09:30:00'
      }];
      TimeService.registerSessionBoundaries(sessions);

      TimeService.startBoundaryMonitoring();
      
      // Fast-forward time to trigger boundary crossing
      vi.advanceTimersByTime(2000);
      
      // Should have called dispatchEvent when boundary is crossed
      expect(global.window.dispatchEvent).toHaveBeenCalled();
    });

    it('should not start monitoring when override is not active', () => {
      process.env.NODE_ENV = 'production';
      
      TimeService.startBoundaryMonitoring();
      
      // Fast-forward time
      vi.advanceTimersByTime(2000);
      
      // Should not have called dispatchEvent
      expect(global.window.dispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('stopBoundaryMonitoring', () => {
    it('should stop monitoring and clear interval', () => {
      // Mock override active first
      global.localStorage.getItem.mockReturnValue(JSON.stringify({
        overrideTime: '2024-12-19T08:59:00.000Z',
        timestamp: Date.now()
      }));
      
      TimeService.startBoundaryMonitoring();
      expect(TimeService._boundaryCheckInterval).toBeTruthy();
      
      TimeService.stopBoundaryMonitoring();
      expect(TimeService._boundaryCheckInterval).toBeNull();
    });
  });
});
