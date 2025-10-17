#!/usr/bin/env node

/**
 * Migration Script: Move Dining Options to Agenda Items
 * 
 * This script migrates dining options from the dining_options table 
 * to the agenda_items table as proper sessions with session_type: 'meal'
 * 
 * This fixes the root cause: dining options should be stored as agenda items,
 * not as separate dining_options records.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateDiningToAgenda() {
  try {
    console.log('🔄 Starting migration: Dining Options → Agenda Items');
    
    // Step 1: Get all dining options
    console.log('📋 Step 1: Fetching dining options...');
    const { data: diningOptions, error: diningError } = await supabase
      .from('dining_options')
      .select('*');
    
    if (diningError) {
      throw new Error(`Failed to fetch dining options: ${diningError.message}`);
    }
    
    console.log(`✅ Found ${diningOptions.length} dining options`);
    
    // Step 2: Convert dining options to agenda items
    console.log('🔄 Step 2: Converting dining options to agenda items...');
    const agendaItems = diningOptions.map(dining => ({
      title: dining.name,
      description: dining.location || '',
      date: dining.date,
      start_time: dining.time,
      end_time: dining.time, // Dining events typically don't have end times
      location: dining.location || '',
      session_type: 'meal',
      speaker: null,
      capacity: dining.capacity || 0,
      registered_count: 0,
      attendee_selection: 'everyone',
      selected_attendees: [],
      is_active: dining.is_active !== false,
      has_seating: dining.has_table_assignments || false,
      seating_notes: dining.seating_notes || '',
      seating_type: dining.seating_type || 'open',
      created_at: dining.created_at,
      updated_at: dining.updated_at
    }));
    
    console.log(`✅ Converted ${agendaItems.length} dining options to agenda items`);
    
    // Step 3: Insert into agenda_items table
    console.log('🔄 Step 3: Inserting agenda items...');
    const { data: insertedItems, error: insertError } = await supabase
      .from('agenda_items')
      .insert(agendaItems)
      .select();
    
    if (insertError) {
      throw new Error(`Failed to insert agenda items: ${insertError.message}`);
    }
    
    console.log(`✅ Successfully inserted ${insertedItems.length} agenda items`);
    
    // Step 4: Verify migration
    console.log('🔄 Step 4: Verifying migration...');
    const { data: mealSessions, error: verifyError } = await supabase
      .from('agenda_items')
      .select('*')
      .eq('session_type', 'meal');
    
    if (verifyError) {
      throw new Error(`Failed to verify migration: ${verifyError.message}`);
    }
    
    console.log(`✅ Verification complete: ${mealSessions.length} meal sessions found`);
    
    // Step 5: Optional - Clean up dining_options table (commented out for safety)
    // console.log('🔄 Step 5: Cleaning up dining_options table...');
    // const { error: deleteError } = await supabase
    //   .from('dining_options')
    //   .delete()
    //   .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    // if (deleteError) {
    //   console.warn(`⚠️ Failed to clean up dining_options table: ${deleteError.message}`);
    // } else {
    //   console.log('✅ Cleaned up dining_options table');
    // }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Test the application to verify dining options appear as sessions');
    console.log('   2. If everything works, uncomment the cleanup step in this script');
    console.log('   3. Run the script again to clean up the dining_options table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateDiningToAgenda();
