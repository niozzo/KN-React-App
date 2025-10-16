#!/usr/bin/env node

/**
 * Investigate agenda_item_speakers with attendee details
 * Cross-reference with attendees table to get speaker names and details
 */

// Import the database configuration
import { dbConfig } from '../config/database.js';

const SUPABASE_URL = dbConfig.supabase.url;
const SUPABASE_ANON_KEY = dbConfig.supabase.anonKey;

console.log('🔍 Investigating agenda_item_speakers with attendee details...\n');
console.log(`📡 Using Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Using anon key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

async function investigateSpeakerAttendeeJoin() {
  try {
    // 1. Get speakers with attendee details using a join
    console.log('1️⃣ Getting speakers with attendee details...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/agenda_item_speakers?select=*,attendees(*)&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Error accessing agenda_item_speakers with attendees');
      console.error(`Status: ${response.status} ${response.statusText}`);
      
      const errorText = await response.text();
      console.error('Response:', errorText);
      return;
    }

    const speakerData = await response.json();
    console.log('✅ Successfully joined agenda_item_speakers with attendees');
    console.log(`📊 Found ${speakerData.length} speaker records with attendee details`);

    // 2. Display the joined data
    console.log('\n2️⃣ Speaker data with attendee details:');
    if (speakerData.length > 0) {
      console.log(JSON.stringify(speakerData, null, 2));
      
      // Analyze what attendee data we get
      const firstSpeaker = speakerData[0];
      if (firstSpeaker.attendees) {
        console.log('\n📋 Attendee data available:');
        const attendeeFields = Object.keys(firstSpeaker.attendees);
        attendeeFields.forEach(field => {
          const value = firstSpeaker.attendees[field];
          const valueType = typeof value;
          console.log(`  - ${field}: ${valueType} (sample: ${JSON.stringify(value)})`);
        });
      }
    }

    // 3. Check if we can get speaker names
    console.log('\n3️⃣ Checking for speaker name fields:');
    if (speakerData.length > 0 && speakerData[0].attendees) {
      const attendee = speakerData[0].attendees;
      const nameFields = {
        'first_name': 'First name',
        'last_name': 'Last name', 
        'name': 'Full name',
        'title': 'Job title',
        'company': 'Company',
        'bio': 'Biography',
        'photo': 'Photo URL',
        'email': 'Email address'
      };

      Object.entries(nameFields).forEach(([field, description]) => {
        const hasField = field in attendee;
        const value = attendee[field];
        console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${description} ${hasField ? `(${value})` : ''}`);
      });
    }

    // 4. Test a specific agenda item to see all speakers
    console.log('\n4️⃣ Testing specific agenda item speakers...');
    const agendaItemId = speakerData[0]?.agenda_item_id;
    if (agendaItemId) {
      const agendaResponse = await fetch(`${SUPABASE_URL}/rest/v1/agenda_item_speakers?select=*,attendees(*)&agenda_item_id=eq.${agendaItemId}&order=speaker_order`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (agendaResponse.ok) {
        const agendaSpeakers = await agendaResponse.json();
        console.log(`\n📋 All speakers for agenda item ${agendaItemId}:`);
        agendaSpeakers.forEach((speaker, index) => {
          const attendee = speaker.attendees;
          const name = attendee ? `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() : 'Unknown';
          const title = attendee?.title || 'No title';
          const company = attendee?.company || 'No company';
          console.log(`  ${index + 1}. ${name} (${title} at ${company})`);
        });
      }
    }

    // 5. Check if we can get agenda item details too
    console.log('\n5️⃣ Testing agenda item details...');
    if (agendaItemId) {
      const agendaResponse = await fetch(`${SUPABASE_URL}/rest/v1/agenda_items?select=*&id=eq.${agendaItemId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (agendaResponse.ok) {
        const agendaItems = await agendaResponse.json();
        if (agendaItems.length > 0) {
          const agendaItem = agendaItems[0];
          console.log(`\n📋 Agenda item details:`);
          console.log(`  Title: ${agendaItem.title}`);
          console.log(`  Date: ${agendaItem.date}`);
          console.log(`  Time: ${agendaItem.start_time} - ${agendaItem.end_time}`);
          console.log(`  Location: ${agendaItem.location}`);
        }
      }
    }

    // 6. Final assessment
    console.log('\n6️⃣ Final Assessment:');
    if (speakerData.length > 0 && speakerData[0].attendees) {
      const attendee = speakerData[0].attendees;
      const hasName = (attendee.first_name || attendee.last_name || attendee.name);
      const hasTitle = attendee.title;
      const hasCompany = attendee.company;
      const hasBio = attendee.bio;
      const hasPhoto = attendee.photo;

      console.log('✅ Can get speaker names from attendees table');
      console.log(`${hasTitle ? '✅' : '❌'} Can get speaker titles`);
      console.log(`${hasCompany ? '✅' : '❌'} Can get speaker companies`);
      console.log(`${hasBio ? '✅' : '❌'} Can get speaker bios`);
      console.log(`${hasPhoto ? '✅' : '❌'} Can get speaker photos`);

      console.log('\n🎯 Recommendation:');
      if (hasName) {
        console.log('✅ This approach will work!');
        console.log('   - Use agenda_item_speakers for ordering');
        console.log('   - Join with attendees for speaker details');
        console.log('   - This gives you everything you need for speaker management');
      } else {
        console.log('❌ Missing essential speaker name fields');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the investigation
investigateSpeakerAttendeeJoin()
  .then(() => {
    console.log('\n✅ Investigation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });
