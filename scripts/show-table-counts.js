// Script to show row counts for all tables
import { getDirectTables, getDirectTableRowCount } from './lib/direct-db.js'

async function showTableCounts() {
  console.log('📊 Database Table Row Counts\n')
  
  try {
    // Get all tables
    const tablesResult = await getDirectTables()
    if (!tablesResult.success) {
      console.error('❌ Failed to get tables:', tablesResult.error)
      return
    }
    
    console.log(`Found ${tablesResult.tables.length} tables:\n`)
    
    // Get row count for each table
    let totalRows = 0
    const tableCounts = []
    
    for (const table of tablesResult.tables) {
      const countResult = await getDirectTableRowCount(table.table_name)
      const rowCount = countResult.success ? countResult.count : 0
      totalRows += rowCount
      
      tableCounts.push({
        name: table.table_name,
        count: rowCount
      })
    }
    
    // Sort by row count (descending)
    tableCounts.sort((a, b) => b.count - a.count)
    
    // Display results
    console.log('┌─────────────────────────────────┬─────────────┐')
    console.log('│ Table Name                      │ Row Count   │')
    console.log('├─────────────────────────────────┼─────────────┤')
    
    tableCounts.forEach(table => {
      const name = table.name.padEnd(31)
      const count = table.count.toLocaleString().padStart(11)
      console.log(`│ ${name} │ ${count} │`)
    })
    
    console.log('├─────────────────────────────────┼─────────────┤')
    console.log(`│ TOTAL                           │ ${totalRows.toLocaleString().padStart(11)} │`)
    console.log('└─────────────────────────────────┴─────────────┘')
    
    console.log(`\n📈 Summary:`)
    console.log(`   • ${tableCounts.length} tables total`)
    console.log(`   • ${totalRows.toLocaleString()} total rows`)
    console.log(`   • Largest table: ${tableCounts[0].name} (${tableCounts[0].count.toLocaleString()} rows)`)
    
    if (tableCounts[0].count === 0) {
      console.log(`   • All tables are currently empty`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the script
showTableCounts().catch(console.error)
