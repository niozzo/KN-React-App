import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    console.log('🔍 API: Discovering tables using Supabase information schema...');
    
    // Try to get table names from information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.log('❌ Information schema not accessible, trying alternative approach...');
      
      // Fallback: try common table names and see which ones exist
      const commonTables = [
        'agenda_items', 'attendees', 'breakout_sessions', 'dining_options', 
        'hotels', 'import_history', 'layout_templates', 'seat_assignments', 
        'seating_configurations', 'sponsors', 'user_profiles',
        'agenda', 'events', 'sessions', 'speakers', 'rooms', 'meetings',
        'tickets', 'payments', 'registrations', 'check_ins'
      ];
      
      const foundTables = [];
      
      for (const tableName of commonTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            foundTables.push({ 
              table_name: tableName, 
              table_type: 'BASE TABLE',
              count: count || 0
            });
            console.log(`✅ Found table: ${tableName} (${count || 0} rows)`);
          }
        } catch (err) {
          // Table doesn't exist, continue
        }
      }
      
      console.log(`✅ API: Found ${foundTables.length} tables using fallback method`);
      return res.status(200).json({
        success: true,
        tables: foundTables,
        count: foundTables.length,
        method: 'fallback',
        error: null,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`✅ API: Found ${data.length} tables using information schema`);
    return res.status(200).json({
      success: true,
      tables: data,
      count: data.length,
      method: 'information_schema',
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
