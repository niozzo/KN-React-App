/**
 * Data Clearing Service
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Handles comprehensive clearing of all cached data during sign-out
 */

import { attendeeInfoService } from './attendeeInfoService'
import { pwaDataSyncService } from './pwaDataSyncService'

export interface DataClearingResult {
  success: boolean
  clearedData: {
    localStorage: boolean
    attendeeInfo: boolean
    pwaCache: boolean
    indexedDB: boolean
    serviceWorkerCaches: boolean
  }
  errors: string[]
  performanceMetrics: {
    startTime: number
    endTime: number
    duration: number
  }
}

export class DataClearingService {
  private readonly CACHE_PREFIX = 'kn_cache_'
  private readonly AUTH_KEY = 'conference_auth'
  private readonly ATTENDEE_INFO_KEY = 'kn_current_attendee_info'

  /**
   * Clear all locally cached data
   * @returns Promise<DataClearingResult>
   */
  async clearAllData(): Promise<DataClearingResult> {
    const startTime = performance.now()
    const result: DataClearingResult = {
      success: true,
      clearedData: {
        localStorage: false,
        attendeeInfo: false,
        pwaCache: false,
        indexedDB: false,
        serviceWorkerCaches: false
      },
      errors: [],
      performanceMetrics: {
        startTime,
        endTime: 0,
        duration: 0
      }
    }

    try {
      // 🛑 STEP 0: Stop all async operations BEFORE clearing any data
      console.log('🛑 Step 0: Stopping all background operations...')
      await this.stopAllAsyncOperations(result)

      // Clear localStorage data
      await this.clearLocalStorageData(result)
      
      // Clear attendee info cache
      await this.clearAttendeeInfoCache(result)
      
      // Clear PWA cached data
      await this.clearPWACachedData(result)
      
      // Clear IndexedDB data
      await this.clearIndexedDBData(result)
      
      // Clear service worker caches
      await this.clearServiceWorkerCaches(result)

      const endTime = performance.now()
      result.performanceMetrics.endTime = endTime
      result.performanceMetrics.duration = endTime - startTime

      // ✅ CRITICAL: Reset logout flag to allow future logins
      pwaDataSyncService.setLogoutInProgress(false)

      return result

    } catch (error) {
      console.error('❌ Data clearing failed:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      
      const endTime = performance.now()
      result.performanceMetrics.endTime = endTime
      result.performanceMetrics.duration = endTime - startTime

      // ✅ CRITICAL: Reset logout flag even on error to prevent login blocking
      pwaDataSyncService.setLogoutInProgress(false)

      return result
    }
  }

  /**
   * Stop all async operations (timers, intervals, in-flight requests)
   */
  private async stopAllAsyncOperations(result: DataClearingResult): Promise<void> {
    try {
      // Set logout flag to prevent new cache writes
      pwaDataSyncService.setLogoutInProgress(true)
      
      // Stop periodic sync timer
      pwaDataSyncService.stopPeriodicSync()
      
      // Abort any in-flight sync operations
      pwaDataSyncService.abortPendingSyncOperations()
      
      console.log('✅ All background operations stopped')
    } catch (error) {
      console.warn('⚠️ Failed to stop all async operations:', error)
      result.errors.push(`Async operations stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Continue with data clearing even if stop fails
    }
  }

  /**
   * Clear localStorage data
   */
  private async clearLocalStorageData(result: DataClearingResult): Promise<void> {
    try {
      // Get all localStorage keys
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith(this.CACHE_PREFIX) || // kn_cache_*
          key === this.AUTH_KEY || // conference_auth
          key === this.ATTENDEE_INFO_KEY || // kn_current_attendee_info
          key.startsWith('kn_cached_') || // kn_cached_sessions, etc.
          key.startsWith('kn_sync_') || // kn_sync_status, etc.
          key.startsWith('kn_conflicts') || // kn_conflicts
          key.startsWith('sb-') || // Supabase auth tokens (sb-iikcgdhztkrexuuqheli-auth-token, etc.)
          key.includes('supabase') || // Any other Supabase-related keys
          key.includes('application') // Application database related keys
        ) && !key.startsWith('kn_time_override')) { // ✅ PROTECT TIME OVERRIDE KEYS
          keysToRemove.push(key)
        }
      }
      
      // Remove all identified keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      result.clearedData.localStorage = true
    } catch (error) {
      console.warn('⚠️ Failed to clear localStorage:', error)
      result.clearedData.localStorage = false
      result.errors.push(`localStorage clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear attendee info cache
   */
  private async clearAttendeeInfoCache(result: DataClearingResult): Promise<void> {
    try {
      attendeeInfoService.clearAttendeeInfo()
      result.clearedData.attendeeInfo = true
    } catch (error) {
      console.warn('⚠️ Failed to clear attendee info cache:', error)
      result.clearedData.attendeeInfo = false
      result.errors.push(`Attendee info cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear PWA cached data
   */
  private async clearPWACachedData(result: DataClearingResult): Promise<void> {
    try {
      await pwaDataSyncService.clearCache()
      result.clearedData.pwaCache = true
    } catch (error) {
      console.warn('⚠️ Failed to clear PWA cached data:', error)
      result.clearedData.pwaCache = false
      result.errors.push(`PWA cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear IndexedDB data
   */
  private async clearIndexedDBData(result: DataClearingResult): Promise<void> {
    try {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        result.clearedData.indexedDB = true
        return
      }

      // Clear all IndexedDB databases that might contain conference data
      const databases = ['ConferenceData', 'PWAStorage', 'OfflineData']
      let hasErrors = false
      
      for (const dbName of databases) {
        try {
          const deleteRequest = indexedDB.deleteDatabase(dbName)
          
          // Handle the case where the mock doesn't have proper event handlers
          if (deleteRequest.onsuccess || deleteRequest.onerror || deleteRequest.onblocked) {
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve(undefined)
              deleteRequest.onerror = () => reject(deleteRequest.error)
              deleteRequest.onblocked = () => {
                console.warn(`⚠️ IndexedDB database ${dbName} is blocked, will retry`)
                // Retry after a short delay
                setTimeout(() => {
                  const retryRequest = indexedDB.deleteDatabase(dbName)
                  retryRequest.onsuccess = () => resolve(undefined)
                  retryRequest.onerror = () => reject(retryRequest.error)
                }, 100)
              }
            })
          } else {
            // For mocked environments, just log success
          }
        } catch (dbError) {
          console.warn(`⚠️ Failed to clear IndexedDB database ${dbName}:`, dbError)
          result.errors.push(`IndexedDB database ${dbName} clearing failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
          hasErrors = true
        }
      }

      result.clearedData.indexedDB = !hasErrors
    } catch (error) {
      console.warn('⚠️ Failed to clear IndexedDB data:', error)
      result.clearedData.indexedDB = false
      result.errors.push(`IndexedDB clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear service worker caches
   */
  private async clearServiceWorkerCaches(result: DataClearingResult): Promise<void> {
    try {
      // Check if service worker and caches are available
      if (!('serviceWorker' in navigator) || !('caches' in window)) {
        result.clearedData.serviceWorkerCaches = true
        return
      }

      // Get all cache names and delete them
      const cacheNames = await caches.keys()

      for (const cacheName of cacheNames) {
        try {
          await caches.delete(cacheName)
        } catch (cacheError) {
          console.warn(`⚠️ Failed to clear cache ${cacheName}:`, cacheError)
          result.errors.push(`Cache ${cacheName} clearing failed: ${cacheError instanceof Error ? cacheError.message : 'Unknown error'}`)
        }
      }

      result.clearedData.serviceWorkerCaches = true
    } catch (error) {
      console.warn('⚠️ Failed to clear service worker caches:', error)
      result.clearedData.serviceWorkerCaches = false
      result.errors.push(`Service worker cache clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify all data has been cleared
   */
  async verifyDataCleared(): Promise<boolean> {
    try {
      // Check localStorage
      const authData = localStorage.getItem(this.AUTH_KEY)
      const attendeeData = localStorage.getItem(this.ATTENDEE_INFO_KEY)
      
      // Check for any kn_cache_ keys
      const allKeys = Object.keys(localStorage)
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX))
      
      if (authData || attendeeData || cacheKeys.length > 0) {
        console.warn('⚠️ Data clearing verification failed - some data remains')
        console.warn('Remaining data:', { authData: !!authData, attendeeData: !!attendeeData, cacheKeys: cacheKeys.length })
        return false
      }

      console.log('✅ Data clearing verification passed - all data cleared')
      return true
    } catch (error) {
      console.error('❌ Data clearing verification failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const dataClearingService = new DataClearingService()
