#!/usr/bin/env node

/**
 * Test script to query seat assignments directly from the main database
 * This bypasses the API and directly queries the main DB to see what data exists
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MAIN_DB_URL = process.env.VITE_SUPABASE_URL;
const MAIN_DB_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!MAIN_DB_URL || !MAIN_DB_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!MAIN_DB_URL);
  console.error('   VITE_SUPABASE_ANON_KEY:', !!MAIN_DB_ANON_KEY);
  process.exit(1);
}

async function testSeatAssignmentsQuery() {
  console.log('🚀 Testing Seat Assignments Query');
  console.log('Main DB URL:', MAIN_DB_URL);
  
  try {
    // Connect to main database (READ-ONLY)
    const supabase = createClient(MAIN_DB_URL, MAIN_DB_ANON_KEY);
    
    console.log('\n📊 1. Getting overview of all tables...');
    const { data: tableOverview, error: overviewError } = await supabase
      .from('seat_assignments')
      .select('table_name')
      .not('table_name', 'is', null);
    
    if (overviewError) {
      console.error('❌ Error getting table overview:', overviewError);
      return;
    }
    
    // Count attendees per table
    const tableCounts = {};
    tableOverview.forEach(row => {
      const tableName = row.table_name;
      tableCounts[tableName] = (tableCounts[tableName] || 0) + 1;
    });
    
    console.log('📋 Tables with assignments:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} attendees`);
    });
    
    console.log('\n📊 2. Getting detailed data for Table 1...');
    const { data: table1Data, error: table1Error } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('table_name', 'Table 1')
      .order('seat_number');
    
    if (table1Error) {
      console.error('❌ Error getting Table 1 data:', table1Error);
      return;
    }
    
    if (!table1Data || table1Data.length === 0) {
      console.log('⚠️  No data found for Table 1');
      console.log('Available tables:', Object.keys(tableCounts));
      return;
    }
    
    console.log(`✅ Found ${table1Data.length} attendees at Table 1:`);
    table1Data.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.attendee_first_name} ${assignment.attendee_last_name} (Seat ${assignment.seat_number})`);
      console.log(`      - Attendee ID: ${assignment.attendee_id}`);
      console.log(`      - Assignment Type: ${assignment.assignment_type}`);
      console.log(`      - Assigned At: ${assignment.assigned_at}`);
      if (assignment.notes) {
        console.log(`      - Notes: ${assignment.notes}`);
      }
    });
    
    console.log('\n📊 3. Testing with first available table...');
    const firstTable = Object.keys(tableCounts)[0];
    if (firstTable) {
      console.log(`Testing with: ${firstTable}`);
      
      const { data: firstTableData, error: firstTableError } = await supabase
        .from('seat_assignments')
        .select('*')
        .eq('table_name', firstTable)
        .order('seat_number');
      
      if (firstTableError) {
        console.error('❌ Error getting first table data:', firstTableError);
        return;
      }
      
      console.log(`✅ Found ${firstTableData.length} attendees at ${firstTable}:`);
      firstTableData.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.attendee_first_name} ${assignment.attendee_last_name} (Seat ${assignment.seat_number})`);
      });
    }
    
    console.log('\n✅ Seat assignments query test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSeatAssignmentsQuery();
