/**
 * Analyze Local Cache Schema
 * Identifies schema differences in your local cache data
 */

import fs from 'fs'
import path from 'path'

function analyzeCacheData() {
  console.log('🔍 Analyzing Local Cache Schema')
  console.log('================================')
  
  const cacheDir = path.join(process.cwd(), 'docs', 'localCacheCopy')
  
  const cacheFiles = {
    'seat_assignments': 'kn_cache_seat_assignments.json',
    'seating_configurations': 'kn_cache_seating_configurations.json', 
    'agenda_items': 'kn_cache_agenda_items.json',
    'dining_options': 'kn_cache_dining_options.json',
    'attendees': 'kn_cache_attendees.json'
  }
  
  const results = {}
  
  for (const [tableName, fileName] of Object.entries(cacheFiles)) {
    console.log(`\n📊 Analyzing ${tableName}`)
    console.log('─'.repeat(50))
    
    try {
      const filePath = path.join(cacheDir, fileName)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const cacheData = JSON.parse(fileContent)
      
      if (!cacheData.data || cacheData.data.length === 0) {
        console.log('⚠️  No data in cache')
        continue
      }
      
      const record = cacheData.data[0]
      const fields = Object.keys(record)
      
      console.log(`✅ Found ${fields.length} fields:`)
      fields.forEach(field => {
        const value = record[field]
        const type = typeof value
        const isNull = value === null
        const preview = isNull ? 'null' : 
          typeof value === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
          typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
          String(value)
        
        console.log(`  ${field}: ${type} = ${preview}`)
      })
      
      results[tableName] = {
        fields,
        fieldCount: fields.length,
        sampleRecord: record
      }
      
    } catch (error) {
      console.log(`❌ Error reading ${fileName}: ${error.message}`)
    }
  }
  
  // Compare with expected TypeScript interfaces
  console.log('\n🔍 COMPARISON WITH TYPESCRIPT INTERFACES')
  console.log('=========================================')
  
  // Expected SeatAssignment fields from your TypeScript interface
  const expectedSeatAssignmentFields = [
    'id', 'seating_configuration_id', 'attendee_id', 'table_name', 'seat_number',
    'seat_position', 'assignment_type', 'assigned_at', 'notes', 'created_at', 'updated_at',
    'column_number', 'row_number', 'attendee_first_name', 'attendee_last_name'
  ]
  
  if (results.seat_assignments) {
    console.log('\n📋 Seat Assignments Analysis:')
    const actualFields = results.seat_assignments.fields
    const missingInInterface = actualFields.filter(field => !expectedSeatAssignmentFields.includes(field))
    const missingInCache = expectedSeatAssignmentFields.filter(field => !actualFields.includes(field))
    
    if (missingInInterface.length > 0) {
      console.log('🆕 NEW fields in cache (not in TypeScript interface):')
      missingInInterface.forEach(field => console.log(`  + ${field}`))
    }
    
    if (missingInCache.length > 0) {
      console.log('❌ MISSING fields in cache (expected in TypeScript):')
      missingInCache.forEach(field => console.log(`  - ${field}`))
    }
    
    if (missingInInterface.length === 0 && missingInCache.length === 0) {
      console.log('✅ All fields match TypeScript interface')
    }
  }
  
  // Check for new fields that might have been added
  console.log('\n🔍 POTENTIAL NEW FIELDS:')
  console.log('========================')
  
  if (results.seat_assignments) {
    const newFields = results.seat_assignments.fields.filter(field => 
      !expectedSeatAssignmentFields.includes(field)
    )
    
    if (newFields.length > 0) {
      console.log('New fields found in seat_assignments:')
      newFields.forEach(field => {
        const value = results.seat_assignments.sampleRecord[field]
        console.log(`  - ${field}: ${typeof value} = ${JSON.stringify(value)}`)
      })
    }
  }
  
  return results
}

// Run the analysis
analyzeCacheData()
