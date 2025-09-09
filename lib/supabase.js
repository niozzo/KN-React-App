import { createClient } from '@supabase/supabase-js'
import { dbConfig } from '../config/database.js'

const supabaseUrl = dbConfig.supabase.url
const supabaseKey = dbConfig.supabase.anonKey

export const supabase = createClient(supabaseUrl, supabaseKey)

// Temporary authentication system
let authenticatedSupabase = null
let isAuthenticated = false

// Function to authenticate with username/password
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
    
    // Create authenticated client
    authenticatedSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`
        }
      }
    })
    
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

// Get all tables by trying common table names
export const getTables = async () => {
  try {
    const client = getAuthenticatedClient()
    const commonTables = ['users', 'profiles', 'posts', 'products', 'orders', 'customers', 'items', 'articles', 'comments', 'categories']
    const foundTables = []
    
    for (const tableName of commonTables) {
      try {
        const { error } = await client
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          foundTables.push({ table_name: tableName })
        }
      } catch (err) {
        // Table doesn't exist, continue
      }
    }
    
    return { success: true, tables: foundTables, error: null }
  } catch (err) {
    return { success: false, tables: null, error: err.message }
  }
}

// Get table structure
export const getTableStructure = async (tableName) => {
  try {
    const client = getAuthenticatedClient()
    const { data, error } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')
    
    if (error) throw error
    return { success: true, columns: data, error: null }
  } catch (err) {
    return { success: false, columns: null, error: err.message }
  }
}

// Get sample data from a table
export const getTableData = async (tableName, limit = 10) => {
  try {
    const client = getAuthenticatedClient()
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(limit)
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (err) {
    return { success: false, data: null, error: err.message }
  }
}

// Re-export direct database functions for convenience
export {
  testDirectConnection,
  getDirectTables,
  getDirectTableStructure,
  getDirectTableData,
  getDirectTableRowCount,
  executeDirectQuery,
  closeDirectConnection
} from './direct-db.js'
