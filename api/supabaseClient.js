/**
 * Supabase Client for API endpoints
 * Implements singleton pattern to prevent multiple client instances
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton client instance
let supabaseClient = null
let isAuthenticated = false
let lastAuthTime = 0
const AUTH_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get authenticated Supabase client (singleton)
 */
export async function getAuthenticatedClient() {
  const now = Date.now()
  
  // Return cached client if still valid
  if (supabaseClient && isAuthenticated && (now - lastAuthTime) < AUTH_CACHE_DURATION) {
    return supabaseClient
  }
  
  try {
    console.log('🔐 Authenticating with Supabase admin credentials...')
    
    // Create new client instance only if needed
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
    }
    
    // Authenticate with stored credentials
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: process.env.SUPABASE_USER_EMAIL || 'ishan.gammampila@apax.com',
      password: process.env.SUPABASE_USER_PASSWORD || 'xx8kRx#tn@R?'
    })
    
    if (error) {
      console.error('❌ Authentication failed:', error.message)
      throw new Error('AUTHENTICATION_REQUIRED')
    }
    
    isAuthenticated = true
    lastAuthTime = now
    
    console.log('✅ Admin authenticated successfully')
    return supabaseClient
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message)
    isAuthenticated = false
    supabaseClient = null
    throw error
  }
}

/**
 * Reset authentication state (for testing or error recovery)
 */
export function resetAuthState() {
  isAuthenticated = false
  supabaseClient = null
  lastAuthTime = 0
}

/**
 * Check if client is currently authenticated
 */
export function isClientAuthenticated() {
  const now = Date.now()
  return isAuthenticated && supabaseClient && (now - lastAuthTime) < AUTH_CACHE_DURATION
}

/**
 * Get authentication status
 */
export function getAuthStatus() {
  return {
    isAuthenticated,
    hasClient: !!supabaseClient,
    lastAuthTime,
    cacheValid: isClientAuthenticated()
  }
}
