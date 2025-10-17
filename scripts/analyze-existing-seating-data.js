/**
 * Analyze Existing Seating Data
 * Script to analyze the current seat_assignments table and related tables
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

async function analyzeExistingSeatingData() {
  console.log('🔍 Analyzing Existing Seating Data')
  console.log('===================================')
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Analyze seat_assignments table
    console.log('\n1. Analyzing seat_assignments table...')
    
    const { data: seatAssignments, error: seatError, count: seatCount } = await supabase
      .from('seat_assignments')
      .select('*', { count: 'exact' })
      .limit(10)
    
    if (seatError) {
      console.error('❌ Error fetching seat assignments:', seatError.message)
      return
    }
    
    console.log(`✅ Found ${seatCount} seat assignments`)
    
    if (seatAssignments && seatAssignments.length > 0) {
      console.log('\n📊 Sample seat assignment data:')
      const sample = seatAssignments[0]
      Object.entries(sample).forEach(([key, value]) => {
        const valueType = typeof value
        const displayValue = valueType === 'object' ? JSON.stringify(value) : String(value)
        console.log(`  ${key}: ${valueType} = ${displayValue}`)
      })
      
      // Analyze assignment types
      console.log('\n📈 Assignment type analysis:')
      const { data: assignmentTypes } = await supabase
        .from('seat_assignments')
        .select('assignment_type')
      
      if (assignmentTypes) {
        const typeCounts = assignmentTypes.reduce((acc, item) => {
          acc[item.assignment_type] = (acc[item.assignment_type] || 0) + 1
          return acc
        }, {})
        
        Object.entries(typeCounts).forEach(([type, count]) => {
          console.log(`  ${type}: ${count} assignments`)
        })
      }
    }
    
    // 2. Check dining_options table
    console.log('\n2. Checking dining_options table...')
    
    const { data: diningOptions, error: diningError, count: diningCount } = await supabase
      .from('dining_options')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (diningError) {
      console.error('❌ Error fetching dining options:', diningError.message)
    } else {
      console.log(`✅ Found ${diningCount} dining options`)
      
      if (diningOptions && diningOptions.length > 0) {
        console.log('\n📊 Sample dining option data:')
        const sample = diningOptions[0]
        Object.entries(sample).forEach(([key, value]) => {
          const valueType = typeof value
          const displayValue = valueType === 'object' ? JSON.stringify(value) : String(value)
          console.log(`  ${key}: ${valueType} = ${displayValue}`)
        })
      }
    }
    
    // 3. Check seating_configurations table
    console.log('\n3. Checking seating_configurations table...')
    
    const { data: seatingConfigs, error: configError, count: configCount } = await supabase
      .from('seating_configurations')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (configError) {
      console.error('❌ Error fetching seating configurations:', configError.message)
    } else {
      console.log(`✅ Found ${configCount} seating configurations`)
      
      if (seatingConfigs && seatingConfigs.length > 0) {
        console.log('\n📊 Sample seating configuration data:')
        const sample = seatingConfigs[0]
        Object.entries(sample).forEach(([key, value]) => {
          const valueType = typeof value
          const displayValue = valueType === 'object' ? JSON.stringify(value) : String(value)
          console.log(`  ${key}: ${valueType} = ${displayValue}`)
        })
      }
    }
    
    // 4. Check attendees table for dining preferences
    console.log('\n4. Checking attendees table for dining preferences...')
    
    const { data: attendees, error: attendeeError, count: attendeeCount } = await supabase
      .from('attendees')
      .select('id, first_name, last_name, dining_selections, hotel_selection')
      .not('dining_selections', 'is', null)
      .limit(5)
    
    if (attendeeError) {
      console.error('❌ Error fetching attendees:', attendeeError.message)
    } else {
      console.log(`✅ Found ${attendeeCount} attendees with dining selections`)
      
      if (attendees && attendees.length > 0) {
        console.log('\n📊 Sample attendee dining data:')
        attendees.forEach((attendee, index) => {
          console.log(`\n  Attendee ${index + 1}: ${attendee.first_name} ${attendee.last_name}`)
          console.log(`    Hotel: ${attendee.hotel_selection}`)
          console.log(`    Dining selections: ${JSON.stringify(attendee.dining_selections)}`)
        })
      }
    }
    
    // 5. Analyze relationships between tables
    console.log('\n5. Analyzing table relationships...')
    
    // Check if seat assignments are linked to dining options
    const { data: seatDiningLinks } = await supabase
      .from('seat_assignments')
      .select('seating_configuration_id, attendee_id, table_name, seat_number')
      .not('table_name', 'is', null)
      .limit(10)
    
    if (seatDiningLinks && seatDiningLinks.length > 0) {
      console.log('\n🔗 Seat assignments with table information:')
      seatDiningLinks.forEach((assignment, index) => {
        console.log(`  Assignment ${index + 1}:`)
        console.log(`    Table: ${assignment.table_name}`)
        console.log(`    Seat: ${assignment.seat_number}`)
        console.log(`    Attendee ID: ${assignment.attendee_id}`)
        console.log(`    Config ID: ${assignment.seating_configuration_id}`)
      })
    }
    
    // 6. Check for any existing dining-related data patterns
    console.log('\n6. Looking for dining-related patterns...')
    
    // Check if there are any seat assignments that might be dining-related
    const { data: diningPatterns } = await supabase
      .from('seat_assignments')
      .select('*')
      .or('notes.ilike.%dining%,notes.ilike.%meal%,notes.ilike.%dinner%,notes.ilike.%lunch%')
      .limit(5)
    
    if (diningPatterns && diningPatterns.length > 0) {
      console.log('\n🍽️ Found potential dining-related seat assignments:')
      diningPatterns.forEach((assignment, index) => {
        console.log(`  Assignment ${index + 1}:`)
        console.log(`    Notes: ${assignment.notes}`)
        console.log(`    Table: ${assignment.table_name}`)
        console.log(`    Attendee: ${assignment.attendee_first_name} ${assignment.attendee_last_name}`)
      })
    } else {
      console.log('📭 No obvious dining-related patterns found in seat assignments')
    }
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

// Run the analysis
analyzeExistingSeatingData()
