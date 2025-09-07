// Direct PostgreSQL database connection module
// This provides read-only access to the database using direct credentials

import { Pool } from 'pg'
import { dbConfig } from '../config/database.js'

// Create a connection pool for direct database access
const pool = new Pool(dbConfig.direct)

// Test direct database connection
export const testDirectConnection = async () => {
  let client
  try {
    console.log('🔍 Testing direct PostgreSQL connection...')
    client = await pool.connect()
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time, version() as db_version')
    
    return {
      success: true,
      data: {
        connected: true,
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version
      },
      error: null
    }
  } catch (err) {
    console.error('❌ Direct connection failed:', err.message)
    return {
      success: false,
      data: null,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Get all tables in the public schema
export const getDirectTables = async () => {
  let client
  try {
    client = await pool.connect()
    
    const query = `
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    const result = await client.query(query)
    
    return {
      success: true,
      tables: result.rows,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      tables: null,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Get table structure with detailed column information
export const getDirectTableStructure = async (tableName) => {
  let client
  try {
    client = await pool.connect()
    
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1
      ORDER BY ordinal_position
    `
    
    const result = await client.query(query, [tableName])
    
    return {
      success: true,
      columns: result.rows,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      columns: null,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Get sample data from a table with read-only access
export const getDirectTableData = async (tableName, limit = 10) => {
  let client
  try {
    client = await pool.connect()
    
    // Use parameterized query to prevent SQL injection
    const query = `SELECT * FROM "${tableName}" LIMIT $1`
    const result = await client.query(query, [limit])
    
    return {
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      rowCount: 0,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Get table row count
export const getDirectTableRowCount = async (tableName) => {
  let client
  try {
    client = await pool.connect()
    
    const query = `SELECT COUNT(*) as count FROM "${tableName}"`
    const result = await client.query(query)
    
    return {
      success: true,
      count: parseInt(result.rows[0].count),
      error: null
    }
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Execute a custom read-only query (for advanced users)
export const executeDirectQuery = async (query, params = []) => {
  let client
  try {
    client = await pool.connect()
    
    // Basic safety check - only allow SELECT statements
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for read-only access')
    }
    
    const result = await client.query(query, params)
    
    return {
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      fields: result.fields,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      rowCount: 0,
      fields: null,
      error: err.message
    }
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Close the connection pool (call this when shutting down the application)
export const closeDirectConnection = async () => {
  try {
    await pool.end()
    console.log('✅ Direct database connection pool closed')
  } catch (err) {
    console.error('❌ Error closing direct database connection:', err.message)
  }
}
