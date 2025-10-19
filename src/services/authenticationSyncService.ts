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
      
      // Step 1.5: Wait for Company Normalization Service to be fully ready
      console.log('🔄 AuthenticationSync: Verifying Company Normalization Service is ready...')
      const { CompanyNormalizationService } = await import('./companyNormalizationService')
      const companyService = CompanyNormalizationService.getInstance()
      
      // Wait until service is actually initialized (with timeout)
      let attempts = 0
      const maxAttempts = 100 // 1 second timeout
      while (!companyService.isInitialized && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10))
        attempts++
      }
      
      if (!companyService.isInitialized) {
        console.warn('⚠️ AuthenticationSync: Company Normalization Service not ready after 1s, proceeding anyway')
      } else {
        console.log('✅ AuthenticationSync: Company Normalization Service confirmed ready')
      }
      
      // Step 2: Parallel sync of core data and attendee data
      console.log('🔄 AuthenticationSync: Starting parallel sync operations...')
      
      const [coreSyncResult, attendeeSyncResult] = await Promise.allSettled([
        // Core data sync (attendees, agenda items, etc.)
        serverDataSyncService.syncAllData(),
        // Attendee-specific data refresh
        attendeeSyncService.refreshAttendeeData()
      ])
      
      // Process core sync result
      if (coreSyncResult.status === 'fulfilled' && coreSyncResult.value.success) {
        syncedTables.push(...coreSyncResult.value.syncedTables)
        totalRecords += coreSyncResult.value.totalRecords
        console.log('✅ AuthenticationSync: Core data sync completed')
      } else {
        const error = coreSyncResult.status === 'rejected' ? coreSyncResult.reason : coreSyncResult.value?.errors
        console.warn('⚠️ AuthenticationSync: Core sync failed:', error)
      }
      
      // Process attendee sync result
      if (attendeeSyncResult.status === 'fulfilled') {
        syncedTables.push('attendee_sync')
        console.log('✅ AuthenticationSync: Attendee data sync completed')
      } else {
        console.warn('⚠️ AuthenticationSync: Attendee sync failed:', attendeeSyncResult.reason)
      }
      
      // Step 4: Sync user-specific seat assignments (now that auth is complete)
      console.log('🔄 AuthenticationSync: Syncing user-specific seat assignments...')
      try {
        // DIRECT APPROACH: Call the user-specific method directly
        const supabaseClient = await serverDataSyncService.getAuthenticatedClient()
        const seatAssignments = await serverDataSyncService.syncUserSeatAssignments(supabaseClient)
        syncedTables.push('seat_assignments')
        totalRecords += seatAssignments.length
        console.log(`✅ AuthenticationSync: User-specific seat assignments sync completed (${seatAssignments.length} records)`)
      } catch (seatError) {
        console.warn('⚠️ AuthenticationSync: Seat assignments sync failed:', seatError)
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
