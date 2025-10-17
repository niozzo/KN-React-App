/**
 * Cache Lifecycle Service
 * Validates cache state and enforces lifecycle rules
 * 
 * This service provides validation methods to ensure the cache lifecycle
 * is working correctly and provides debugging capabilities.
 */
import { BaseService } from './baseService'

export interface CacheValidationResult {
  isClean: boolean
  isPopulated: boolean
  issues: string[]
  cacheKeys: string[]
  authState: boolean
}

export class CacheLifecycleService extends BaseService {
  private static instance: CacheLifecycleService
  
  static getInstance(): CacheLifecycleService {
    if (!CacheLifecycleService.instance) {
      CacheLifecycleService.instance = new CacheLifecycleService()
    }
    return CacheLifecycleService.instance
  }
  
  /**
   * Validate cache is in clean state (should be called on login page)
   */
  validateCleanState(): { isClean: boolean; issues: string[] } {
    const issues: string[] = []
    
    try {
      // Check for any cache entries
      const cacheKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('kn_cache_')) {
          cacheKeys.push(key)
        }
      }
      
      if (cacheKeys.length > 0) {
        issues.push(`Found ${cacheKeys.length} cache entries in clean state: ${cacheKeys.join(', ')}`)
      }
      
      // Check for authentication state
      if (localStorage.getItem('conference_auth')) {
        issues.push('Found authentication state in clean state')
      }
      
      return {
        isClean: issues.length === 0,
        issues
      }
      
    } catch (error) {
      return {
        isClean: false,
        issues: [`Cache validation failed: ${error}`]
      }
    }
  }
  
  /**
   * Validate cache is populated (should be called after authentication)
   */
  validatePopulatedState(): { isPopulated: boolean; issues: string[] } {
    const issues: string[] = []
    const requiredKeys = ['kn_cache_agenda_items', 'kn_cache_attendees']
    
    try {
      for (const key of requiredKeys) {
        const cached = localStorage.getItem(key)
        if (!cached) {
          issues.push(`Missing required cache key: ${key}`)
        }
      }
      
      return {
        isPopulated: issues.length === 0,
        issues
      }
      
    } catch (error) {
      return {
        isPopulated: false,
        issues: [`Cache validation failed: ${error}`]
      }
    }
  }
  
  /**
   * Get comprehensive cache state for debugging
   */
  getCacheState(): CacheValidationResult {
    const issues: string[] = []
    const cacheKeys: string[] = []
    
    try {
      // Get all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('kn_cache_')) {
          cacheKeys.push(key)
        }
      }
      
      // Check authentication state
      const authState = !!localStorage.getItem('conference_auth')
      
      // Validate clean state
      const cleanValidation = this.validateCleanState()
      if (!cleanValidation.isClean) {
        issues.push(...cleanValidation.issues)
      }
      
      // Validate populated state
      const populatedValidation = this.validatePopulatedState()
      if (!populatedValidation.isPopulated) {
        issues.push(...populatedValidation.issues)
      }
      
      return {
        isClean: cleanValidation.isClean,
        isPopulated: populatedValidation.isPopulated,
        issues,
        cacheKeys,
        authState
      }
      
    } catch (error) {
      return {
        isClean: false,
        isPopulated: false,
        issues: [`Cache state validation failed: ${error}`],
        cacheKeys: [],
        authState: false
      }
    }
  }
  
  /**
   * Force clean cache state (for debugging)
   */
  forceCleanCache(): { success: boolean; clearedKeys: string[] } {
    try {
      const clearedKeys: string[] = []
      
      // Clear all cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('kn_cache_') ||
          key.startsWith('kn_cached_') ||
          key.startsWith('kn_sync_') ||
          key.startsWith('kn_conflicts') ||
          key.startsWith('sb-') ||
          key.includes('supabase')
        )) {
          localStorage.removeItem(key)
          clearedKeys.push(key)
        }
      }
      
      // Clear authentication state
      localStorage.removeItem('conference_auth')
      
      console.log(`🧹 ForceCleanCache: Cleared ${clearedKeys.length} cache entries`)
      return { success: true, clearedKeys }
      
    } catch (error) {
      console.error('❌ ForceCleanCache: Failed to clear cache:', error)
      return { success: false, clearedKeys: [] }
    }
  }
  
  /**
   * Log cache state for debugging
   */
  logCacheState(): void {
    const state = this.getCacheState()
    
    console.log('📊 Cache State Debug Info:')
    console.log(`  Clean: ${state.isClean}`)
    console.log(`  Populated: ${state.isPopulated}`)
    console.log(`  Auth State: ${state.authState}`)
    console.log(`  Cache Keys: ${state.cacheKeys.length}`)
    console.log(`  Issues: ${state.issues.length}`)
    
    if (state.issues.length > 0) {
      console.log('  Issues:', state.issues)
    }
    
    if (state.cacheKeys.length > 0) {
      console.log('  Cache Keys:', state.cacheKeys)
    }
  }
}

// Export singleton instance
export const cacheLifecycleService = CacheLifecycleService.getInstance()
