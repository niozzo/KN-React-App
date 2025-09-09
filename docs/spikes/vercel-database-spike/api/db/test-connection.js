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
    console.log('🔍 API: Testing Supabase API connection...');
    
    // Test connection by trying to access a known table
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, but connection is working
      console.log('✅ API: Connection test successful - Supabase API accessible');
      return res.status(200).json({
        success: true,
        data: {
          connected: true,
          method: 'Supabase API',
          message: 'Supabase API connection successful'
        },
        error: null,
        timestamp: new Date().toISOString()
      });
    } else if (error) {
      throw new Error(error.message);
    } else {
      console.log('✅ API: Connection test successful - data accessible');
      return res.status(200).json({
        success: true,
        data: {
          connected: true,
          method: 'Supabase API',
          message: 'Supabase API connection successful with data access'
        },
        error: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ API: Connection test failed:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
