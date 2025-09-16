/**
 * useAdminBroadcasts Hook
 * Manages admin broadcast messages and countdown timers
 * Story 2.1: Now/Next Glance Card - Task 6
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Admin Broadcast Message Structure
 */
export const createBroadcastMessage = (message, type = 'info', priority = 'normal', duration = null) => ({
  id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  message,
  type, // 'info', 'warning', 'urgent', 'countdown'
  priority, // 'low', 'normal', 'high', 'critical'
  duration, // in milliseconds, null for persistent
  timestamp: new Date().toISOString(),
  expiresAt: duration ? new Date(Date.now() + duration).toISOString() : null,
  isActive: true
});

/**
 * useAdminBroadcasts Hook
 * @param {Object} options - Configuration options
 * @returns {Object} Broadcast state and utilities
 */
export const useAdminBroadcasts = (options = {}) => {
  const {
    enabled = true,
    checkInterval = 30000, // 30 seconds
    maxMessages = 5,
    enableCountdownIntegration = true
  } = options;

  const [broadcasts, setBroadcasts] = useState([]);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load broadcasts from localStorage
  const loadBroadcasts = useCallback(() => {
    try {
      const stored = localStorage.getItem('kn_admin_broadcasts');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = new Date();
        
        // Filter out expired broadcasts
        const active = parsed.filter(broadcast => 
          !broadcast.expiresAt || new Date(broadcast.expiresAt) > now
        );
        
        setBroadcasts(active);
        
        // Update localStorage with filtered broadcasts
        if (active.length !== parsed.length) {
          localStorage.setItem('kn_admin_broadcasts', JSON.stringify(active));
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to load admin broadcasts:', err);
    }
  }, []);

  // Save broadcasts to localStorage
  const saveBroadcasts = useCallback((newBroadcasts) => {
    try {
      localStorage.setItem('kn_admin_broadcasts', JSON.stringify(newBroadcasts));
    } catch (err) {
      console.warn('⚠️ Failed to save admin broadcasts:', err);
    }
  }, []);

  // Add a new broadcast message
  const addBroadcast = useCallback((message, type = 'info', priority = 'normal', duration = null) => {
    const newBroadcast = createBroadcastMessage(message, type, priority, duration);
    
    setBroadcasts(prev => {
      const updated = [newBroadcast, ...prev].slice(0, maxMessages);
      saveBroadcasts(updated);
      return updated;
    });

    // Set as active if high priority
    if (priority === 'high' || priority === 'critical') {
      setActiveBroadcast(newBroadcast);
    }

    return newBroadcast;
  }, [maxMessages, saveBroadcasts]);

  // Remove a broadcast message
  const removeBroadcast = useCallback((broadcastId) => {
    setBroadcasts(prev => {
      const updated = prev.filter(b => b.id !== broadcastId);
      saveBroadcasts(updated);
      return updated;
    });

    if (activeBroadcast?.id === broadcastId) {
      setActiveBroadcast(null);
    }
  }, [activeBroadcast, saveBroadcasts]);

  // Clear all broadcasts
  const clearAllBroadcasts = useCallback(() => {
    setBroadcasts([]);
    setActiveBroadcast(null);
    localStorage.removeItem('kn_admin_broadcasts');
  }, []);

  // Dismiss active broadcast
  const dismissActiveBroadcast = useCallback(() => {
    setActiveBroadcast(null);
  }, []);

  // Get highest priority broadcast
  const getHighestPriorityBroadcast = useCallback(() => {
    if (broadcasts.length === 0) return null;

    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    
    return broadcasts.reduce((highest, current) => {
      if (!highest) return current;
      
      const currentPriority = priorityOrder[current.priority] || 0;
      const highestPriority = priorityOrder[highest.priority] || 0;
      
      return currentPriority > highestPriority ? current : highest;
    }, null);
  }, [broadcasts]);

  // Check for broadcast updates (simulate server polling)
  const checkForUpdates = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call to check for new broadcasts
      // In a real implementation, this would call an API endpoint
      const mockBroadcasts = await simulateBroadcastAPI();
      
      if (mockBroadcasts && mockBroadcasts.length > 0) {
        mockBroadcasts.forEach(broadcast => {
          addBroadcast(
            broadcast.message,
            broadcast.type,
            broadcast.priority,
            broadcast.duration
          );
        });
      }

    } catch (err) {
      console.error('❌ Error checking for broadcast updates:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, addBroadcast]);

  // Simulate broadcast API (for development/testing)
  const simulateBroadcastAPI = useCallback(async () => {
    // Simulate random broadcast generation for testing
    const shouldGenerate = Math.random() < 0.1; // 10% chance
    
    if (!shouldGenerate) return [];

    const sampleBroadcasts = [
      {
        message: "Coffee break extended by 15 minutes",
        type: "info",
        priority: "normal",
        duration: 15 * 60 * 1000 // 15 minutes
      },
      {
        message: "Session starting in 5 minutes - please take your seats",
        type: "warning",
        priority: "high",
        duration: 5 * 60 * 1000 // 5 minutes
      },
      {
        message: "URGENT: Room change for next session - check your schedule",
        type: "urgent",
        priority: "critical",
        duration: 10 * 60 * 1000 // 10 minutes
      }
    ];

    return [sampleBroadcasts[Math.floor(Math.random() * sampleBroadcasts.length)]];
  }, []);

  // Initialize broadcasts
  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  // Set up polling for broadcast updates
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForUpdates();

    // Set up interval
    const interval = setInterval(checkForUpdates, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, checkForUpdates]);

  // Update active broadcast based on highest priority
  useEffect(() => {
    const highestPriority = getHighestPriorityBroadcast();
    
    if (highestPriority && (!activeBroadcast || highestPriority.priority !== activeBroadcast.priority)) {
      setActiveBroadcast(highestPriority);
    }
  }, [broadcasts, getHighestPriorityBroadcast, activeBroadcast]);

  // Clean up expired broadcasts
  useEffect(() => {
    const cleanup = () => {
      const now = new Date();
      setBroadcasts(prev => {
        const active = prev.filter(broadcast => 
          !broadcast.expiresAt || new Date(broadcast.expiresAt) > now
        );
        
        if (active.length !== prev.length) {
          saveBroadcasts(active);
        }
        
        return active;
      });
    };

    // Clean up every minute
    const interval = setInterval(cleanup, 60000);
    
    return () => clearInterval(interval);
  }, [saveBroadcasts]);

  return {
    broadcasts,
    activeBroadcast,
    isLoading,
    error,
    addBroadcast,
    removeBroadcast,
    clearAllBroadcasts,
    dismissActiveBroadcast,
    getHighestPriorityBroadcast,
    checkForUpdates
  };
};

export default useAdminBroadcasts;
