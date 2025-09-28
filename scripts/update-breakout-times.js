#!/usr/bin/env node

/**
 * Script to update Track B and CEO track start times to 9:00 AM
 * Usage: node scripts/update-breakout-times.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBreakoutTimes() {
  try {
    console.log('🔄 Updating breakout session start times...');
    
    // Update Track B session
    const trackBResult = await supabase
      .from('agenda_items')
      .update({ 
        start_time: '09:00:00',
        updated_at: new Date().toISOString()
      })
      .eq('title', 'Track B: Driving Operational Performance In the Age of AI');
    
    if (trackBResult.error) {
      console.error('❌ Error updating Track B:', trackBResult.error);
    } else {
      console.log('✅ Track B start time updated to 09:00:00');
    }
    
    // Update CEO Summit session
    const ceoResult = await supabase
      .from('agenda_items')
      .update({ 
        start_time: '09:00:00',
        updated_at: new Date().toISOString()
      })
      .eq('title', 'Apax Software CEO Summit - by invitation only');
    
    if (ceoResult.error) {
      console.error('❌ Error updating CEO Summit:', ceoResult.error);
    } else {
      console.log('✅ CEO Summit start time updated to 09:00:00');
    }
    
    console.log('🎉 Breakout session times updated successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the update
updateBreakoutTimes();
