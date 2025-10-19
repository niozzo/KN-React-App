#!/usr/bin/env node

/**
 * Setup script for Application DB table_assignments_cache
 * Creates the table and indexes in the Application DB
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const APP_DB_URL = process.env.VITE_APPLICATION_DB_URL;
const APP_DB_ANON_KEY = process.env.VITE_APPLICATION_DB_ANON_KEY;

if (!APP_DB_URL || !APP_DB_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_APPLICATION_DB_URL');
  console.error('   VITE_APPLICATION_DB_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(APP_DB_URL, APP_DB_ANON_KEY);

// Read SQL schema file
const readSchemaFile = () => {
  const schemaPath = path.join(__dirname, 'create-table-assignments-cache.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  
  return fs.readFileSync(schemaPath, 'utf8');
};

// Execute SQL schema
const setupDatabase = async () => {
  console.log('🚀 Setting up Application DB for table assignments cache...');
  
  try {
    // Read SQL schema
    const sql = readSchemaFile();
    console.log('📄 SQL schema loaded');
    
    // Execute SQL
    console.log('⚡ Executing SQL schema...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return false;
    }
    
    console.log('✅ SQL schema executed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  }
};

// Verify table creation
const verifyTable = async () => {
  console.log('🔍 Verifying table creation...');
  
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('table_assignments_cache')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table verification failed:', error);
      return false;
    }
    
    console.log('✅ Table table_assignments_cache exists and is accessible');
    return true;
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
};

// Test data insertion
const testDataInsertion = async () => {
  console.log('🧪 Testing data insertion...');
  
  try {
    // Insert test data
    const testData = {
      dining_option_id: '00000000-0000-0000-0000-000000000000',
      table_name: 'Test Table',
      attendees: [
        {
          attendee_id: '00000000-0000-0000-0000-000000000001',
          first_name: 'Test',
          last_name: 'User',
          company_name_standardized: 'Test Company',
          photo: null
        }
      ]
    };
    
    const { data, error } = await supabase
      .from('table_assignments_cache')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Test data insertion failed:', error);
      return false;
    }
    
    console.log('✅ Test data inserted successfully');
    
    // Clean up test data
    await supabase
      .from('table_assignments_cache')
      .delete()
      .eq('dining_option_id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🧹 Test data cleaned up');
    return true;
    
  } catch (error) {
    console.error('❌ Test insertion error:', error.message);
    return false;
  }
};

// Main setup function
const main = async () => {
  console.log('🎯 Application DB Setup for Table Assignments Cache');
  console.log(`Application DB URL: ${APP_DB_URL}`);
  
  const setupResult = await setupDatabase();
  if (!setupResult) {
    console.log('❌ Database setup failed');
    process.exit(1);
  }
  
  const verifyResult = await verifyTable();
  if (!verifyResult) {
    console.log('❌ Table verification failed');
    process.exit(1);
  }
  
  const testResult = await testDataInsertion();
  if (!testResult) {
    console.log('❌ Data insertion test failed');
    process.exit(1);
  }
  
  console.log('\n🎉 Application DB setup completed successfully!');
  console.log('✅ Table table_assignments_cache created');
  console.log('✅ Indexes created');
  console.log('✅ Data insertion tested');
  console.log('\n📋 Next steps:');
  console.log('1. Test the API endpoints with: node scripts/test-table-assignments-api.js');
  console.log('2. Run single table processing: GET /api/sync-table-assignments-single');
  console.log('3. Run full population: GET /api/sync-table-assignments-full');
};

// Run setup
main().catch((error) => {
  console.error('Setup error:', error);
  process.exit(1);
});
