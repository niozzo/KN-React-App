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
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DataServiceError'
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
          console.log('🏠 LOCALSTORAGE: Using cached attendees data from localStorage')
          console.log('🏠 LOCALSTORAGE: Found', attendees.length, 'cached attendees')
          // Ensure stable ordering for UI
          return [...attendees].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendees data:', cacheError)
    }
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 API: No cached data found, fetching from API...')
    const data = await apiGet<Attendee[]>('/api/attendees')
    console.log('🌐 API: Fetched', data.length, 'attendees from API')
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
    
    // PRIMARY: Check unified cache first (populated during login)
    try {
      const cachedData = await unifiedCacheService.get('kn_cache_attendees')
      if (cachedData) {
        // Handle both direct array format and wrapped format
        const attendees = cachedData.data || cachedData
        const cachedAttendee = attendees.find((a: Attendee) => a.id === current.id)
        if (cachedAttendee) {
          console.log('🏠 CACHE: Using cached attendee data from unified cache')
          console.log('🏠 CACHE: Found attendee:', { id: cachedAttendee.id, name: `${cachedAttendee.first_name} ${cachedAttendee.last_name}` })
          return cachedAttendee
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendee data:', cacheError)
    }
    
    // FALLBACK: Use same API endpoint as login for consistency
    try {
      console.log('🌐 API FALLBACK: No cached data found, fetching from API...')
      console.log('🌐 API FALLBACK: Current attendee ID:', current.id)
      console.log('🌐 API FALLBACK: Attempting to fetch from /api/attendees')
      
      const allAttendees = await apiGet<Attendee[]>('/api/attendees')
      console.log('🌐 API FALLBACK: API response received:', Array.isArray(allAttendees) ? `${allAttendees.length} attendees` : 'Not an array')
      
      // Ensure we have an array before calling find
      if (Array.isArray(allAttendees)) {
        const attendee = allAttendees.find(a => a.id === current.id)
        if (attendee) {
          console.log('🌐 API SUCCESS: Found attendee using API endpoint')
          console.log('🌐 API SUCCESS: Found attendee:', { id: attendee.id, name: `${attendee.first_name} ${attendee.last_name}` })
          return attendee
        } else {
          console.log('🌐 API FAILED: Attendee not found in API response')
          console.log('🌐 API FAILED: Available attendee IDs:', allAttendees.map(a => a.id))
        }
      } else {
        console.log('🌐 API FAILED: Response is not an array')
      }
    } catch (apiError) {
      console.warn('🌐 API ERROR:', apiError)
      console.log('🌐 API ERROR: Details:', apiError)
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
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 No cached agenda items found, fetching from API...')
    const data = await apiGet<AgendaItem[]>('/api/agenda-items')
    return [...data]
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
    // Get selected_breakouts via server
    const attendee = await apiGet<{ selected_breakouts?: string[] }>(`/api/attendees/${attendeeId}`)
    const selected = Array.isArray(attendee?.selected_breakouts) ? attendee.selected_breakouts : []
    if (selected.length === 0) return []
    // Small dataset: fetch all agenda items and filter client-side
    const all = await apiGet<AgendaItem[]>('/api/agenda-items')
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
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 No cached sponsors found, fetching from API...')
    const data = await apiGet<Sponsor[]>('/api/sponsors')
    return [...data]
      .filter(s => (s as any).is_active !== false)
      .sort((a, b) => ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0))
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
        console.log('🏠 LOCALSTORAGE: Using cached seat assignments from localStorage')
        console.log('🏠 LOCALSTORAGE: Found', attendeeSeats.length, 'seat assignments for attendee', attendeeId)
        return attendeeSeats // Return even if empty array
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached seat assignments:', cacheError)
    }
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 API: No cached seat assignments found, fetching from API...')
    const data = await apiGet<SeatAssignment[]>(`/api/attendees/${attendeeId}/seat-assignments`)
    console.log('🌐 API: Fetched', data.length, 'seat assignments from API for attendee', attendeeId)
    return data
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
    const data = await apiGet<DiningOption[]>('/api/dining-options')
    return [...data]
      .filter(d => (d as any).is_active !== false)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  } catch (error) {
    console.error('❌ Error fetching dining options:', error)
    throw new DataServiceError('Failed to fetch dining options', 'FETCH_ERROR')
  }
}

/**
 * Get attendee's dining selections (personalized data)
 * @param attendeeId - ID of the attendee
 * @returns Array of selected dining options
 */
export const getAttendeeDiningSelections = async (attendeeId: string): Promise<DiningOption[]> => {
  requireAuthentication()
  
  try {
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
    const data = await apiGet<Hotel[]>('/api/hotels')
    return [...data]
      .filter(h => (h as any).is_active !== false)
      .sort((a, b) => ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0))
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
    const attendee = await apiGet<{ hotel_selection?: string }>(`/api/attendees/${attendeeId}`)
    if (!attendee?.hotel_selection) return null
    const hotel = await apiGet<Hotel>(`/api/hotels/${attendee.hotel_selection}`)
    return hotel
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
    const data = await apiGet<any[]>('/api/seating-configurations')
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
    const tables = ['attendees', 'agenda_items', 'sponsors', 'seat_assignments', 'dining_options', 'hotels', 'seating_configurations', 'user_profiles']
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
