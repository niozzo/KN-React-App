// New Vercel API endpoint: /api/sync-table-assignments-full
// Processes all tables after single table validation
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

// Process table assignments for all tables
const computeAllTableAssignments = async (seatAssignments, mainDb) => {
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
    
    // 2. READ-ONLY: Get ALL seat assignments for dining events
    const { data: seatAssignments, error: seatError } = await mainDb
      .from('seat_assignments')
      .select('*')
      .eq('event_type', 'dining')
    
    if (seatError) {
      console.error('Error fetching seat assignments:', seatError)
      return res.status(500).json({ error: 'Failed to fetch seat assignments from main DB' })
    }
    
    if (!seatAssignments || seatAssignments.length === 0) {
      return res.status(404).json({ 
        error: 'No seat assignments found for dining events',
        message: 'No dining events with seat assignments found'
      })
    }
    
    // 3. Process table assignments for all tables (NO MAIN DB MODIFICATIONS)
    const tableAssignments = await computeAllTableAssignments(seatAssignments, mainDb)
    
    if (tableAssignments.length === 0) {
      return res.status(404).json({ 
        error: 'No table assignments computed',
        message: 'No valid table assignments could be computed'
      })
    }
    
    // 4. WRITE ONLY TO APPLICATION DB (NOT MAIN DB)
    const appDb = createSupabaseClient(APP_DB_URL, APP_DB_ANON_KEY)
    
    // Clear existing cache and insert new data
    const { error: deleteError } = await appDb
      .from('table_assignments_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.error('Error clearing Application DB cache:', deleteError)
      return res.status(500).json({ 
        error: 'Failed to clear Application DB cache',
        details: deleteError.message
      })
    }
    
    // Insert all table assignments
    const { data: upsertData, error: upsertError } = await appDb
      .from('table_assignments_cache')
      .insert(tableAssignments)
      .select()
    
    if (upsertError) {
      console.error('Error inserting to Application DB:', upsertError)
      return res.status(500).json({ 
        error: 'Failed to write to Application DB',
        details: upsertError.message
      })
    }
    
    // Count tables processed
    const tableCount = tableAssignments.length
    const totalAttendees = tableAssignments.reduce((sum, table) => sum + table.attendees.length, 0)
    
    res.json({ 
      success: true, 
      tables_processed: tableCount,
      total_attendees: totalAttendees,
      data: tableAssignments,
      message: `Successfully processed ${tableCount} tables with ${totalAttendees} total attendees`
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
// Full table processing after single table validation
