/**
 * Dining Seating Assessment
 * Comprehensive analysis of available data for dining seating options
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

async function assessDiningSeatingOptions() {
  console.log('🍽️ Dining Seating Options Assessment')
  console.log('====================================')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Analyze attendee dining selections
    console.log('\n1. Analyzing attendee dining selections...')
    
    const { data: attendeesWithDining } = await supabase
      .from('attendees')
      .select('id, first_name, last_name, dining_selections')
      .not('dining_selections', 'is', null)
    
    if (attendeesWithDining && attendeesWithDining.length > 0) {
      console.log(`✅ Found ${attendeesWithDining.length} attendees with dining selections`)
      
      // Extract unique dining events
      const diningEvents = new Set()
      const eventDetails = new Map()
      
      attendeesWithDining.forEach(attendee => {
        if (attendee.dining_selections) {
          Object.entries(attendee.dining_selections).forEach(([eventKey, eventData]) => {
            if (eventData.attending) {
              diningEvents.add(eventKey)
              if (!eventDetails.has(eventKey)) {
                eventDetails.set(eventKey, {
                  eventName: eventData.eventName,
                  location: eventData.location,
                  startDate: eventData.startDate,
                  endDate: eventData.endDate,
                  attendeeCount: 0
                })
              }
              eventDetails.get(eventKey).attendeeCount++
            }
          })
        }
      })
      
      console.log('\n📅 Available Dining Events:')
      eventDetails.forEach((details, eventKey) => {
        console.log(`\n  🍽️ ${details.eventName}`)
        console.log(`     Key: ${eventKey}`)
        console.log(`     Location: ${details.location}`)
        console.log(`     Date: ${details.startDate} - ${details.endDate}`)
        console.log(`     Attendees: ${details.attendeeCount}`)
      })
    }
    
    // 2. Analyze existing seat assignments for dining patterns
    console.log('\n2. Analyzing existing seat assignments...')
    
    const { data: seatAssignments } = await supabase
      .from('seat_assignments')
      .select('*')
      .not('table_name', 'is', null)
      .limit(20)
    
    if (seatAssignments && seatAssignments.length > 0) {
      console.log(`✅ Found ${seatAssignments.length} seat assignments with table information`)
      
      // Group by table
      const tableGroups = {}
      seatAssignments.forEach(assignment => {
        const tableName = assignment.table_name
        if (!tableGroups[tableName]) {
          tableGroups[tableName] = []
        }
        tableGroups[tableName].push(assignment)
      })
      
      console.log('\n🪑 Table Assignments:')
      Object.entries(tableGroups).forEach(([tableName, assignments]) => {
        console.log(`\n  ${tableName}: ${assignments.length} seats`)
        assignments.forEach(assignment => {
          console.log(`    Seat ${assignment.seat_number}: ${assignment.attendee_first_name} ${assignment.attendee_last_name}`)
        })
      })
    }
    
    // 3. Check for dining-related configurations
    console.log('\n3. Checking for dining-related configurations...')
    
    const { data: seatingConfigs } = await supabase
      .from('seating_configurations')
      .select('*')
    
    if (seatingConfigs && seatingConfigs.length > 0) {
      console.log(`✅ Found ${seatingConfigs.length} seating configurations`)
      
      seatingConfigs.forEach((config, index) => {
        console.log(`\n  Configuration ${index + 1}:`)
        console.log(`    ID: ${config.id}`)
        console.log(`    Has Seating: ${config.has_seating}`)
        console.log(`    Seating Type: ${config.seating_type}`)
        console.log(`    Layout Type: ${config.layout_type}`)
        console.log(`    Status: ${config.configuration_status}`)
      })
    } else {
      console.log('📭 No seating configurations found')
    }
    
    // 4. Analyze potential for dining seat assignments
    console.log('\n4. Analyzing potential for dining seat assignments...')
    
    // Get attendees who have dining selections
    const { data: diningAttendees } = await supabase
      .from('attendees')
      .select('id, first_name, last_name, dining_selections')
      .not('dining_selections', 'is', null)
    
    if (diningAttendees && diningAttendees.length > 0) {
      console.log(`\n👥 ${diningAttendees.length} attendees have dining selections`)
      
      // Count attendees by dining event
      const eventAttendeeCounts = {}
      diningAttendees.forEach(attendee => {
        if (attendee.dining_selections) {
          Object.entries(attendee.dining_selections).forEach(([eventKey, eventData]) => {
            if (eventData.attending) {
              if (!eventAttendeeCounts[eventKey]) {
                eventAttendeeCounts[eventKey] = 0
              }
              eventAttendeeCounts[eventKey]++
            }
          })
        }
      })
      
      console.log('\n📊 Attendee counts by dining event:')
      Object.entries(eventAttendeeCounts).forEach(([eventKey, count]) => {
        console.log(`  ${eventKey}: ${count} attendees`)
      })
      
      // Calculate seating requirements
      console.log('\n🪑 Seating Requirements Analysis:')
      Object.entries(eventAttendeeCounts).forEach(([eventKey, count]) => {
        const tablesNeeded = Math.ceil(count / 10) // Assuming 10 people per table
        console.log(`  ${eventKey}: ${count} attendees → ${tablesNeeded} tables needed`)
      })
    }
    
    // 5. Recommendations for implementation
    console.log('\n5. Implementation Recommendations:')
    console.log('====================================')
    
    console.log('\n✅ What we have:')
    console.log('  - 1,913 existing seat assignments with table/seat information')
    console.log('  - Attendees with dining selections (Welcome Dinner, Networking Cocktails)')
    console.log('  - Enhanced seat_assignments table with new fields (is_blocked, is_pending_review)')
    console.log('  - Table-based seating system already in place')
    
    console.log('\n🔧 What we can do:')
    console.log('  1. Use existing seat_assignments table for dining seat assignments')
    console.log('  2. Create dining-specific seating configurations')
    console.log('  3. Link dining events to seating configurations')
    console.log('  4. Assign attendees to tables based on their dining selections')
    console.log('  5. Use the new workflow fields for dining seat management')
    
    console.log('\n📋 Implementation Steps:')
    console.log('  1. Create dining_options records for each dining event')
    console.log('  2. Create seating_configurations for each dining venue')
    console.log('  3. Generate seat_assignments for attendees based on dining selections')
    console.log('  4. Use table_name and seat_number fields for dining table assignments')
    console.log('  5. Implement dining-specific UI for seat management')
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

// Run the assessment
assessDiningSeatingOptions()
