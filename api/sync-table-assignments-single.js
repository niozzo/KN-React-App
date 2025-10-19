// New Vercel API endpoint: /api/sync-table-assignments-single
// Processes Table 1 for sanity check and validation
// READ-ONLY access to main DB, WRITE-ONLY to Application DB

import { createClient } from '@supabase/supabase-js'

// Environment variables
const MAIN_DB_URL = process.env.VITE_SUPABASE_URL
const MAIN_DB_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const APP_DB_URL = process.env.VITE_APPLICATION_DB_URL
const APP_DB_ANON_KEY = process.env.VITE_APPLICATION_DB_ANON_KEY

// Create Supabase clients
const createSupabaseClient = (url, key) => {
  return createClient(url, key)
}

// Process table assignments for a single table
const computeTableAssignments = async (seatAssignments, mainDb) => {
  if (!seatAssignments || seatAssignments.length === 0) {
    return []
  }

  // Group by dining_option_id and table_name
  const tableGroups = {}
  
  for (const assignment of seatAssignments) {
    const key = `${assignment.dining_option_id}-${assignment.table_name}`
    
    if (!tableGroups[key]) {
      tableGroups[key] = {
        dining_option_id: assignment.dining_option_id,
        table_name: assignment.table_name,
        attendees: []
      }
    }
    
    // Get attendee details from main DB (READ-ONLY)
    const { data: attendee } = await mainDb
      .from('attendees')
      .select('id, first_name, last_name, company, company_name_standardized, photo')
      .eq('id', assignment.attendee_id)
      .single()
    
    if (attendee) {
      tableGroups[key].attendees.push({
        attendee_id: attendee.id,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        company_name_standardized: attendee.company_name_standardized || attendee.company,
        photo: attendee.photo
      })
    }
  }
  
  return Object.values(tableGroups)
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Connect to main DB with READ-ONLY access (NO WRITES ALLOWED)
    const mainDb = createSupabaseClient(MAIN_DB_URL, MAIN_DB_ANON_KEY)
    
    // 2. READ-ONLY: Get seat assignments for Table 1 only
    const { data: seatAssignments, error: seatError } = await mainDb
      .from('seat_assignments')
      .select('*')
      .eq('table_name', 'Table 1')
      .eq('event_type', 'dining')
    
    if (seatError) {
      console.error('Error fetching seat assignments:', seatError)
      return res.status(500).json({ error: 'Failed to fetch seat assignments from main DB' })
    }
    
    if (!seatAssignments || seatAssignments.length === 0) {
      return res.status(404).json({ 
        error: 'No seat assignments found for Table 1',
        message: 'Table 1 may not exist or have no dining assignments'
      })
    }
    
    // 3. Process table assignments for Table 1 (NO MAIN DB MODIFICATIONS)
    const tableAssignments = await computeTableAssignments(seatAssignments, mainDb)
    
    if (tableAssignments.length === 0) {
      return res.status(404).json({ 
        error: 'No table assignments computed for Table 1',
        message: 'Table 1 may not have valid attendee data'
      })
    }
    
    // 4. WRITE ONLY TO APPLICATION DB (NOT MAIN DB)
    const appDb = createSupabaseClient(APP_DB_URL, APP_DB_ANON_KEY)
    
    // Upsert table assignments to Application DB
    const { data: upsertData, error: upsertError } = await appDb
      .from('table_assignments_cache')
      .upsert(tableAssignments, { 
        onConflict: 'dining_option_id,table_name',
        ignoreDuplicates: false 
      })
      .select()
    
    if (upsertError) {
      console.error('Error upserting to Application DB:', upsertError)
      return res.status(500).json({ 
        error: 'Failed to write to Application DB',
        details: upsertError.message
      })
    }
    
    res.json({ 
      success: true, 
      table: 'Table 1',
      attendees: tableAssignments[0]?.attendees?.length || 0,
      data: tableAssignments,
      message: 'Table 1 processed successfully and stored in Application DB'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// GUARDRAIL: This function MUST NEVER modify main database
// Only read from main DB, only write to Application DB
// Single table processing for sanity check
