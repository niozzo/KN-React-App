#!/usr/bin/env node

/**
 * Direct API test script - tests the API endpoints directly
 * This script can be run without a local server
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const MAIN_DB_URL = process.env.VITE_SUPABASE_URL;
const MAIN_DB_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_DB_URL = process.env.VITE_APPLICATION_DB_URL;
const APP_DB_ANON_KEY = process.env.VITE_APPLICATION_DB_ANON_KEY;

if (!MAIN_DB_URL || !MAIN_DB_ANON_KEY || !APP_DB_URL || !APP_DB_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  console.error('   VITE_APPLICATION_DB_URL');
  console.error('   VITE_APPLICATION_DB_ANON_KEY');
  process.exit(1);
}

// Create Supabase clients
const mainDb = createClient(MAIN_DB_URL, MAIN_DB_ANON_KEY);
const appDb = createClient(APP_DB_URL, APP_DB_ANON_KEY);

// Test single table processing
const testSingleTable = async () => {
  console.log('\n🧪 Testing Single Table Processing...');
  
  try {
    // 1. Read seat assignments for Table 1 from main DB
    console.log('📖 Reading seat assignments for Table 1...');
    const { data: seatAssignments, error: seatError } = await mainDb
      .from('seat_assignments')
      .select('*')
      .eq('table_name', 'Table 1')
      .eq('event_type', 'dining');
    
    if (seatError) {
      console.error('❌ Error reading seat assignments:', seatError);
      return false;
    }
    
    if (!seatAssignments || seatAssignments.length === 0) {
      console.log('⚠️  No seat assignments found for Table 1');
      return false;
    }
    
    console.log(`✅ Found ${seatAssignments.length} seat assignments for Table 1`);
    
    // 2. Process table assignments
    console.log('⚙️  Processing table assignments...');
    const tableGroups = {};
    
    for (const assignment of seatAssignments) {
      const key = `${assignment.dining_option_id}-${assignment.table_name}`;
      
      if (!tableGroups[key]) {
        tableGroups[key] = {
          dining_option_id: assignment.dining_option_id,
          table_name: assignment.table_name,
          attendees: []
        };
      }
      
      // Get attendee details from main DB
      const { data: attendee } = await mainDb
        .from('attendees')
        .select('id, first_name, last_name, company, company_name_standardized, photo')
        .eq('id', assignment.attendee_id)
        .single();
      
      if (attendee) {
        tableGroups[key].attendees.push({
          attendee_id: attendee.id,
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          company_name_standardized: attendee.company_name_standardized || attendee.company,
          photo: attendee.photo
        });
      }
    }
    
    const tableAssignments = Object.values(tableGroups);
    console.log(`✅ Processed ${tableAssignments.length} table assignments`);
    
    // 3. Write to Application DB
    console.log('💾 Writing to Application DB...');
    const { data: upsertData, error: upsertError } = await appDb
      .from('table_assignments_cache')
      .upsert(tableAssignments, { 
        onConflict: 'dining_option_id,table_name',
        ignoreDuplicates: false 
      })
      .select();
    
    if (upsertError) {
      console.error('❌ Error writing to Application DB:', upsertError);
      return false;
    }
    
    console.log('✅ Successfully wrote to Application DB');
    console.log(`📊 Table: ${tableAssignments[0]?.table_name}`);
    console.log(`👥 Attendees: ${tableAssignments[0]?.attendees?.length || 0}`);
    
    if (tableAssignments[0]?.attendees?.length > 0) {
      console.log('\n📋 Sample Attendees:');
      tableAssignments[0].attendees.slice(0, 3).forEach((attendee, index) => {
        console.log(`  ${index + 1}. ${attendee.first_name} ${attendee.last_name} (${attendee.company_name_standardized})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in single table test:', error.message);
    return false;
  }
};

// Main test function
const runTest = async () => {
  console.log('🚀 Starting Direct API Test');
  console.log(`Main DB: ${MAIN_DB_URL}`);
  console.log(`App DB: ${APP_DB_URL}`);
  
  const result = await testSingleTable();
  
  if (result) {
    console.log('\n🎉 Test completed successfully!');
    console.log('✅ Table 1 data has been populated in your Application DB');
    console.log('📋 Check your Supabase table_assignments_cache table to see the data');
  } else {
    console.log('\n❌ Test failed. Check the output above for details.');
  }
};

// Run test
runTest().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
