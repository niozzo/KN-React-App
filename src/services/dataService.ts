/**
 * Data Service for Conference Companion PWA
 * 
 * This service handles all database operations with READ-ONLY access.
 * All data requires authentication - no public data is available.
 * 
 * CRITICAL: READ-ONLY DATABASE ACCESS - We cannot modify any data
 */

import { supabase } from '../lib/supabase'
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

/**
 * Get all attendees (shared data - same for all authenticated users)
 * @returns Array of all attendees
 */
export const getAllAttendees = async (): Promise<Attendee[]> => {
  requireAuthentication()
  
  try {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) throw error
    return data as Attendee[]
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
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', (await import('./authService.js')).getCurrentAttendee()?.id)
      .single()

    if (error) throw error
    return data as Attendee
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
    const { data, error } = await supabase
      .from('agenda_items')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data as AgendaItem[]
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
    // First get the attendee's selected_breakouts
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('selected_breakouts')
      .eq('id', attendeeId)
      .single()

    if (attendeeError) throw attendeeError

    if (!attendee?.selected_breakouts || !Array.isArray(attendee.selected_breakouts)) {
      return []
    }

    // Get the agenda items for selected breakouts
    const { data, error } = await supabase
      .from('agenda_items')
      .select('*')
      .in('id', attendee.selected_breakouts)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data as AgendaItem[]
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
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data as Sponsor[]
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
    const { data, error } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('attendee_id', attendeeId)
      .order('assigned_at', { ascending: true })

    if (error) throw error
    return data as SeatAssignment[]
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
    const { data, error } = await supabase
      .from('dining_options')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    return data as DiningOption[]
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
    // First get the attendee's dining_selections
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('dining_selections')
      .eq('id', attendeeId)
      .single()

    if (attendeeError) throw attendeeError

    if (!attendee?.dining_selections || !Array.isArray(attendee.dining_selections)) {
      return []
    }

    // Get the dining options for selected dining
    const { data, error } = await supabase
      .from('dining_options')
      .select('*')
      .in('id', attendee.dining_selections)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    return data as DiningOption[]
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
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data as Hotel[]
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
    // First get the attendee's hotel_selection
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('hotel_selection')
      .eq('id', attendeeId)
      .single()

    if (attendeeError) throw attendeeError

    if (!attendee?.hotel_selection) {
      return null
    }

    // Get the hotel details
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', attendee.hotel_selection)
      .single()

    if (error) throw error
    return data as Hotel
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
    const { data, error } = await supabase
      .from('seating_configurations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
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
}> => {
  try {
    // Test basic connection by fetching table counts
    const tables = ['attendees', 'agenda_items', 'sponsors', 'seat_assignments', 'dining_options', 'hotels']
    const tableCounts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) throw error
        tableCounts[table] = count || 0
      } catch (error) {
        console.warn(`⚠️ Could not fetch count for table ${table}:`, error)
        tableCounts[table] = 0
      }
    }

    return {
      success: true,
      tableCounts
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
