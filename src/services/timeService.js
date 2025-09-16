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
   * @returns {Date|null} Override time or null if not set
   */
  static getOverrideTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? new Date(stored) : null;
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
    } catch (error) {
      console.error('❌ Failed to set override time in localStorage:', error);
    }
  }

  /**
   * Clear time override from localStorage
   */
  static clearOverrideTime() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear override time from localStorage:', error);
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
