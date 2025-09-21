/**
 * Browser-only Supabase client
 * This version uses the singleton SupabaseClientService to prevent multiple instances
 */

import { supabaseClientService } from '../services/supabaseClientService.js'

// Browser-safe configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

// Initialize the singleton service
supabaseClientService.initialize({
  url: supabaseUrl,
  key: supabaseKey,
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  }
})

// Export the singleton client instance
export const supabase = supabaseClientService.getClient()

// Legacy functions - now delegate to singleton service
export const authenticateWithCredentials = async (email, password) => {
  return await supabaseClientService.authenticateWithCredentials(email, password)
}

export const getAuthenticatedClient = () => {
  return supabaseClientService.getClient()
}

export const getAuthStatus = () => {
  return supabaseClientService.getAuthState()
}

export const signOut = async () => {
  return await supabaseClientService.signOut()
}

export const testConnection = async () => {
  return await supabaseClientService.testConnection()
}

// New function for access code authentication
export const authenticateWithAccessCode = async (accessCode) => {
  return await supabaseClientService.authenticateWithAccessCode(accessCode)
}
