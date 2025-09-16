/**
 * Centralized Time Service
 * Provides consistent time management across the application
 * Supports time override for development, staging, and testing environments
 */

class TimeService {
  static STORAGE_KEY = 'kn_time_override';
  static OVERRIDE_START_KEY = 'kn_time_override_start';
  static OVERRIDE_OFFSET_KEY = 'kn_time_override_offset';

  /**
   * Get current time (supports time override for dev/staging/test)
   * @returns {Date} Current time or override time with progression
   */
  static getCurrentTime() {
    if (this.isOverrideEnabled()) {
      // First try dynamic override time (auto-advancing)
      const dynamicTime = this.getDynamicOverrideTime();
      if (dynamicTime) {
        return dynamicTime;
      }
      
      // Fallback to static override time
      const overrideTime = this.getOverrideTime();
      if (overrideTime) {
        // Calculate current time based on override time progression
        const now = new Date();
        const storedOverrideTime = this.getStoredOverrideTime();
        if (storedOverrideTime) {
          // Calculate elapsed time since the override was set
          const timeSinceOverride = now.getTime() - storedOverrideTime.timestamp;
          const currentOverrideTime = new Date(storedOverrideTime.overrideTime.getTime() + timeSinceOverride);
          return currentOverrideTime;
        }
        return overrideTime;
      }
    }
    return new Date();
  }

  /**
   * Get dynamic override time (advances from start time)
   * @returns {Date} Current dynamic override time
   */
  static getDynamicOverrideTime() {
    try {
      const startTimeStr = localStorage.getItem(this.OVERRIDE_START_KEY);
      const offsetStr = localStorage.getItem(this.OVERRIDE_OFFSET_KEY);
      
      if (!startTimeStr || !offsetStr) {
        return null;
      }
      
      const startTime = new Date(startTimeStr);
      const offsetMs = parseInt(offsetStr, 10);
      
      if (isNaN(startTime.getTime()) || isNaN(offsetMs)) {
        return null;
      }
      
      // Calculate current time based on start time + elapsed real time
      const now = new Date();
      const elapsedMs = now.getTime() - offsetMs;
      const currentOverrideTime = new Date(startTime.getTime() + elapsedMs);
      
      return currentOverrideTime;
    } catch (error) {
      console.warn('⚠️ Failed to get dynamic override time:', error);
      return null;
    }
  }

  /**
   * Check if time override is enabled for current environment
   * @returns {boolean} Whether override is enabled
   */
  static isOverrideEnabled() {
    return process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === 'test';
  }

  /**
   * Get stored override time from localStorage
   * @returns {Date|null} Override time or null if not set or invalid
   */
  static getOverrideTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      const date = new Date(data.overrideTime);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid override time in localStorage, clearing it:', stored);
        this.clearOverrideTime();
        return null;
      }
      
      return date;
    } catch (error) {
      console.warn('⚠️ Failed to get override time from localStorage:', error);
      return null;
    }
  }

  /**
   * Get stored override time with timestamp for progression calculation
   * @returns {Object|null} Override time data or null if not set
   */
  static getStoredOverrideTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      const date = new Date(data.overrideTime);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid override time in localStorage, clearing it:', stored);
        this.clearOverrideTime();
        return null;
      }
      
      return {
        overrideTime: date,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.warn('⚠️ Failed to get stored override time from localStorage:', error);
      return null;
    }
  }

  /**
   * Set time override in localStorage
   * @param {Date} dateTime - The override date/time
   */
  static setOverrideTime(dateTime) {
    try {
      const data = {
        overrideTime: dateTime.toISOString(),
        timestamp: new Date().getTime()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      // Emit custom event for same-tab listeners
      const event = new CustomEvent('timeOverrideChanged', {
        detail: { newTime: dateTime, action: 'set' }
      });
      
      
      window.dispatchEvent(event);
    } catch (error) {
      console.error('❌ Failed to set override time in localStorage:', error);
      // Don't throw in production, just log the error
      if (process.env.NODE_ENV === 'test') {
        throw error;
      }
    }
  }

  /**
   * Set dynamic time override (auto-advancing from start time)
   * @param {Date} startDateTime - The start date/time for the override
   * @param {number} startSeconds - Seconds to start at (default: 50)
   */
  static setDynamicOverrideTime(startDateTime, startSeconds = 50) {
    try {
      // Set the start time at the specified seconds
      const adjustedStartTime = new Date(startDateTime);
      adjustedStartTime.setSeconds(startSeconds);
      
      // Store the start time and current real time offset
      localStorage.setItem(this.OVERRIDE_START_KEY, adjustedStartTime.toISOString());
      localStorage.setItem(this.OVERRIDE_OFFSET_KEY, new Date().getTime().toString());
      
      // Clear static override if it exists
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Emit custom event for same-tab listeners
      const event = new CustomEvent('timeOverrideChanged', {
        detail: { newTime: adjustedStartTime, action: 'setDynamic' }
      });
      
      
      window.dispatchEvent(event);
    } catch (error) {
      console.error('❌ Failed to set dynamic override time:', error);
      throw error;
    }
  }

  /**
   * Clear time override from localStorage
   */
  static clearOverrideTime() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.OVERRIDE_START_KEY);
      localStorage.removeItem(this.OVERRIDE_OFFSET_KEY);
      
      // Emit custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent('timeOverrideChanged', {
        detail: { newTime: null, action: 'clear' }
      }));
      
    } catch (error) {
      console.warn('⚠️ Failed to clear override time from localStorage:', error);
      // Don't throw in production, just log the error
      if (process.env.NODE_ENV === 'test') {
        throw error;
      }
    }
  }

  /**
   * Check if time override is currently active
   * @returns {boolean} Whether override is active
   */
  static isOverrideActive() {
    if (!this.isOverrideEnabled()) return false;
    
    // Check for dynamic override first
    const dynamicTime = this.getDynamicOverrideTime();
    if (dynamicTime) return true;
    
    // Check for static override
    const staticTime = this.getOverrideTime();
    return staticTime !== null;
  }

  /**
   * Get time override status for display
   * @returns {Object} Status information
   */
  static getOverrideStatus() {
    const isActive = this.isOverrideActive();
    const overrideTime = this.getOverrideTime();
    const realTime = new Date();
    const currentTime = this.getCurrentTime();

    return {
      isActive,
      overrideTime: isActive ? overrideTime : null,
      currentTime: isActive ? currentTime : realTime,
      realTime,
      environment: process.env.NODE_ENV
    };
  }
}

export default TimeService;
