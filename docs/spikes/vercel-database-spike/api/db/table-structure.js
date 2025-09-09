import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';

// Create authenticated Supabase client
async function getAuthenticatedClient() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Authenticate with the same credentials that work in the browser
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ishan.gammampila@apax.com',
    password: 'xx8kRx#tn@R?'
  });
  
  if (error) {
    console.error('❌ Authentication failed:', error.message);
    // Fall back to anon client if auth fails
    return supabase;
  }
  
  console.log('✅ Authenticated successfully');
  return supabase;
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  const { table } = req.query;

  // Validate required parameters
  if (!table) {
    return res.status(400).json({
      success: false,
      columns: null,
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting structure for table '${table}' using authenticated Supabase API`);
    
    // Get authenticated client
    const supabase = await getAuthenticatedClient();
    
    // Query information_schema to get table structure
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', table)
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (error) {
      console.error(`❌ API: Failed to get structure for '${table}':`, error.message);
      return res.status(500).json({
        success: false,
        columns: null,
        table: table,
        columnCount: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Transform the data to match expected format
    const columns = data.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
      column_default: col.column_default
    }));
    
    console.log(`✅ API: Retrieved ${columns.length} columns from '${table}'`);
    return res.status(200).json({
      success: true,
      columns: columns,
      table: table,
      columnCount: columns.length,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      columns: null,
      table: table,
      columnCount: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
