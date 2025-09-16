/**
 * Hotels API Endpoint with Data Transformation
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { createClient } from '@supabase/supabase-js'
import { HotelTransformer } from '../src/transformers/hotelTransformer.js'

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create transformer instance
const hotelTransformer = new HotelTransformer()

// Authentication function
async function getAuthenticatedClient() {
  const supabaseClient = createClient(supabaseUrl, supabaseKey)
  
  // Authenticate with stored credentials
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: process.env.SUPABASE_USER_EMAIL || 'ishan.gammampila@apax.com',
    password: process.env.SUPABASE_USER_PASSWORD || 'xx8kRx#tn@R?'
  })
  
  if (error) {
    console.error('❌ Authentication failed:', error.message)
    throw new Error('AUTHENTICATION_REQUIRED')
  }
  
  return supabaseClient
}

// Fetch table rows helper
async function fetchTableRows(tableName, limit = 100) {
  try {
    const supabaseClient = await getAuthenticatedClient()
    
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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    })
  }

  try {
    console.log('🔍 API: Getting hotels with data transformation...')
    
    const { limit } = req.query
    const { data: rawData, error } = await fetchTableRows('hotels', limit)
    
    if (error) {
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    // Transform data using the transformation layer
    let transformedData
    try {
      transformedData = hotelTransformer.transformArrayFromDatabase(rawData)
      // Filter active hotels and sort by display order
      transformedData = hotelTransformer.filterActiveHotels(transformedData)
      transformedData = hotelTransformer.sortHotels(transformedData)
      console.log(`✅ Transformed ${transformedData.length} hotels`)
    } catch (transformError) {
      console.error('❌ Transformation failed:', transformError)
      return res.status(500).json({
        success: false,
        data: null,
        error: `Data transformation failed: ${transformError.message}`,
        timestamp: new Date().toISOString()
      })
    }

    return res.status(200).json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      timestamp: new Date().toISOString(),
      transformation: {
        applied: true,
        transformer: 'HotelTransformer',
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message)
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
