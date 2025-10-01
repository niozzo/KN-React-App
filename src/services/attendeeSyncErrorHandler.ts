/**
 * Attendee Sync Error Handler
 * 
 * Provides comprehensive error handling and retry logic for attendee
 * data synchronization operations.
 */

import type { AttendeeSyncResult } from './attendeeSyncService';

export class AttendeeSyncErrorHandler {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;
  
  /**
   * Handle attendee sync errors with retry logic
   */
  static async handleSyncError(
    error: Error, 
    retryCallback: () => Promise<AttendeeSyncResult>
  ): Promise<AttendeeSyncResult> {
    console.error('❌ Attendee sync error:', error);
    
    // Check if error is retryable
    if (this.isRetryableError(error)) {
      return await this.retryWithBackoff(retryCallback);
    }
    
    // Non-retryable error - return fallback
    return this.getFallbackResult(error);
  }
  
  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ServiceUnavailableError',
      'RateLimitError'
    ];
    
    return retryableErrors.some(errorType => 
      error.name.includes(errorType) || error.message.includes(errorType)
    );
  }
  
  /**
   * Retry with exponential backoff
   */
  private static async retryWithBackoff(
    retryCallback: () => Promise<AttendeeSyncResult>
  ): Promise<AttendeeSyncResult> {
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        const result = await retryCallback();
        
        if (result.success) {
          console.log(`✅ Attendee sync succeeded on attempt ${attempt}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Attendee sync attempt ${attempt} failed:`, error);
      }
    }
    
    return this.getFallbackResult(new Error('Max retry attempts exceeded'));
  }
  
  /**
   * Get fallback result when sync fails
   */
  private static getFallbackResult(error: Error): AttendeeSyncResult {
    return {
      success: false,
      error: error.message,
      lastSync: null,
      syncVersion: 'fallback'
    };
  }
  
  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
