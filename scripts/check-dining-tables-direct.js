/**
 * Check Dining Tables Directly
 * Script to directly query dining-related tables
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

async function checkDiningTables() {
  console.log('🔍 Checking Dining Tables Directly')
  console.log('===================================')
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // List of dining-related tables to check
    const diningTables = [
      'dining_seat_assignments',
      'dining_assignments', 
      'dining_seating',
      'dining_seats',
      'dining_table_assignments',
      'dining_table_seats',
      'event_seat_assignments',
      'meal_seat_assignments',
      'meal_assignments',
      'dining_attendee_assignments',
      'dining_attendee_seats',
      'dining_metadata'
    ]
    
    console.log('📋 Checking dining-related tables...\n')
    
    for (const tableName of diningTables) {
      try {
        console.log(`🔍 Checking ${tableName}...`)
        
        // Try to get a small sample of data
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(3)
        
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`  ✅ ${tableName}: ${count} total rows`)
          if (data && data.length > 0) {
            console.log(`  📊 Sample data structure:`)
            const sampleRecord = data[0]
            Object.keys(sampleRecord).forEach(key => {
              const value = sampleRecord[key]
              const valueType = typeof value
              const displayValue = valueType === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50)
              console.log(`    ${key}: ${valueType} = ${displayValue}`)
            })
          } else {
            console.log(`  📭 ${tableName}: Empty table`)
          }
        }
        console.log('')
        
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`)
        console.log('')
      }
    }
    
    // Also check the main seat_assignments table for comparison
    console.log('🔍 Checking main seat_assignments table for comparison...')
    try {
      const { data, error, count } = await supabase
        .from('seat_assignments')
        .select('*', { count: 'exact' })
        .limit(3)
      
      if (error) {
        console.log(`  ❌ seat_assignments: ${error.message}`)
      } else {
        console.log(`  ✅ seat_assignments: ${count} total rows`)
        if (data && data.length > 0) {
          console.log(`  📊 Sample data structure:`)
          const sampleRecord = data[0]
          Object.keys(sampleRecord).forEach(key => {
            const value = sampleRecord[key]
            const valueType = typeof value
            const displayValue = valueType === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50)
            console.log(`    ${key}: ${valueType} = ${displayValue}`)
          })
        }
      }
    } catch (err) {
      console.log(`  ❌ seat_assignments: ${err.message}`)
    }
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

// Run the check
checkDiningTables()
