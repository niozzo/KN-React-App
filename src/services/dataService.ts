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
    const data = await apiGet<Attendee[]>('/api/attendees')
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
    const data = await apiGet<Attendee>(`/api/attendees/${current.id}`)
    return data
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
    const data = await apiGet<AgendaItem[]>('/api/agenda-items')
    return [...data]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
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
    const data = await apiGet<SeatAssignment[]>(`/api/attendees/${attendeeId}/seat-assignments`)
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
