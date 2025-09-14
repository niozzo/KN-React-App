import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3004', 'http://localhost:3005', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.static(__dirname));

// Supabase configuration (from environment)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Track last authentication status for visibility via health endpoint
let lastAuthOk = false;

function isAuthError(err) {
  return Boolean(err && typeof err.message === 'string' && err.message.startsWith('AUTHENTICATION_REQUIRED'));
}

function handleApiError(res, err, extra = {}) {
  const status = isAuthError(err) ? 503 : 500;
  return res.status(status).json({ success: false, ...extra, error: err?.message || 'Unknown error', authRequired: isAuthError(err) });
}

// Authentication function (from original spike)
async function getAuthenticatedClient() {
  console.log('🔐 Authenticating with Supabase...');
  
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  
  // Authenticate with user credentials from environment
  const adminEmail = process.env.SUPABASE_USER_EMAIL;
  const adminPassword = process.env.SUPABASE_USER_PASSWORD;
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: adminEmail || '',
    password: adminPassword || ''
  });
  
  if (error) {
    console.error('❌ Authentication failed:', error.message);
    lastAuthOk = false;
    // Fail fast to avoid silent RLS zeros
    throw new Error(`AUTHENTICATION_REQUIRED: ${error.message}`);
  }
  
  console.log('✅ Authenticated successfully');
  lastAuthOk = true;
  return supabaseClient;
}

// API Routes (from spike)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    authConfigured: Boolean(process.env.SUPABASE_USER_EMAIL && process.env.SUPABASE_USER_PASSWORD),
    authOk: lastAuthOk
  });
});

