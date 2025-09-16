/**
 * useCountdown Hook
 * Provides real-time countdown functionality for sessions with admin broadcast integration
 * Story 2.1: Now/Next Glance Card - Task 2 & 6
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import TimeService from '../services/timeService';

/**
 * Format time remaining into human-readable string
 * @param {number} milliseconds - Time remaining in milliseconds
 * @returns {string} Formatted countdown string
 */
const formatCountdown = (milliseconds) => {
  if (milliseconds <= 0) return '0 minutes left';
  
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else if (minutes > 0) {
    return `${minutes} minutes left`;
  } else {
    return 'Less than 1 minute left';
  }
};

/**
 * Get current time (supports time override for dev/staging)
 * @returns {Date} Current time or override time
 */
const getCurrentTime = () => {
  return TimeService.getCurrentTime();
};

/**
 * useCountdown Hook
 * @param {Date|string} endTime - End time for countdown
 * @param {Object} options - Configuration options
 * @returns {Object} Countdown state and utilities
 */
export const useCountdown = (endTime, options = {}) => {
  const {
    updateInterval = 60000, // 1 minute default
    onComplete = null,
    onTick = null,
    enabled = true,
    enableBroadcastIntegration = true
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!endTime) return 0;
    
    const end = new Date(endTime);
    const now = getCurrentTime();
    const remaining = end.getTime() - now.getTime();
    
    return Math.max(0, remaining);
  }, [endTime]);

  // Update countdown
  const updateCountdown = useCallback(() => {
    const remaining = calculateTimeRemaining();
    const now = Date.now();
    
    setTimeRemaining(remaining);
    setIsActive(remaining > 0);
    setIsComplete(remaining <= 0);
    
    // Call onTick callback if provided and enough time has passed
    if (onTick && now - lastUpdateRef.current >= updateInterval) {
      onTick(remaining);
      lastUpdateRef.current = now;
    }
    
    // Call onComplete callback if countdown finished
    if (remaining <= 0 && onComplete) {
      onComplete();
    }
  }, [calculateTimeRemaining, onTick, onComplete, updateInterval]);

  // Start/stop countdown based on enabled state
  useEffect(() => {
    if (!enabled || !endTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial update
    updateCountdown();

    // Set up interval
    intervalRef.current = setInterval(updateCountdown, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, endTime, updateInterval, updateCountdown]);

  // Handle app focus/blur for real-time updates
  useEffect(() => {
    const handleFocus = () => {
      if (enabled && endTime) {
        updateCountdown();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && endTime) {
        updateCountdown();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, endTime, updateCountdown]);

  // Integration with admin broadcasts for countdown updates
  useEffect(() => {
    if (!enableBroadcastIntegration || !enabled || !endTime) return;

    const handleBroadcastUpdate = (event) => {
      // Listen for broadcast countdown updates
      if (event.detail && event.detail.type === 'countdown_update') {
        updateCountdown();
      }
    };

    window.addEventListener('broadcastUpdate', handleBroadcastUpdate);

    return () => {
      window.removeEventListener('broadcastUpdate', handleBroadcastUpdate);
    };
  }, [enableBroadcastIntegration, enabled, endTime, updateCountdown]);

  return {
    timeRemaining,
    formattedTime: formatCountdown(timeRemaining),
    isActive,
    isComplete,
    minutesRemaining: Math.floor(timeRemaining / (1000 * 60)),
    hoursRemaining: Math.floor(timeRemaining / (1000 * 60 * 60))
  };
};

export default useCountdown;
