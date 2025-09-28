#!/usr/bin/env node

/**
 * Simple script to update Track B and CEO track start times to 9:00 AM
 * This script uses the existing application database service
 */

import { applicationDatabaseService } from '../src/services/applicationDatabaseService.js';

async function updateBreakoutTimes() {
  try {
    console.log('🔄 Updating breakout session start times...');
    
    // Update Track B session metadata
    const trackBUpdate = {
      id: 'track-b-id', // We'll need to get the actual ID
      title: 'Track B: Driving Operational Performance In the Age of AI',
      start_time: '09:00:00',
      end_time: '12:00:00', // Keep existing end time or adjust as needed
      last_synced: new Date().toISOString()
    };
    
    await applicationDatabaseService.syncAgendaItemMetadata(trackBUpdate);
    console.log('✅ Track B start time updated to 09:00:00');
    
    // Update CEO Summit session metadata
    const ceoUpdate = {
      id: 'ceo-summit-id', // We'll need to get the actual ID
      title: 'Apax Software CEO Summit - by invitation only',
      start_time: '09:00:00',
      end_time: '12:00:00', // Keep existing end time or adjust as needed
      last_synced: new Date().toISOString()
    };
    
    await applicationDatabaseService.syncAgendaItemMetadata(ceoUpdate);
    console.log('✅ CEO Summit start time updated to 09:00:00');
    
    console.log('🎉 Breakout session times updated successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the update
updateBreakoutTimes();
