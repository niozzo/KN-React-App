/**
 * Sponsors API Endpoint with Data Transformation
 * Story 1.7: Data Transformation Layer for Schema Evolution
 * 
 * ⚠️ DEPRECATED: API endpoint no longer used
 * Use standardized_companies table instead of sponsors
 */

import { createClient } from '@supabase/supabase-js'
import { SponsorTransformer } from '../src/transformers/sponsorTransformer.js'

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create transformer instance
const sponsorTransformer = new SponsorTransformer()

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
    const { limit } = req.query
    const { data: rawData, error } = await fetchTableRows('sponsors', limit)
    
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
      transformedData = sponsorTransformer.transformArrayFromDatabase(rawData)
      // Filter active sponsors and sort by display order
      transformedData = sponsorTransformer.filterActiveSponsors(transformedData)
      transformedData = sponsorTransformer.sortSponsors(transformedData)
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
        transformer: 'SponsorTransformer',
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
