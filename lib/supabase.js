import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikcgdhztkrexuuqheli.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (err) {
    return { success: false, data: null, error: err.message }
  }
}

// Get all tables by trying common table names
export const getTables = async () => {
  try {
    const commonTables = ['users', 'profiles', 'posts', 'products', 'orders', 'customers', 'items', 'articles', 'comments', 'categories']
    const foundTables = []
    
    for (const tableName of commonTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          foundTables.push({ table_name: tableName })
        }
      } catch (err) {
        // Table doesn't exist, continue
      }
    }
    
    return { success: true, tables: foundTables, error: null }
  } catch (err) {
    return { success: false, tables: null, error: err.message }
  }
}

// Get table structure
export const getTableStructure = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')
    
    if (error) throw error
    return { success: true, columns: data, error: null }
  } catch (err) {
    return { success: false, columns: null, error: err.message }
  }
}

// Get sample data from a table
export const getTableData = async (tableName, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit)
    
    if (error) throw error
    return { success: true, data, error: null }
  } catch (err) {
    return { success: false, data: null, error: err.message }
  }
}
