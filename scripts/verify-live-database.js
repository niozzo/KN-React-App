/**
 * Verify Live Database Schema
 * Compares live database with local cache data
 */

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'

async function verifyLiveDatabase() {
  console.log('🔍 Verifying Live Database Schema')
  console.log('=================================')
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Check if we can connect
    console.log('Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('attendees')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check specific tables
    const tables = [
      'seat_assignments',
      'seating_configurations',
      'agenda_items',
      'dining_options',
      'attendees'
    ]
    
    for (const tableName of tables) {
      console.log(`\n📊 Checking table: ${tableName}`)
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
        
        // Check for specific new fields we identified
        if (tableName === 'seat_assignments') {
          console.log('\n🔍 Checking for new fields in seat_assignments:')
          const newFields = ['is_blocked', 'is_pending_review']
          newFields.forEach(field => {
            if (fields.includes(field)) {
              console.log(`  ✅ ${field}: ${typeof record[field]} = ${record[field]}`)
            } else {
              console.log(`  ❌ ${field}: NOT FOUND`)
            }
          })
        }
        
        if (tableName === 'seating_configurations') {
          console.log('\n🔍 Checking for new fields in seating_configurations:')
          const newFields = [
            'configuration_status', 'weightings', 'algorithm_status', 
            'algorithm_job_id', 'algorithm_results', 'parent_configuration_id',
            'copy_type', 'is_master', 'last_synced_at'
          ]
          newFields.forEach(field => {
            if (fields.includes(field)) {
              console.log(`  ✅ ${field}: ${typeof record[field]} = ${JSON.stringify(record[field]).substring(0, 50)}...`)
            } else {
              console.log(`  ❌ ${field}: NOT FOUND`)
            }
          })
        }
        
      } catch (error) {
        console.log(`❌ Failed to query ${tableName}: ${error.message}`)
      }
    }
    
    // Check for Aaron Cooper and Sunshine Burkett specifically
    console.log('\n👥 Checking specific attendees:')
    console.log('==============================')
    
    // Check Aaron Cooper
    const { data: aaronData, error: aaronError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('attendee_first_name', 'Aaron')
      .eq('attendee_last_name', 'Cooper')
      .limit(5)
    
    if (aaronError) {
      console.log('❌ Error fetching Aaron Cooper:', aaronError.message)
    } else {
      console.log(`✅ Aaron Cooper: ${aaronData.length} assignments found`)
      if (aaronData.length > 0) {
        console.log('Sample assignment fields:', Object.keys(aaronData[0]))
      }
    }
    
    // Check Sunshine Burkett
    const { data: sunshineData, error: sunshineError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('attendee_first_name', 'Sunshine')
      .eq('attendee_last_name', 'Burkett')
      .limit(5)
    
    if (sunshineError) {
      console.log('❌ Error fetching Sunshine Burkett:', sunshineError.message)
    } else {
      console.log(`✅ Sunshine Burkett: ${sunshineData.length} assignments found`)
      if (sunshineData.length > 0) {
        console.log('Sample assignment fields:', Object.keys(sunshineData[0]))
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

// Instructions
console.log(`
🚀 TO RUN THIS SCRIPT:

1. Set your Supabase credentials:
   export VITE_SUPABASE_URL="your-supabase-url"
   export VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

2. Or replace the credentials in this script directly

3. Run: node scripts/verify-live-database.js

This will show you the current live database schema and compare it with your cache data.
`)

// Uncomment the line below when you've added your credentials
// verifyLiveDatabase()
