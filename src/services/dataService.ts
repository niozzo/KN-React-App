/**
 * Data Service for KnowledgeNow 2025 PWA
 * 
 * This service handles all database operations with READ-ONLY access.
 * All data requires authentication - no public data is available.
 * 
 * CRITICAL: READ-ONLY DATABASE ACCESS - We cannot modify any data
 */


// NOTE: All data access must go through server-side authenticated endpoints
// to comply with RLS. Do not use the Supabase anon client from the browser.
import { isUserAuthenticated } from './authService'
import { unifiedCacheService } from './unifiedCacheService'
import type { Attendee } from '../types/attendee'
import type { AgendaItem } from '../types/agenda'
import type { Sponsor } from '../types/sponsor'
import type { SeatAssignment } from '../types/seating'
import type { DiningOption } from '../types/dining'
import type { Hotel } from '../types/hotel'

/**
 * Base error class for data service errors
 */
class DataServiceError extends Error {
  public code?: string;
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'DataServiceError'
    this.code = code;
  }
}

/**
 * Check if user is authenticated before data access
 * @throws DataServiceError if not authenticated
 */
const requireAuthentication = (): void => {
  if (!isUserAuthenticated()) {
    throw new DataServiceError('Authentication required to access data', 'AUTH_REQUIRED')
  }
}

// Lightweight API client for backend endpoints
const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { credentials: 'include' })
  
  // Check content type before parsing to prevent HTML parsing errors
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    console.error(`❌ API returned non-JSON content: ${contentType} for path: ${path}`)
    throw new DataServiceError(`Expected JSON but got ${contentType || 'unknown content type'}`, 'INVALID_CONTENT_TYPE')
  }
  
  if (!response.ok) {
    // Try to parse structured error to detect backend auth issues
    try {
      const errJson = await response.json()
      if (errJson?.authRequired) {
        throw new DataServiceError('API request failed: backend auth required', 'BACKEND_AUTH_REQUIRED')
      }
    } catch (_) {
      // Ignore JSON parse failure and fall through to generic error
    }
    throw new DataServiceError(`API request failed: ${response.status} ${response.statusText}`, 'API_ERROR')
  }
  
  const json = await response.json()
  // Most endpoints return { success, data }
  return (json?.data ?? json) as T
}

/**
 * Get all attendees (shared data - same for all authenticated users)
 * @returns Array of all attendees
 */
export const getAllAttendees = async (): Promise<Attendee[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_attendees')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const attendees = cacheObj.data || cacheObj
        if (Array.isArray(attendees) && attendees.length > 0) {
          // Ensure stable ordering for UI
          return [...attendees].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendees data:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached data found, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncAttendees()
    console.log('🌐 SYNC: Synced', data.length, 'attendees from database')
    // Data is already filtered and cached by syncAttendees()
    // Ensure stable ordering for UI
    return [...data].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
  } catch (error) {
    console.error('❌ Error fetching attendees:', error)
    throw new DataServiceError('Failed to fetch attendees', 'FETCH_ERROR')
  }
}

/**
 * Get current authenticated attendee's data
 * @returns Current attendee data
 */
