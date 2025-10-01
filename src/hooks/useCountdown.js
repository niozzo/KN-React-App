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
 * @param {boolean} isCoffeeBreak - Whether this is a coffee break (special formatting)
 * @returns {string} Formatted countdown string
 */
const formatCountdown = (milliseconds, isCoffeeBreak = false) => {
  if (milliseconds <= 0) return '0 minutes left';
  
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  
  // Coffee break special formatting: show minutes:seconds when under 5 minutes
  if (isCoffeeBreak && totalMinutes < 5) {
    if (totalMinutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')} left`;
    } else {
      return `${seconds} seconds left`;
    }
  }
  
  // Regular formatting
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
    enableBroadcastIntegration = true,
    isCoffeeBreak = false, // Special handling for coffee breaks
    startTime = null // Start time for smart countdown logic
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // Dynamic update interval for coffee breaks
  const getUpdateInterval = useCallback(() => {
    if (!isCoffeeBreak) return updateInterval;
    
    const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
    // Update every second when under 5 minutes for coffee breaks
    return totalMinutes < 5 ? 1000 : updateInterval;
  }, [isCoffeeBreak, timeRemaining, updateInterval]);

  // Calculate time remaining with smart time override handling
  const calculateTimeRemaining = useCallback(() => {
    if (!endTime) return 0;
    
    const end = new Date(endTime);
    const now = getCurrentTime();
    
    // Smart countdown logic for time overrides during development
    if (startTime) {
      const start = new Date(startTime);
      
      // 🔧 FIX: Align with session status logic - only check if session is active
      // Session status logic: currentTime >= start && currentTime <= end
      // So we should show countdown if we're within the session time range
      if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) {
        // If current time is during the session, calculate remaining time
        const remaining = end.getTime() - now.getTime();
        return Math.max(0, remaining);
      }
      
      // If we're outside the session time range, don't show countdown
      return 0;
    }
    
    // Fallback to original logic for sessions without start time
    const remaining = end.getTime() - now.getTime();
    return Math.max(0, remaining);
  }, [endTime, startTime]);

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

    // Set up interval with dynamic update rate
    const currentInterval = getUpdateInterval();
    intervalRef.current = setInterval(updateCountdown, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, endTime, updateInterval, updateCountdown, getUpdateInterval]);

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
    formattedTime: formatCountdown(timeRemaining, isCoffeeBreak),
    isActive,
    isComplete,
    minutesRemaining: Math.floor(timeRemaining / (1000 * 60)),
    hoursRemaining: Math.floor(timeRemaining / (1000 * 60 * 60))
  };
};

export default useCountdown;
