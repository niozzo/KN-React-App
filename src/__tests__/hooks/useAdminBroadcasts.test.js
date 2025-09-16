/**
 * useAdminBroadcasts Hook Tests
 * Story 2.1: Now/Next Glance Card - Task 6 (Admin Broadcasts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAdminBroadcasts, { createBroadcastMessage } from '../../hooks/useAdminBroadcasts';

describe('useAdminBroadcasts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage with fresh state for each test
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null), // Return null by default (no stored data)
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear any existing localStorage data
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    // Clear localStorage mock state
    if (window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('createBroadcastMessage', () => {
    it('should create a broadcast message with default values', () => {
      const message = createBroadcastMessage('Test message');
      
      expect(message).toMatchObject({
        message: 'Test message',
        type: 'info',
        priority: 'normal',
        duration: null,
        isActive: true
      });
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.expiresAt).toBeNull();
    });

    it('should create a broadcast message with custom values', () => {
      const message = createBroadcastMessage('Urgent message', 'urgent', 'critical', 60000);
      
      expect(message).toMatchObject({
        message: 'Urgent message',
        type: 'urgent',
        priority: 'critical',
        duration: 60000,
        isActive: true
      });
      expect(message.expiresAt).toBeDefined();
    });
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty broadcasts', async () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      // Wait for initial loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.broadcasts).toEqual([]);
      expect(result.current.activeBroadcast).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should add a broadcast message', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Test message', 'info', 'normal');
      });
      
      expect(result.current.broadcasts).toHaveLength(1);
      expect(result.current.broadcasts[0].message).toBe('Test message');
      expect(result.current.broadcasts[0].type).toBe('info');
      expect(result.current.broadcasts[0].priority).toBe('normal');
    });

    it('should set high priority broadcast as active', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Urgent message', 'urgent', 'high');
      });
      
      expect(result.current.activeBroadcast).toBeDefined();
      expect(result.current.activeBroadcast.message).toBe('Urgent message');
      expect(result.current.activeBroadcast.priority).toBe('high');
    });

    it('should remove a broadcast message', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      let broadcastId;
      act(() => {
        broadcastId = result.current.addBroadcast('Test message').id;
      });
      
      expect(result.current.broadcasts).toHaveLength(1);
      
      act(() => {
        result.current.removeBroadcast(broadcastId);
      });
      
      expect(result.current.broadcasts).toHaveLength(0);
    });

    it('should clear all broadcasts', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Message 1');
        result.current.addBroadcast('Message 2');
      });
      
      expect(result.current.broadcasts).toHaveLength(2);
      
      act(() => {
        result.current.clearAllBroadcasts();
      });
      
      expect(result.current.broadcasts).toHaveLength(0);
      expect(result.current.activeBroadcast).toBeNull();
    });
  });

  describe('Priority Handling', () => {
    it('should return highest priority broadcast', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Low priority', 'info', 'low');
        result.current.addBroadcast('High priority', 'warning', 'high');
        result.current.addBroadcast('Normal priority', 'info', 'normal');
      });
      
      const highest = result.current.getHighestPriorityBroadcast();
      expect(highest.priority).toBe('high');
      expect(highest.message).toBe('High priority');
    });

    it('should update active broadcast when higher priority is added', async () => {
      const { result } = renderHook(() => useAdminBroadcasts({ enabled: false }));
      
      // Wait for initial state to settle
      await act(async () => {
        // Ensure we start with no active broadcast
        expect(result.current.activeBroadcast).toBeNull();
      });
      
      await act(async () => {
        result.current.addBroadcast('Normal message', 'info', 'normal');
      });
      
      
      // Normal priority should not set active broadcast
      expect(result.current.activeBroadcast).toBeNull();
      
      await act(async () => {
        result.current.addBroadcast('Critical message', 'urgent', 'critical');
      });
      
      // Critical priority should set active broadcast
      expect(result.current.activeBroadcast.priority).toBe('critical');
      expect(result.current.activeBroadcast.message).toBe('Critical message');
    });
  });


  describe('Expiration Handling', () => {
    it('should handle broadcasts with expiration', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Temporary message', 'info', 'normal', 1000);
      });
      
      const broadcast = result.current.broadcasts[0];
      expect(broadcast.expiresAt).toBeDefined();
      expect(broadcast.duration).toBe(1000);
    });

    it('should filter out expired broadcasts on load', () => {
      const expiredBroadcast = createBroadcastMessage('Expired message', 'info', 'normal', -1000);
      const validBroadcast = createBroadcastMessage('Valid message', 'info', 'normal', 60000);
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify([expiredBroadcast, validBroadcast]));
      
      const { result } = renderHook(() => useAdminBroadcasts());
      
      expect(result.current.broadcasts).toHaveLength(1);
      expect(result.current.broadcasts[0].message).toBe('Valid message');
    });
  });

  describe('Local Storage Integration', () => {
    it('should load broadcasts from localStorage', () => {
      const storedBroadcasts = [
        createBroadcastMessage('Stored message 1', 'info', 'normal'),
        createBroadcastMessage('Stored message 2', 'warning', 'high')
      ];
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(storedBroadcasts));
      
      const { result } = renderHook(() => useAdminBroadcasts());
      
      expect(result.current.broadcasts).toHaveLength(2);
      expect(result.current.broadcasts[0].message).toBe('Stored message 1');
      expect(result.current.broadcasts[1].message).toBe('Stored message 2');
    });

    it('should save broadcasts to localStorage', () => {
      const { result } = renderHook(() => useAdminBroadcasts());
      
      act(() => {
        result.current.addBroadcast('Test message');
      });
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'kn_admin_broadcasts',
        expect.stringContaining('Test message')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      window.localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const { result } = renderHook(() => useAdminBroadcasts());
      
      expect(result.current.broadcasts).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Broadcast Updates', () => {
    it('should check for updates when enabled', async () => {
      const { result } = renderHook(() => useAdminBroadcasts({ enabled: true }));
      
      // Wait for initial check
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('should not check for updates when disabled', async () => {
      const { result } = renderHook(() => useAdminBroadcasts({ enabled: false }));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Dismiss Functionality', () => {
    it('should dismiss active broadcast', async () => {
      const { result } = renderHook(() => useAdminBroadcasts({ enabled: false }));
      
      await act(async () => {
        result.current.addBroadcast('High priority message', 'urgent', 'high');
      });
      
      expect(result.current.activeBroadcast).toBeDefined();
      expect(result.current.activeBroadcast.priority).toBe('high');
      
      await act(async () => {
        result.current.dismissActiveBroadcast();
      });
      
      expect(result.current.activeBroadcast).toBeNull();
    });
  });

  describe('Message Limits', () => {
    it('should respect max messages limit', () => {
      const { result } = renderHook(() => useAdminBroadcasts({ maxMessages: 2 }));
      
      act(() => {
        result.current.addBroadcast('Message 1');
        result.current.addBroadcast('Message 2');
        result.current.addBroadcast('Message 3');
      });
      
      expect(result.current.broadcasts).toHaveLength(2);
      expect(result.current.broadcasts[0].message).toBe('Message 3'); // Most recent first
      expect(result.current.broadcasts[1].message).toBe('Message 2');
    });
  });
});
