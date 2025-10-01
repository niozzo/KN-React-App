/**
 * Agenda Items API Endpoint with Data Transformation
 * Story 2.1: Now/Next Glance Card - API Fallback Implementation
 */

import { getAuthenticatedClient } from './supabaseClient.js'
import { AgendaTransformer } from '../src/transformers/agendaTransformer.js'

// Create transformer instance
const agendaTransformer = new AgendaTransformer()

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
    console.log('🔍 API: Getting agenda items with data transformation...')
    
    const { limit } = req.query
    const { data: rawData, error } = await fetchTableRows('agenda_items', limit)
    
    if (error) {
      console.error('❌ Database error:', error.message)
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
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
      transformedData = agendaTransformer.transformArrayFromDatabase(rawData)
      console.log(`✅ Transformed ${transformedData.length} agenda items`)
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
        transformer: 'AgendaTransformer',
        version: '1.0.0'
      }
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