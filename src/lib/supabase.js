/**
 * Browser-only Supabase client
 * This version doesn't include server-side database functions
 */

import { createClient } from '@supabase/supabase-js'

// Browser-safe configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

// Create a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// Authentication state
let authenticatedSupabase = null
let isAuthenticated = false

// Function to authenticate with username/password (legacy - not used in new system)
export const authenticateWithCredentials = async (email, password) => {
  try {
    console.log('🔐 Attempting authentication with credentials...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('❌ Authentication failed:', error.message)
      return { success: false, error: error.message, user: null }
    }
    
    console.log('✅ Authentication successful!')
    console.log('👤 User:', data.user?.email)
    
    // Use the existing client with session
    authenticatedSupabase = supabase
    
    isAuthenticated = true
    
    return { 
      success: true, 
      user: data.user, 
      session: data.session,
      error: null 
    }
    
  } catch (err) {
    console.error('❌ Authentication error:', err.message)
    return { success: false, error: err.message, user: null }
  }
}

// Function to get the authenticated client
export const getAuthenticatedClient = () => {
  if (isAuthenticated && authenticatedSupabase) {
    return authenticatedSupabase
  }
  return supabase // Fallback to anonymous client
}

// Function to check authentication status
export const getAuthStatus = () => {
  return {
    isAuthenticated,
    hasAuthenticatedClient: !!authenticatedSupabase
  }
}

// Function to sign out
export const signOut = async () => {
  try {
    if (authenticatedSupabase) {
      await authenticatedSupabase.auth.signOut()
    }
    authenticatedSupabase = null
    isAuthenticated = false
    console.log('👋 Signed out successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Sign out error:', error.message)
    return { success: false, error: error.message }
  }
}

// Test connection function
export const testConnection = async () => {
  try {
    const client = getAuthenticatedClient()
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (err) {
    return { success: false, data: null, error: err.message }
  }
}
