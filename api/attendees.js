/**
 * Attendees API Endpoint
 * Returns raw attendee data from database
 */

import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for API access
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Fetch table rows helper
async function fetchTableRows(tableName, limit = 100) {
  try {
    const supabaseClient = createSupabaseClient()
    
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(parseInt(limit))
    
    if (error) {
      throw error
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message)
    return { data: null, error }
  }
}

// Main API handler
export default async function handler(req, res) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json')
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    })
  }

  try {
    console.log('🔍 API: Getting attendees with data transformation...')
    
    const { limit } = req.query
    const { data: rawData, error } = await fetchTableRows('attendees', limit)
    
    if (error) {
      console.error('❌ Database error:', error.message)
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    // Validate data
    if (!rawData || !Array.isArray(rawData)) {
      console.error('❌ Invalid data format received from database')
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Invalid data format received from database',
        timestamp: new Date().toISOString()
      })
    }

    console.log(`✅ Retrieved ${rawData.length} attendees`)

    return res.status(200).json({
      success: true,
      data: rawData,
      count: rawData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message)
    console.error('❌ Stack trace:', error.stack)
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
