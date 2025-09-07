// Test script for direct PostgreSQL connection
import { 
  testDirectConnection, 
  getDirectTables, 
  getDirectTableStructure, 
  getDirectTableData,
  getDirectTableRowCount,
  closeDirectConnection 
} from './lib/direct-db.js'

async function testDirectDB() {
  console.log('🚀 Starting Direct Database Connection Test...\n')
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...')
    const connectionResult = await testDirectConnection()
    
    if (connectionResult.success) {
      console.log('✅ Connection successful!')
      console.log(`   Current time: ${connectionResult.data.currentTime}`)
      console.log(`   DB version: ${connectionResult.data.dbVersion.split(' ')[0]} ${connectionResult.data.dbVersion.split(' ')[1]}`)
    } else {
      console.log('❌ Connection failed:', connectionResult.error)
      return
    }
    
    console.log('\n2️⃣ Getting all tables...')
    const tablesResult = await getDirectTables()
    
    if (tablesResult.success) {
      console.log(`✅ Found ${tablesResult.tables.length} tables:`)
      tablesResult.tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`)
      })
      
      if (tablesResult.tables.length > 0) {
        const firstTable = tablesResult.tables[0].table_name
        console.log(`\n3️⃣ Testing table structure for '${firstTable}'...`)
        
        const structureResult = await getDirectTableStructure(firstTable)
        if (structureResult.success) {
          console.log(`✅ Table structure for '${firstTable}':`)
          structureResult.columns.forEach((column, index) => {
            console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}${column.is_nullable === 'YES' ? ', nullable' : ', not null'})`)
          })
        } else {
          console.log('❌ Failed to get table structure:', structureResult.error)
        }
        
        console.log(`\n4️⃣ Testing data read from '${firstTable}'...`)
        const dataResult = await getDirectTableData(firstTable, 3)
        if (dataResult.success) {
          console.log(`✅ Successfully read ${dataResult.rowCount} rows from '${firstTable}':`)
          if (dataResult.data.length > 0) {
            console.log('   Sample row:', JSON.stringify(dataResult.data[0], null, 2))
          } else {
            console.log('   Table is empty')
          }
        } else {
          console.log('❌ Failed to read data:', dataResult.error)
        }
        
        console.log(`\n5️⃣ Getting row count for '${firstTable}'...`)
        const countResult = await getDirectTableRowCount(firstTable)
        if (countResult.success) {
          console.log(`✅ Total rows in '${firstTable}': ${countResult.count}`)
        } else {
          console.log('❌ Failed to get row count:', countResult.error)
        }
      }
    } else {
      console.log('❌ Failed to get tables:', tablesResult.error)
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  } finally {
    console.log('\n6️⃣ Closing connection...')
    await closeDirectConnection()
    console.log('✅ Test completed!')
  }
}

// Run the test
testDirectDB().catch(console.error)
