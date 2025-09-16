/**
 * Centralized Time Service
 * Provides consistent time management across the application
 * Supports time override for development, staging, and testing environments
 */

class TimeService {
  static STORAGE_KEY = 'kn_time_override';

  /**
   * Get current time (supports time override for dev/staging/test)
   * @returns {Date} Current time or override time
   */
  static getCurrentTime() {
    if (this.isOverrideEnabled()) {
      const overrideTime = this.getOverrideTime();
      if (overrideTime) {
        return overrideTime;
      }
    }
    return new Date();
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
      
      const date = new Date(stored);
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
   * Set time override in localStorage
   * @param {Date} dateTime - The override date/time
   */
  static setOverrideTime(dateTime) {
    try {
      localStorage.setItem(this.STORAGE_KEY, dateTime.toISOString());
      
      // Emit custom event for same-tab listeners
      const event = new CustomEvent('timeOverrideChanged', {
        detail: { newTime: dateTime, action: 'set' }
      });
      
      console.log('🕐 Time override set:', dateTime.toISOString());
      console.log('📡 Dispatching timeOverrideChanged event:', event);
      
      window.dispatchEvent(event);
    } catch (error) {
      console.error('❌ Failed to set override time in localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear time override from localStorage
   */
  static clearOverrideTime() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Emit custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent('timeOverrideChanged', {
        detail: { newTime: null, action: 'clear' }
      }));
      
      console.log('🕐 Time override cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear override time from localStorage:', error);
      throw error;
    }
  }

  /**
   * Check if time override is currently active
   * @returns {boolean} Whether override is active
   */
  static isOverrideActive() {
    return this.isOverrideEnabled() && this.getOverrideTime() !== null;
  }

  /**
   * Get time override status for display
   * @returns {Object} Status information
   */
  static getOverrideStatus() {
    const isActive = this.isOverrideActive();
    const overrideTime = this.getOverrideTime();
    const realTime = new Date();

    return {
      isActive,
      overrideTime: isActive ? overrideTime : null,
      realTime,
      environment: process.env.NODE_ENV
    };
  }
}

export default TimeService;
