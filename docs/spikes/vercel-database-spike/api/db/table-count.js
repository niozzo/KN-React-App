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
      count: 0,
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting row count for table '${table}' using authenticated Supabase API`);
    
    // Get authenticated client
    const supabase = await getAuthenticatedClient();
    
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ API: Failed to get count for '${table}':`, error.message);
      return res.status(500).json({
        success: false,
        count: 0,
        table: table,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`✅ API: Table '${table}' has ${count || 0} rows`);
    return res.status(200).json({
      success: true,
      count: count || 0,
      table: table,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      count: 0,
      table: table,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
