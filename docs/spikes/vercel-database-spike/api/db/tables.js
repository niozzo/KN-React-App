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

  try {
    console.log('🔍 API: Getting tables using authenticated Supabase API...');
    
    // Get authenticated client
    const supabase = await getAuthenticatedClient();
    
    // Use discovered table names from the database
    const knownTables = [
      'agenda_items', 'attendees', 'breakout_sessions', 'dining_options', 
      'hotels', 'import_history', 'layout_templates', 'seat_assignments', 
      'seating_configurations', 'sponsors', 'user_profiles',
      'agenda', 'events', 'sessions', 'speakers', 'rooms', 'meetings',
      'tickets', 'payments', 'registrations', 'check_ins'
    ];
    
    const tableCounts = [];
    
    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          tableCounts.push({ 
            table_name: tableName, 
            count: count || 0,
            table_type: 'BASE TABLE'
          });
        }
      } catch (err) {
        // Table doesn't exist or error, continue
        console.log(`Table ${tableName} not accessible: ${err.message}`);
      }
    }
    
    console.log(`✅ API: Found ${tableCounts.length} accessible tables`);
    return res.status(200).json({
      success: true,
      tables: tableCounts,
      count: tableCounts.length,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      tables: null,
      count: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
