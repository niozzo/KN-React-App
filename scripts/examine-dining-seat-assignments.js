/**
 * Examine Dining Seat Assignments Table
 * Script to analyze the dining_seat_assignments table structure and data
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

async function examineDiningSeatAssignments() {
  console.log('🔍 Examining Dining Seat Assignments Table')
  console.log('==========================================')
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // First, let's check if the table exists and get its structure
    console.log('\n1. Checking table existence and structure...')
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'dining_seat_assignments')
      .order('ordinal_position')
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError.message)
      return
    }
    
    if (!tableInfo || tableInfo.length === 0) {
      console.log('❌ Table "dining_seat_assignments" does not exist')
      
      // Let's check what dining-related tables do exist
      console.log('\n🔍 Checking for other dining-related tables...')
      const { data: allTables, error: allTablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%dining%')
      
      if (allTablesError) {
        console.error('❌ Error checking for dining tables:', allTablesError.message)
      } else if (allTables && allTables.length > 0) {
        console.log('📋 Found dining-related tables:')
        allTables.forEach(table => {
          console.log(`  - ${table.table_name}`)
        })
      } else {
        console.log('❌ No dining-related tables found')
      }
      return
    }
    
    console.log('✅ Table "dining_seat_assignments" exists!')
    console.log('\n📋 Table Structure:')
    tableInfo.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // Now let's try to get some sample data
    console.log('\n2. Fetching sample data...')
    
    const { data: sampleData, error: dataError } = await supabase
      .from('dining_seat_assignments')
      .select('*')
      .limit(5)
    
    if (dataError) {
      console.error('❌ Error fetching sample data:', dataError.message)
      return
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log('📭 Table is empty - no data found')
    } else {
      console.log(`✅ Found ${sampleData.length} sample records:`)
      console.log('\n📊 Sample Data:')
      sampleData.forEach((record, index) => {
        console.log(`\n  Record ${index + 1}:`)
        Object.entries(record).forEach(([key, value]) => {
          console.log(`    ${key}: ${JSON.stringify(value)}`)
        })
      })
    }
    
    // Get total row count
    console.log('\n3. Getting total row count...')
    const { count, error: countError } = await supabase
      .from('dining_seat_assignments')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error getting row count:', countError.message)
    } else {
      console.log(`📊 Total rows in dining_seat_assignments: ${count}`)
    }
    
    // Check for related tables that might have data
    console.log('\n4. Checking related dining tables...')
    const relatedTables = [
      'dining_assignments',
      'dining_seating', 
      'dining_seats',
      'dining_table_assignments',
      'dining_table_seats',
      'meal_seat_assignments',
      'meal_assignments'
    ]
    
    for (const tableName of relatedTables) {
      try {
        const { count: tableCount, error: tableCountError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!tableCountError && tableCount !== undefined) {
          console.log(`  ${tableName}: ${tableCount} rows`)
        }
      } catch (err) {
        // Table doesn't exist or other error
        console.log(`  ${tableName}: Table not found or inaccessible`)
      }
    }
    
  } catch (err) {
    console.error('❌ Script error:', err.message)
  }
}

// Run the examination
examineDiningSeatAssignments()