export const getCurrentAttendeeData = async (): Promise<Attendee | null> => {
  requireAuthentication()
  
  try {
    const current = (await import('./authService.js')).getCurrentAttendee?.()
    if (!current?.id) return null
    
    // PRIMARY: Check localStorage first (populated during login) - Architecture Compliant
    try {
      const cachedData = localStorage.getItem('kn_cache_attendees')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        
        // 🔍 DIAGNOSTIC: Log cache structure
        console.log('🔍 DIAGNOSTIC: Cache data type:', typeof cacheObj)
        console.log('🔍 DIAGNOSTIC: Cache data keys:', Object.keys(cacheObj))
        console.log('🔍 DIAGNOSTIC: Cache data sample:', JSON.stringify(cacheObj).substring(0, 200))
        
        // Handle both direct array format and wrapped format (Architecture Pattern)
        const attendees = cacheObj.data || cacheObj
        
        // 🔍 DIAGNOSTIC: Log attendees structure
        console.log('🔍 DIAGNOSTIC: Attendees type:', typeof attendees)
        console.log('🔍 DIAGNOSTIC: Is array:', Array.isArray(attendees))
        if (Array.isArray(attendees)) {
          console.log('🔍 DIAGNOSTIC: First attendee type:', typeof attendees[0])
          console.log('🔍 DIAGNOSTIC: First attendee keys:', attendees[0] ? Object.keys(attendees[0]) : 'empty')
        }
        
        const cachedAttendee = attendees.find((a: Attendee) => a.id === current.id)
        if (cachedAttendee) {
          console.log('✅ LOCALSTORAGE: Using cached attendee data from localStorage')
          return cachedAttendee
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendee data:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    try {
      console.log('🌐 SYNC FALLBACK: No cached data found, syncing from database...')
      console.log('🌐 SYNC FALLBACK: Current attendee ID:', current.id)
      console.log('🌐 SYNC FALLBACK: Attempting to sync attendees')
      
      const { serverDataSyncService } = await import('./serverDataSyncService')
      const allAttendees = await serverDataSyncService.syncAttendees()
      console.log('🌐 SYNC FALLBACK: Sync response received:', Array.isArray(allAttendees) ? `${allAttendees.length} attendees` : 'Not an array')
      
      // Ensure we have an array before calling find
      if (Array.isArray(allAttendees)) {
        const attendee = allAttendees.find(a => a.id === current.id)
        if (attendee) {
          console.log('🌐 SYNC SUCCESS: Found attendee using sync service')
          console.log('🌐 SYNC SUCCESS: Found attendee:', { id: attendee.id, name: `${attendee.first_name} ${attendee.last_name}` })
          return attendee
        } else {
          console.log('🌐 SYNC FAILED: Attendee not found in sync response')
          console.log('🌐 SYNC FAILED: Available attendee IDs:', allAttendees.map(a => a.id))
        }
      } else {
        console.log('🌐 SYNC FAILED: Response is not an array')
      }
    } catch (syncError) {
      console.warn('🌐 SYNC ERROR:', syncError)
      console.log('🌐 SYNC ERROR: Details:', syncError)
    }
    
    // NO FALLBACK: Throw error when both API and cache fail
    console.log('❌ ERROR: Both API and cache failed, throwing error')
    throw new DataServiceError('Failed to fetch current attendee data - both API and cache unavailable', 'FETCH_ERROR')
    
  } catch (error) {
    console.error('❌ Error fetching current attendee:', error)
    throw new DataServiceError('Failed to fetch current attendee data', 'FETCH_ERROR')
  }
}

/**
 * Get all agenda items (shared data - same for all authenticated users)
 * @returns Array of all agenda items
 */
export const getAllAgendaItems = async (): Promise<AgendaItem[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check unified cache first (populated during login)
    try {
      const cachedData = await unifiedCacheService.get('kn_cache_agenda_items')
      if (cachedData) {
        // Handle both direct array format and wrapped format
        const agendaItems = cachedData.data || cachedData
        if (Array.isArray(agendaItems) && agendaItems.length > 0) {
          console.log('✅ Using cached agenda items from unified cache')
          return [...agendaItems]
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached agenda items:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached agenda items, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncTable('agenda_items')
    return data
  } catch (error) {
    console.error('❌ Error fetching agenda items:', error)
    throw new DataServiceError('Failed to fetch agenda items', 'FETCH_ERROR')
  }
}

/**
 * Get attendee's selected agenda items (personalized data)
 * @param attendeeId - ID of the attendee
 * @returns Array of selected agenda items
 */
export const getAttendeeSelectedAgendaItems = async (attendeeId: string): Promise<AgendaItem[]> => {
  requireAuthentication()
  
  try {
    // Get attendee data from cached attendees
    const allAttendees = await getAllAttendees() // Direct call
    const attendee = allAttendees.find(a => a.id === attendeeId)
    const selected = Array.isArray(attendee?.selected_breakouts) ? attendee.selected_breakouts : []
    if (selected.length === 0) return []
    // Get agenda items from cache or sync
    const all = await getAllAgendaItems() // Direct call
    return all
      .filter(item => selected.includes(item.id as unknown as string))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  } catch (error) {
    console.error('❌ Error fetching selected agenda items:', error)
    throw new DataServiceError('Failed to fetch selected agenda items', 'FETCH_ERROR')
  }
}

/**
 * Get all sponsors (shared data - same for all authenticated users)
 * @returns Array of all sponsors
 */
export const getAllSponsors = async (): Promise<Sponsor[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_sponsors')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        // Handle both direct array format and wrapped format
        const sponsors = cacheObj.data || cacheObj
        if (Array.isArray(sponsors) && sponsors.length > 0) {
          console.log('✅ Using cached sponsors from localStorage')
          return [...sponsors]
            .filter(s => (s as any).is_active !== false)
            .sort((a, b) => ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0))
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached sponsors:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached sponsors, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncTable('sponsors')
    return data
  } catch (error) {
    console.error('❌ Error fetching sponsors:', error)
    throw new DataServiceError('Failed to fetch sponsors', 'FETCH_ERROR')
  }
}

/**
 * Get all seat assignments (personalized data - specific to attendee)
 * @param attendeeId - ID of the attendee
 * @returns Array of seat assignments for the attendee
 */
export const getAttendeeSeatAssignments = async (attendeeId: string): Promise<SeatAssignment[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_seat_assignments')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        // Handle both direct array format and wrapped format
        const seatAssignments = cacheObj.data || cacheObj
        const attendeeSeats = seatAssignments.filter((seat: SeatAssignment) => seat.attendee_id === attendeeId)
        return attendeeSeats // Return even if empty array
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached seat assignments:', cacheError)
    }
    
    // FALLBACK: Sync seat_assignments table if cache is empty
    console.log('🌐 SYNC: No cached seat assignments, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    await serverDataSyncService.syncTable('seat_assignments')
    // Re-read from cache after sync
    const cachedData = localStorage.getItem('kn_cache_seat_assignments')
    if (cachedData) {
      const cacheObj = JSON.parse(cachedData)
      const seatAssignments = cacheObj.data || cacheObj
      return seatAssignments.filter((seat: SeatAssignment) => seat.attendee_id === attendeeId)
    }
    return []
  } catch (error) {
    console.error('❌ Error fetching seat assignments:', error)
    throw new DataServiceError('Failed to fetch seat assignments', 'FETCH_ERROR')
  }
}

/**
 * Get all dining options (shared data - same for all authenticated users)
 * @returns Array of all dining options
 */
export const getAllDiningOptions = async (): Promise<DiningOption[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_dining_options')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const diningOptions = cacheObj.data || cacheObj
        if (Array.isArray(diningOptions) && diningOptions.length > 0) {
          console.log('✅ LOCALSTORAGE: Using cached dining options')
          return diningOptions
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached dining options:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached dining options, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncDiningOptions()
    return data
  } catch (error) {
    console.error('❌ Error fetching dining options:', error)
    throw new DataServiceError('Failed to fetch dining options', 'FETCH_ERROR')
  }
}

/**
 * Get attendee's dining selections (personalized data)
 * @param attendeeId - ID of the attendee
 * @returns Array of selected dining options
 * @deprecated This function is not used anywhere in the codebase and should be removed
 */
export const getAttendeeDiningSelections = async (attendeeId: string): Promise<DiningOption[]> => {
  requireAuthentication()
  
  try {
    // NOTE: This API endpoint doesn't exist, so this function is broken
    // Consider removing this function entirely
    const data = await apiGet<DiningOption[]>(`/api/attendees/${attendeeId}/dining-selections`)
    return data
  } catch (error) {
    console.error('❌ Error fetching dining selections:', error)
    throw new DataServiceError('Failed to fetch dining selections', 'FETCH_ERROR')
  }
}

/**
 * Get all hotels (shared data - same for all authenticated users)
 * @returns Array of all hotels
 */
export const getAllHotels = async (): Promise<Hotel[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_hotels')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const hotels = cacheObj.data || cacheObj
        if (Array.isArray(hotels) && hotels.length > 0) {
          console.log('✅ LOCALSTORAGE: Using cached hotels')
          return hotels
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached hotels:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached hotels, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncTable('hotels')
    return data
  } catch (error) {
    console.error('❌ Error fetching hotels:', error)
    throw new DataServiceError('Failed to fetch hotels', 'FETCH_ERROR')
  }
}

/**
 * Get attendee's hotel selection (personalized data)
 * @param attendeeId - ID of the attendee
 * @returns Selected hotel or null
 */
export const getAttendeeHotelSelection = async (attendeeId: string): Promise<Hotel | null> => {
  requireAuthentication()
  
  try {
    // Get attendee data from cached attendees
    const allAttendees = await getAllAttendees() // Direct call
    const attendee = allAttendees.find(a => a.id === attendeeId)
    if (!attendee?.hotel_selection) return null
    // Get hotel data from cached hotels
    const allHotels = await getAllHotels() // Direct call
    const hotel = allHotels.find(h => h.id === attendee.hotel_selection)
    return hotel || null
  } catch (error) {
    console.error('❌ Error fetching hotel selection:', error)
    throw new DataServiceError('Failed to fetch hotel selection', 'FETCH_ERROR')
  }
}

/**
 * Get all seating configurations (shared data - same for all authenticated users)
 * @returns Array of all seating configurations
 */
export const getAllSeatingConfigurations = async (): Promise<any[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_seating_configurations')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const configs = cacheObj.data || cacheObj
        if (Array.isArray(configs) && configs.length > 0) {
          console.log('✅ LOCALSTORAGE: Using cached seating configurations')
          return configs
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached seating configurations:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached seating configurations, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncTable('seating_configurations')
    return data
  } catch (error) {
    console.error('❌ Error fetching seating configurations:', error)
    throw new DataServiceError('Failed to fetch seating configurations', 'FETCH_ERROR')
  }
}

/**
 * Test database connection
 * @returns Connection test result
 */
export const testDatabaseConnection = async (): Promise<{
  success: boolean
  error?: string
  tableCounts?: Record<string, number>
  authConfigured?: boolean
  authOk?: boolean
}> => {
  try {
    // Check backend health/auth first for clearer diagnostics
    try {
      const healthRes = await fetch('/api/health', { credentials: 'include' })
      if (healthRes.ok) {
        const health = await healthRes.json()
        if (typeof health?.authConfigured === 'boolean') {
          // Attach to result later
        }
      }
    } catch (_) {
      // Non-fatal; continue
    }
    const tables = ['attendees', 'agenda_items', 'sponsors', 'seat_assignments', 'dining_options', 'hotels', 'seating_configurations']
    const tableCounts: Record<string, number> = {}
    await Promise.all(
      tables.map(async (table) => {
        try {
          const res = await fetch(`/api/db/table-count?table=${encodeURIComponent(table)}`, { credentials: 'include' })
          if (!res.ok) {
            // Attempt to surface backend auth requirement
            try {
              const j = await res.json()
              if (j?.authRequired) throw new Error('BACKEND_AUTH_REQUIRED')
            } catch (_) {}
            throw new Error(`${res.status}`)
          }
          const json = await res.json()
          tableCounts[table] = json?.count ?? 0
        } catch (err) {
          console.warn(`⚠️ Could not fetch count for table ${table}:`, err)
          tableCounts[table] = 0
        }
      })
    )
    return { success: true, tableCounts }
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
