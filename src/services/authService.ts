/**
 * Authentication Service for Access Code-based Authentication
 * 
 * This service handles authentication using access codes from the attendees table.
 * All data access requires a valid access code - no public data is available.
 * 
 * CRITICAL: READ-ONLY DATABASE ACCESS - We cannot modify any data
 */

import { supabase } from '../lib/supabase'
import { serverDataSyncService } from './serverDataSyncService'
import type { Attendee, SanitizedAttendee } from '../types/attendee'
import { sanitizeAttendeeForStorage } from '../types/attendee'

// Authentication state
let currentAttendee: Attendee | SanitizedAttendee | null = null
let isAuthenticated = false

// Initialize authentication state from localStorage if available
const initializeAuthState = () => {
  try {
    const storedAuth = localStorage.getItem('conference_auth')
    if (storedAuth) {
      const authData = JSON.parse(storedAuth)
      if (authData.attendee && authData.isAuthenticated) {
        // Note: Restored attendee won't have access_code (for security)
        // This is only for session persistence, not re-authentication
        currentAttendee = authData.attendee as SanitizedAttendee
        isAuthenticated = true
        console.log('🔄 Restored authentication state from localStorage (without access_code)')
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to restore auth state from localStorage:', error)
    // Clear invalid data
    localStorage.removeItem('conference_auth')
  }
}

// Initialize on module load
initializeAuthState()

/**
 * Authenticate using access code from attendees table
 * @param accessCode - 6-character alphanumeric access code
 * @returns Authentication result with attendee data
 */
export const authenticateWithAccessCode = async (accessCode: string): Promise<{
  success: boolean
  attendee?: Attendee
  error?: string
}> => {
  try {
    console.log('🔐 Attempting authentication with access code...')
    
    // Validate access code format (6-character alphanumeric)
    if (!accessCode || !/^[A-Za-z0-9]{6}$/.test(accessCode)) {
      return {
        success: false,
        error: 'Invalid access code format. Must be 6 alphanumeric characters.'
      }
    }

    // Look up attendee by access code
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('access_code', accessCode)
      .single()

    if (error) {
      console.error('❌ Access code lookup failed:', error.message)
      return {
        success: false,
        error: 'Invalid access code. Please check and try again.'
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Access code not found. Please check and try again.'
      }
    }

    // Store authenticated attendee
    currentAttendee = data as Attendee
    isAuthenticated = true

    // Persist to localStorage (without access_code for security)
    try {
      const sanitizedAttendee = sanitizeAttendeeForStorage(data as Attendee)
      localStorage.setItem('conference_auth', JSON.stringify({
        attendee: sanitizedAttendee,
        isAuthenticated: true,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('⚠️ Failed to save auth state to localStorage:', error)
    }

    console.log('✅ Authentication successful!')
    console.log('👤 Attendee:', `${data.first_name} ${data.last_name}`)

    return {
      success: true,
      attendee: data as Attendee,
      error: undefined
    }

  } catch (err) {
    console.error('❌ Authentication error:', err)
    return {
      success: false,
      error: 'Authentication failed. Please try again.'
    }
  }
}

/**
 * Get current authenticated attendee
 * @returns Current attendee or null if not authenticated
 * Note: May not include access_code if restored from localStorage
 */
export const getCurrentAttendee = (): Attendee | SanitizedAttendee | null => {
  return currentAttendee
}

/**
 * Check if user is authenticated
 * @returns Authentication status
 */
export const isUserAuthenticated = (): boolean => {
  return isAuthenticated && currentAttendee !== null
}

/**
 * Sign out current user
 * @returns Sign out result
 */
export const signOut = (): { success: boolean; error?: string } => {
  try {
    currentAttendee = null
    isAuthenticated = false
    
    // Clear localStorage
    try {
      localStorage.removeItem('conference_auth')
    } catch (error) {
      console.warn('⚠️ Failed to clear auth state from localStorage:', error)
    }
    
    console.log('👋 Signed out successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Sign out error:', error)
    return { success: false, error: 'Sign out failed' }
  }
}

/**
 * Get authentication status
 * @returns Authentication status object
 */
export const getAuthStatus = () => {
  return {
    isAuthenticated,
    hasAttendee: !!currentAttendee,
    attendee: currentAttendee
  }
}

/**
 * Validate access code format without database lookup
 * @param accessCode - Access code to validate
 * @returns True if format is valid
 */
export const validateAccessCodeFormat = (accessCode: string): boolean => {
  return /^[A-Za-z0-9]{6}$/.test(accessCode)
}