// Test database connection
app.get('/api/db/test-connection', async (req, res) => {
  try {
    console.log('🔍 API: Testing database connection...');
    
    const supabaseClient = await getAuthenticatedClient();
    
    // Test connection by querying a known table (agenda_items is likely to exist)
    const { data, error } = await supabaseClient
      .from('agenda_items')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ API: Database connection failed:', error.message);
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ API: Database connection successful');
    return res.status(200).json({
      success: true,
      data: {
        dbVersion: 'PostgreSQL (Supabase)',
        connected: true,
        testTable: 'agenda_items'
      },
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return handleApiError(res, error, { data: null });
  }
});

// Get all tables
app.get('/api/db/tables', async (req, res) => {
  try {
    console.log('🔍 API: Getting all tables...');
    
    // Comprehensive table list from original spike (documented + alternative names)
    const knownTables = [
      'agenda_items', 'attendees', 'breakout_sessions', 'dining_options', 
      'hotels', 'import_history', 'layout_templates', 'seat_assignments', 
      'seating_configurations', 'sponsors', 'user_profiles',
      // Alternative table names that might exist
      'agenda', 'events', 'sessions', 'speakers', 'rooms', 'meetings',
      'tickets', 'payments', 'registrations', 'check_ins'
    ];
    
    const supabaseClient = await getAuthenticatedClient();
    const tables = [];
    
    // Test each known table to see if it exists and is accessible
    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabaseClient
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          tables.push({
            table_name: tableName,
            table_type: 'BASE TABLE',
            accessible: true,
            count: count || 0
          });
        } else {
          console.warn(`Table ${tableName} not accessible:`, error.message);
          tables.push({
            table_name: tableName,
            table_type: 'BASE TABLE',
            accessible: false,
            error: error.message
          });
        }
      } catch (err) {
        console.warn(`Error testing table ${tableName}:`, err.message);
        tables.push({
          table_name: tableName,
          table_type: 'BASE TABLE',
          accessible: false,
          error: err.message
        });
      }
    }
    
    console.log(`✅ API: Retrieved ${tables.length} tables`);
    return res.status(200).json({
      success: true,
      tables: tables,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return handleApiError(res, error, { tables: [] });
  }
});

// Get table row count
app.get('/api/db/table-count', async (req, res) => {
  const { table } = req.query;

  if (!table) {
    return res.status(400).json({
      success: false,
      count: 0,
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting row count for table '${table}'...`);
    
    const supabaseClient = await getAuthenticatedClient();
    
    const { count, error } = await supabaseClient
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
    
    console.log(`✅ API: Table '${table}' has ${count} rows`);
    return res.status(200).json({
      success: true,
      count: count || 0,
      table: table,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return handleApiError(res, error, { count: 0, table });
  }
});

// Get table data
app.get('/api/db/table-data', async (req, res) => {
  const { table, limit = 10 } = req.query;

  if (!table) {
    return res.status(400).json({
      success: false,
      data: [],
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting data from table '${table}' (limit: ${limit})...`);
    
    const supabaseClient = await getAuthenticatedClient();
    
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .limit(parseInt(limit));
    
    if (error) {
      console.error(`❌ API: Failed to get data from '${table}':`, error.message);
      return res.status(500).json({
        success: false,
        data: [],
        table: table,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`✅ API: Retrieved ${data.length} rows from '${table}'`);
    return res.status(200).json({
      success: true,
      data: data || [],
      table: table,
      rowCount: data ? data.length : 0,
      error: null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Unexpected error:', error.message);
    return handleApiError(res, error, { data: [], table });
  }
});

// Get table structure
app.get('/api/db/table-structure', async (req, res) => {
  const { table } = req.query;

  if (!table) {
    return res.status(400).json({
      success: false,
      columns: [],
      error: 'Table name is required. Use ?table=table_name',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`🔍 API: Getting structure for table '${table}'...`);
    
    const supabaseClient = await getAuthenticatedClient();
    
    // Get a sample row to infer structure
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ API: Failed to get structure for '${table}':`, error.message);
      return res.status(500).json({
        success: false,
        columns: [],
        table: table,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Infer column structure from sample data
    const columns = data && data.length > 0 ? 
      Object.keys(data[0]).map(key => ({
        column_name: key,
        data_type: typeof data[0][key],
        is_nullable: data[0][key] === null ? 'YES' : 'NO',
        column_default: null
      })) : [];
    
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
    return handleApiError(res, error, { columns: [], table });
  }
});

// Convenience endpoints for key tables (server-side authenticated access)

// Helper to fetch table data with optional limit
async function fetchTableRows(tableName, limit) {
  const supabaseClient = await getAuthenticatedClient();
  const query = supabaseClient.from(tableName).select('*');
  if (limit) {
    query.limit(parseInt(limit));
  }
  return query;
}

app.get('/api/agenda-items', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('agenda_items', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/attendees', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('attendees', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/sponsors', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('sponsors', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/seat-assignments', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('seat_assignments', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/dining-options', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('dining_options', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/hotels', async (req, res) => {
  try {
    const { limit } = req.query;
    const { data, error } = await fetchTableRows('hotels', limit);
    if (error) {
      return handleApiError(res, error);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

// Additional parameterized endpoints
app.get('/api/attendees/:id', async (req, res) => {
  try {
    const supabaseClient = await getAuthenticatedClient();
    const { data, error } = await supabaseClient
      .from('attendees')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/attendees/:id/seat-assignments', async (req, res) => {
  try {
    const supabaseClient = await getAuthenticatedClient();
    const { data, error } = await supabaseClient
      .from('seat_assignments')
      .select('*')
      .eq('attendee_id', req.params.id)
      .order('assigned_at', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/attendees/:id/dining-selections', async (req, res) => {
  try {
    const supabaseClient = await getAuthenticatedClient();
    const { data: attendee, error: attendeeError } = await supabaseClient
      .from('attendees')
      .select('dining_selections')
      .eq('id', req.params.id)
      .single();
    if (attendeeError) return res.status(404).json({ success: false, error: attendeeError.message });
    const selections = Array.isArray(attendee?.dining_selections) ? attendee.dining_selections : [];
    if (selections.length === 0) return res.status(200).json({ success: true, data: [] });
    const { data, error } = await supabaseClient
      .from('dining_options')
      .select('*')
      .in('id', selections)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(res, err);
  }
});

app.get('/api/hotels/:id', async (req, res) => {
  try {
    const supabaseClient = await getAuthenticatedClient();
    const { data, error } = await supabaseClient
      .from('hotels')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/seating-configurations', async (req, res) => {
  try {
    const supabaseClient = await getAuthenticatedClient();
    const { data, error } = await supabaseClient
      .from('seating_configurations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Serve the spike client
app.get('/', (req, res) => {
  const spikeClientPath = path.join(__dirname, '../docs/spikes/vercel-database-spike/spike-client.html');
  res.sendFile(spikeClientPath);
});

// Serve the spike client at /spike
app.get('/spike', (req, res) => {
  const spikeClientPath = path.join(__dirname, '../docs/spikes/vercel-database-spike/spike-client.html');
  res.sendFile(spikeClientPath);
});

app.listen(PORT, () => {
  console.log(`🚀 Spike Server running on http://localhost:${PORT}`);
  console.log(`📊 Database Explorer: http://localhost:${PORT}/spike`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔐 Auth configured: ${process.env.SUPABASE_USER_EMAIL ? 'Yes' : 'No'}`);
});
