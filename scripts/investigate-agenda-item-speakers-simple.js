#!/usr/bin/env node

/**
 * Simple investigation of agenda_item_speakers table
 * Uses fetch API to query Supabase directly
 */

// Load environment variables from .env file
import { readFileSync } from 'fs';
import { join } from 'path';

// Simple .env parser
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Make sure your .env file contains these variables');
  process.exit(1);
}

async function investigateAgendaItemSpeakers() {
  console.log('🔍 Investigating agenda_item_speakers table...\n');
  console.log(`📡 Using Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using anon key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

  try {
    // 1. Check if table exists and get sample data
    console.log('1️⃣ Checking table existence and getting sample data...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agenda_item_speakers?select=*&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Error accessing agenda_item_speakers table');
      console.error(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.error('Table does not exist or is not accessible');
      } else if (response.status === 401) {
        console.error('Authentication failed - check your anon key');
      } else if (response.status === 403) {
        console.error('Access forbidden - RLS policies may be blocking access');
      }
      
      const errorText = await response.text();
      console.error('Response:', errorText);
      return;
    }

    const sampleData = await response.json();
    console.log('✅ Table exists and is accessible');
    console.log(`📊 Found ${sampleData.length} sample records`);

    // 2. Display sample data
    console.log('\n2️⃣ Sample data structure:');
    if (sampleData.length > 0) {
      console.log(JSON.stringify(sampleData, null, 2));
      
      // Analyze columns
      const columns = Object.keys(sampleData[0]);
      console.log('\n📋 Columns found:');
      columns.forEach(column => {
        const sampleValue = sampleData[0][column];
        const valueType = typeof sampleValue;
        console.log(`  - ${column}: ${valueType} (sample: ${JSON.stringify(sampleValue)})`);
      });
    } else {
      console.log('⚠️  No sample data found - table may be empty');
    }

    // 3. Get total count
    console.log('\n3️⃣ Getting total record count...');
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/agenda_item_speakers?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (countResponse.ok) {
      const countHeader = countResponse.headers.get('content-range');
      if (countHeader) {
        const totalCount = countHeader.split('/')[1];
        console.log(`📈 Total records: ${totalCount}`);
      }
    }

    // 4. Check for key fields we need
    console.log('\n4️⃣ Checking for key speaker management fields:');
    if (sampleData.length > 0) {
      const keyFields = {
        'agenda_item_id': 'Links to agenda items',
        'attendee_id': 'Links to attendees', 
        'speaker_name': 'Speaker display name',
        'role': 'Speaker role (presenter, co-presenter, etc.)',
        'display_order': 'For speaker ordering',
        'is_primary': 'Primary speaker indicator',
        'bio': 'Speaker biography',
        'photo': 'Speaker photo URL',
        'status': 'Speaker status (confirmed, tentative, etc.)'
      };

      Object.entries(keyFields).forEach(([field, description]) => {
        const hasField = sampleData[0] && field in sampleData[0];
        console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${description}`);
      });

      // 5. Final assessment
      console.log('\n5️⃣ Assessment:');
      const hasEssentialFields = sampleData[0] && 
        'agenda_item_id' in sampleData[0] && 
        'attendee_id' in sampleData[0];
      const hasSpeakerInfo = sampleData[0] && 
        ('speaker_name' in sampleData[0] || 'role' in sampleData[0]);
      const hasOrdering = sampleData[0] && 'display_order' in sampleData[0];

      if (hasEssentialFields) {
        console.log('✅ Has essential fields (agenda_item_id, attendee_id)');
      } else {
        console.log('❌ Missing essential fields');
      }

      if (hasSpeakerInfo) {
        console.log('✅ Has speaker information fields');
      } else {
        console.log('⚠️  Limited speaker information');
      }

      if (hasOrdering) {
        console.log('✅ Has speaker ordering capability');
      } else {
        console.log('⚠️  No speaker ordering field found');
      }

      // Final recommendation
      console.log('\n🎯 Recommendation:');
      if (hasEssentialFields && hasSpeakerInfo) {
        console.log('✅ This table appears suitable for speaker management');
        if (!hasOrdering) {
          console.log('⚠️  Consider adding display_order field for speaker ordering');
        }
      } else {
        console.log('❌ This table may not be suitable for speaker management');
        console.log('   Missing essential fields for speaker assignments');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the investigation
investigateAgendaItemSpeakers()
  .then(() => {
    console.log('\n✅ Investigation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });
