/**
 * Authentication Sync Service
 * Single coordinated sync operation after successful authentication
 * 
 * This service replaces multiple separate sync operations during authentication
 * to prevent race conditions and ensure clean cache population.
 */
import { BaseService } from './baseService'

export interface AuthenticationSyncResult {
  success: boolean
  error?: string
  syncedTables: string[]
  totalRecords: number
}

export class AuthenticationSyncService extends BaseService {
  private static instance: AuthenticationSyncService
  
  static getInstance(): AuthenticationSyncService {
    if (!AuthenticationSyncService.instance) {
      AuthenticationSyncService.instance = new AuthenticationSyncService()
    }
    return AuthenticationSyncService.instance
  }
  
  /**
   * Perform single coordinated sync after authentication
   * This replaces multiple separate sync operations
   */
  async syncAfterAuthentication(): Promise<AuthenticationSyncResult> {
    try {
      console.log('🔄 AuthenticationSync: Starting coordinated sync after authentication...')
      
      // Import services dynamically to avoid circular dependencies
      const { serverDataSyncService } = await import('./serverDataSyncService')
      const { attendeeSyncService } = await import('./attendeeSyncService')
      const { serviceOrchestrator } = await import('./serviceOrchestrator')
      
      const syncedTables: string[] = []
      let totalRecords = 0
      
      // Step 1: Ensure all services are initialized via ServiceOrchestrator
      console.log('🔄 AuthenticationSync: Ensuring all services are ready...')
      await serviceOrchestrator.ensureServicesReady()
      console.log('✅ AuthenticationSync: All services initialized and ready')
      
      // Step 2: Sync core data (attendees, agenda items)
      console.log('🔄 AuthenticationSync: Syncing core data...')
      const coreSyncResult = await serverDataSyncService.syncAllData()
      
      if (coreSyncResult.success) {
        syncedTables.push(...coreSyncResult.syncedTables)
        totalRecords += coreSyncResult.totalRecords
        console.log('✅ AuthenticationSync: Core data sync completed')
      } else {
        console.warn('⚠️ AuthenticationSync: Core sync failed, continuing with limited data')
      }
      
      // Step 3: Sync attendee-specific data
      console.log('🔄 AuthenticationSync: Syncing attendee data...')
      try {
        await attendeeSyncService.refreshAttendeeData()
        syncedTables.push('attendee_sync')
        console.log('✅ AuthenticationSync: Attendee data sync completed')
      } catch (attendeeError) {
        console.warn('⚠️ AuthenticationSync: Attendee sync failed:', attendeeError)
      }
      
      // Step 4: Validate cache population
      const cacheValid = await this.validateCachePopulation()
      if (!cacheValid) {
        console.warn('⚠️ AuthenticationSync: Cache validation failed')
      }
      
      console.log('✅ AuthenticationSync: Coordinated sync completed successfully')
      return { 
        success: true, 
        syncedTables, 
        totalRecords 
      }
      
    } catch (error) {
      console.error('❌ AuthenticationSync: Coordinated sync failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication sync failed',
        syncedTables: [],
        totalRecords: 0
      }
    }
  }
  
  /**
   * Validate that cache was populated correctly
   */
  private async validateCachePopulation(): Promise<boolean> {
    try {
      const requiredKeys = ['kn_cache_agenda_items', 'kn_cache_attendees']
      const missingKeys: string[] = []
      
      for (const key of requiredKeys) {
        const cached = localStorage.getItem(key)
        if (!cached) {
          missingKeys.push(key)
        }
      }
      
      if (missingKeys.length > 0) {
        console.warn(`⚠️ AuthenticationSync: Missing cache keys: ${missingKeys.join(', ')}`)
        return false
      }
      
      console.log('✅ AuthenticationSync: Cache validation passed')
      return true
      
    } catch (error) {
      console.warn('⚠️ AuthenticationSync: Cache validation failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const authenticationSyncService = AuthenticationSyncService.getInstance()
