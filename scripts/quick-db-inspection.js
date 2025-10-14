/**
 * Quick Database Inspection Script
 * Run this to see current database schema vs your cache
 */

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'

async function quickInspection() {
  console.log('🔍 Quick Database Schema Inspection')
  console.log('====================================')
  
  // Import Supabase client
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  const tables = [
    'seat_assignments',
    'seating_configurations',
    'agenda_items', 
    'dining_options',
    'attendees'
  ]
  
  for (const tableName of tables) {
    console.log(`\n📊 Table: ${tableName}`)
    console.log('─'.repeat(50))
    
    try {
      // Get one record to see the structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Error: ${error.message}`)
        continue
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️  Table is empty')
        continue
      }
      
      const record = data[0]
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
      
    } catch (error) {
      console.log(`❌ Failed to query ${tableName}: ${error.message}`)
    }
  }
}

// Instructions for running
console.log(`
🚀 TO RUN THIS SCRIPT:

1. Replace YOUR_SUPABASE_URL_HERE and YOUR_SUPABASE_ANON_KEY_HERE with your actual credentials
2. Run: node scripts/quick-db-inspection.js

This will show you the current database schema so you can compare with your cache data.
`)

// Uncomment the line below when you've added your credentials
// quickInspection()
