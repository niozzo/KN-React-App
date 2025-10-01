/**
 * Dining Options API Endpoint with Data Transformation
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { getAuthenticatedClient } from './supabaseClient.js'
import { DiningTransformer } from '../src/transformers/diningTransformer.js'

// Create transformer instance
const diningTransformer = new DiningTransformer()

// Fetch table rows helper
async function fetchTableRows(tableName, limit = 100) {
  try {
    console.log(`🔍 Fetching ${tableName} with limit ${limit}...`)
    const supabaseClient = await getAuthenticatedClient()
    
    if (!supabaseClient) {
      throw new Error('Failed to get authenticated Supabase client')
    }
    
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(parseInt(limit))
    
    if (error) {
      console.error(`❌ Supabase error for ${tableName}:`, error.message)
      throw error
    }
    
    console.log(`✅ Successfully fetched ${data?.length || 0} rows from ${tableName}`)
    return { data: data || [], error: null }
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message)
    console.error(`❌ Error stack:`, error.stack)
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
    console.log('🔍 API: Getting dining options with data transformation...')
    
    const { limit } = req.query
    const { data: rawData, error } = await fetchTableRows('dining_options', limit)
    
    if (error) {
      console.error('❌ Database fetch error:', error.message)
      return res.status(500).json({
        success: false,
        data: null,
        error: `Database error: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    }

    // Validate data before transformation
    if (!rawData || !Array.isArray(rawData)) {
      console.error('❌ Invalid data format received from database')
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Invalid data format received from database',
        timestamp: new Date().toISOString()
      })
    }

    // Transform data using the transformation layer
    let transformedData
    try {
      transformedData = diningTransformer.transformArrayFromDatabase(rawData)
      // Filter active dining options and sort by date and time
      transformedData = diningTransformer.filterActiveDiningOptions(transformedData)
      transformedData = diningTransformer.sortDiningOptions(transformedData)
      console.log(`✅ Transformed ${transformedData.length} dining options`)
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
        transformer: 'DiningTransformer',
        version: '1.0.0'
      }
    })

  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message)
    console.error('❌ API: Error stack:', error.stack)
    return res.status(500).json({
      success: false,
      data: null,
      error: `Unexpected server error: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }
}
