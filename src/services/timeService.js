/**
 * Centralized Time Service
 * Provides consistent time management across the application
 * Supports time override for development, staging, and testing environments
 */

class TimeService {
  static STORAGE_KEY = 'kn_time_override';
  static OVERRIDE_START_KEY = 'kn_time_override_start';
  static OVERRIDE_OFFSET_KEY = 'kn_time_override_offset';
  
  // Session boundary detection
  static _sessionBoundaries = new Set();
  static _lastCheckedTime = null;
  static _boundaryCheckInterval = null;

  /**
   * Get current time (supports time override for dev/staging/test)
   * @returns {Date} Current time or override time with progression
   */
  static getCurrentTime() {
    if (this.isOverrideEnabled()) {
      // First try static override time (for tests)
      const overrideTime = this.getOverrideTime();
      if (overrideTime) {
        return overrideTime;
      }
      
      // Fallback to dynamic override time (auto-advancing)
      const dynamicTime = this.getDynamicOverrideTime();
      if (dynamicTime) {
        return dynamicTime;
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
    // Allow time override in all environments for testing
    return true;
  }

  /**
   * Get stored override time from localStorage
   * @returns {Date|null} Override time or null if not set or invalid
   */
  static getOverrideTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      // Handle both simple string format and complex object format
      let date;
      try {
        const data = JSON.parse(stored);
        if (data.overrideTime) {
          date = new Date(data.overrideTime);
        } else {
          date = new Date(data);
        }
      } catch (parseError) {
        // If JSON parsing fails, try as direct string
        date = new Date(stored);
      }
      
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
   * Get current dynamic override start time
   * @returns {Date|null} Start time of current dynamic override or null if not set
   */
  static getOverrideStartTime() {
    try {
      const startTimeStr = localStorage.getItem(this.OVERRIDE_START_KEY);
      if (!startTimeStr) return null;
      
      const startTime = new Date(startTimeStr);
      if (isNaN(startTime.getTime())) {
        console.warn('⚠️ Invalid override start time in localStorage, clearing it:', startTimeStr);
        this.clearOverrideTime();
        return null;
      }
      
      return startTime;
    } catch (error) {
      console.warn('⚠️ Failed to get override start time from localStorage:', error);
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
      
      // Start monitoring for session boundary crossings
      this.startBoundaryMonitoring();
    } catch (error) {
      console.error('❌ Failed to set override time in localStorage:', error);
      // Don't throw in any environment, just log the error
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
      
      // Stop monitoring for session boundary crossings
      this.stopBoundaryMonitoring();
      
      // Emit custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent('timeOverrideChanged', {
        detail: { newTime: null, action: 'clear' }
      }));
      
    } catch (error) {
      console.warn('⚠️ Failed to clear override time from localStorage:', error);
      // Don't throw in any environment, just log the error
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
   * Register session boundaries for time override monitoring
   * @param {Array} sessions - Array of session objects with start_time and end_time
   */
  static registerSessionBoundaries(sessions) {
    this._sessionBoundaries.clear();
    
    if (!sessions || !Array.isArray(sessions)) {
      return;
    }
    
    sessions.forEach(session => {
      if (session.start_time && session.date) {
        const startTime = new Date(`${session.date}T${session.start_time}`);
        this._sessionBoundaries.add(startTime.getTime());
      }
      if (session.end_time && session.date) {
        const endTime = new Date(`${session.date}T${session.end_time}`);
        this._sessionBoundaries.add(endTime.getTime());
      }
    });
    
    console.log('🕐 Registered session boundaries:', Array.from(this._sessionBoundaries).map(ts => new Date(ts).toISOString()));
  }

  /**
   * Check if current time has crossed any session boundaries
   * @param {Date} currentTime - Current time to check
   * @returns {boolean} Whether a boundary was crossed
   */
  static checkSessionBoundaryCrossing(currentTime) {
    if (!this.isOverrideActive() || this._sessionBoundaries.size === 0) {
      return false;
    }
    
    const currentTimeMs = currentTime.getTime();
    const lastCheckedMs = this._lastCheckedTime ? this._lastCheckedTime.getTime() : currentTimeMs;
    
    // Check if we've crossed any boundaries since last check
    let boundaryCrossed = false;
    for (const boundaryMs of this._sessionBoundaries) {
      // Check if we've crossed this boundary (either way)
      if ((lastCheckedMs < boundaryMs && currentTimeMs >= boundaryMs) ||
          (lastCheckedMs > boundaryMs && currentTimeMs <= boundaryMs)) {
        boundaryCrossed = true;
        console.log('🕐 Session boundary crossed:', {
          boundary: new Date(boundaryMs).toISOString(),
          lastChecked: new Date(lastCheckedMs).toISOString(),
          current: new Date(currentTimeMs).toISOString()
        });
        break;
      }
    }
    
    this._lastCheckedTime = new Date(currentTime);
    return boundaryCrossed;
  }

  /**
   * Start monitoring for session boundary crossings
   */
  static startBoundaryMonitoring() {
    if (this._boundaryCheckInterval) {
      clearInterval(this._boundaryCheckInterval);
    }
    
    // Only monitor if override is active
    if (!this.isOverrideActive()) {
      return;
    }
    
    this._boundaryCheckInterval = setInterval(() => {
      const currentTime = this.getCurrentTime();
      if (this.checkSessionBoundaryCrossing(currentTime)) {
        // Emit event when boundary is crossed
        const event = new CustomEvent('timeOverrideBoundaryCrossed', {
          detail: { 
            currentTime: currentTime,
            action: 'boundaryCrossed' 
          }
        });
        window.dispatchEvent(event);
      }
    }, 1000); // Check every second
  }

  /**
   * Stop monitoring for session boundary crossings
   */
  static stopBoundaryMonitoring() {
    if (this._boundaryCheckInterval) {
      clearInterval(this._boundaryCheckInterval);
      this._boundaryCheckInterval = null;
    }
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
      overrideTime: isActive ? currentTime : null,
      currentTime: isActive ? currentTime : realTime,
      realTime,
      environment: process.env.NODE_ENV
    };
  }
}

// Expose TimeService globally for console access in production
if (typeof window !== 'undefined') {
  window.TimeService = TimeService;
}

export default TimeService;
