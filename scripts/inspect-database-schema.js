/**
 * Database Schema Inspection Script
 * Compares current database schema with local cache data to identify changes
 */

import { createClient } from '@supabase/supabase-js'

// Database connection (you'll need to add your credentials)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get table schema information from Supabase
 */
async function getTableSchema(tableName) {
  try {
    console.log(`\n🔍 Inspecting table: ${tableName}`)
    
    // Get a sample record to see the actual structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.error(`❌ Error fetching ${tableName}:`, error.message)
      return null
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  Table ${tableName} is empty`)
      return { fields: [], sampleData: null }
    }
    
    const sampleRecord = data[0]
    const fields = Object.keys(sampleRecord)
    
    console.log(`✅ Found ${fields.length} fields in ${tableName}:`)
    fields.forEach(field => {
      const value = sampleRecord[field]
      const type = typeof value
      const isNull = value === null
      console.log(`  - ${field}: ${type} ${isNull ? '(null)' : ''}`)
    })
    
    return {
      fields,
      sampleData: sampleRecord,
      fieldCount: fields.length
    }
    
  } catch (error) {
    console.error(`❌ Error inspecting ${tableName}:`, error.message)
    return null
  }
}

/**
 * Compare database schema with local cache
 */
function compareWithCache(dbSchema, cacheData, tableName) {
  console.log(`\n📊 Comparing ${tableName} database vs cache:`)
  
  if (!cacheData || !cacheData.data || cacheData.data.length === 0) {
    console.log(`⚠️  No cache data available for ${tableName}`)
    return
  }
  
  const cacheRecord = cacheData.data[0]
  const cacheFields = Object.keys(cacheRecord)
  
  console.log(`Database fields: ${dbSchema.fields.length}`)
  console.log(`Cache fields: ${cacheFields.length}`)
  
  // Find fields in database but not in cache
  const dbOnlyFields = dbSchema.fields.filter(field => !cacheFields.includes(field))
  if (dbOnlyFields.length > 0) {
    console.log(`🆕 NEW fields in database (not in cache):`)
    dbOnlyFields.forEach(field => console.log(`  + ${field}`))
  }
  
  // Find fields in cache but not in database
  const cacheOnlyFields = cacheFields.filter(field => !dbSchema.fields.includes(field))
  if (cacheOnlyFields.length > 0) {
    console.log(`🗑️  REMOVED fields (in cache but not in database):`)
    cacheOnlyFields.forEach(field => console.log(`  - ${field}`))
  }
  
  // Find common fields with different types
  const commonFields = dbSchema.fields.filter(field => cacheFields.includes(field))
  console.log(`\n🔍 Field type comparison:`)
  commonFields.forEach(field => {
    const dbValue = dbSchema.sampleData[field]
    const cacheValue = cacheRecord[field]
    const dbType = typeof dbValue
    const cacheType = typeof cacheValue
    
    if (dbType !== cacheType) {
      console.log(`  ⚠️  ${field}: DB(${dbType}) vs Cache(${cacheType})`)
    } else {
      console.log(`  ✅ ${field}: ${dbType}`)
    }
  })
}

/**
 * Load local cache data
 */
async function loadCacheData() {
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const cacheDir = path.join(process.cwd(), 'docs', 'localCacheCopy')
    
    const cacheFiles = {
      seat_assignments: 'kn_cache_seat_assignments.json',
      seating_configurations: 'kn_cache_seating_configurations.json',
      agenda_items: 'kn_cache_agenda_items.json',
      dining_options: 'kn_cache_dining_options.json',
      attendees: 'kn_cache_attendees.json'
    }
    
    const cacheData = {}
    
    for (const [tableName, fileName] of Object.entries(cacheFiles)) {
      try {
        const filePath = path.join(cacheDir, fileName)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        cacheData[tableName] = JSON.parse(fileContent)
        console.log(`✅ Loaded cache for ${tableName}`)
      } catch (error) {
        console.log(`⚠️  Could not load cache for ${tableName}: ${error.message}`)
      }
    }
    
    return cacheData
  } catch (error) {
    console.error('❌ Error loading cache data:', error.message)
    return {}
  }
}

/**
 * Main inspection function
 */
async function inspectDatabaseSchema() {
  console.log('🔍 Database Schema Inspection')
  console.log('============================')
  
  // Load local cache data
  const cacheData = await loadCacheData()
  
  // Tables to inspect
  const tablesToInspect = [
    'seat_assignments',
    'seating_configurations', 
    'agenda_items',
    'dining_options',
    'attendees'
  ]
  
  const results = {}
  
  for (const tableName of tablesToInspect) {
    const dbSchema = await getTableSchema(tableName)
    if (dbSchema) {
      results[tableName] = dbSchema
      
      // Compare with cache if available
      if (cacheData[tableName]) {
        compareWithCache(dbSchema, cacheData[tableName], tableName)
      }
    }
  }
  
  // Summary
  console.log('\n📋 SUMMARY')
  console.log('===========')
  Object.entries(results).forEach(([tableName, schema]) => {
    console.log(`${tableName}: ${schema.fieldCount} fields`)
  })
  
  return results
}

// Run the inspection
if (import.meta.url === `file://${process.argv[1]}`) {
  inspectDatabaseSchema()
    .then(results => {
      console.log('\n✅ Schema inspection complete')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Schema inspection failed:', error)
      process.exit(1)
    })
}

export { inspectDatabaseSchema }
