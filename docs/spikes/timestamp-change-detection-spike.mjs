/**
 * Spike: Validate Timestamp-Based Change Detection
 * 
 * Tests:
 * 1. Can we query attendees with updated_at timestamps?
 * 2. Can we detect when bio changes by comparing timestamps?
 * 3. Can we implement efficient change detection?
 * 
 * Run: node docs/spikes/timestamp-change-detection-spike.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';
const adminEmail = 'ishan.gammampila@apax.com';
const adminPassword = 'xx8kRx#tn@R?';

async function runSpike() {
  console.log('🔬 Starting Timestamp Change Detection Spike...\n');
  
  // Step 1: Create client and authenticate
  console.log('Step 1: Creating Supabase client and authenticating...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  
  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }
  
  console.log('✅ Authenticated as:', authData.user.email);
  console.log('');
  
  // Step 2: Get initial timestamp for attendees table
  console.log('Step 2: Getting initial timestamp for attendees table...');
  const { data: initialData, error: initialError } = await supabase
    .from('attendees')
    .select('id, first_name, last_name, bio, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (initialError) {
    console.error('❌ Initial query failed:', initialError.message);
    process.exit(1);
  }
  
  const initialTimestamp = initialData[0].updated_at;
  console.log('✅ Initial timestamp:', initialTimestamp);
  console.log('   Latest attendee:', initialData[0].first_name, initialData[0].last_name);
  console.log('');
  
  // Step 3: Find Nick Iozzo specifically
  console.log('Step 3: Finding Nick Iozzo...');
  const { data: nickData, error: nickError } = await supabase
    .from('attendees')
    .select('id, first_name, last_name, bio, updated_at')
    .ilike('first_name', 'nick')
    .ilike('last_name', 'iozzo');
  
  if (nickError) {
    console.error('❌ Nick Iozzo query failed:', nickError.message);
    process.exit(1);
  }
  
  if (nickData.length === 0) {
    console.error('❌ Nick Iozzo not found');
    process.exit(1);
  }
  
  const nick = nickData[0];
  console.log('✅ Found Nick Iozzo:');
  console.log('   ID:', nick.id);
  console.log('   Name:', nick.first_name, nick.last_name);
  console.log('   Bio:', nick.bio ? nick.bio.substring(0, 100) + '...' : '(no bio)');
  console.log('   Updated at:', nick.updated_at);
  console.log('');
  
  // Step 4: Monitor for changes
  console.log('Step 4: Monitoring for changes...');
  console.log('📡 Now update Nick Iozzo\'s bio in Supabase dashboard');
  console.log('   The spike will detect the change via timestamp comparison');
  console.log('   Press Ctrl+C to exit\n');
  
  let lastTimestamp = initialTimestamp;
  let checkCount = 0;
  
  const checkForChanges = async () => {
    checkCount++;
    console.log(`🔍 Check #${checkCount} - Looking for changes since: ${lastTimestamp}`);
    
    try {
      // Query for attendees updated since last timestamp
      const { data: changedData, error: changeError } = await supabase
        .from('attendees')
        .select('id, first_name, last_name, bio, updated_at')
        .gte('updated_at', lastTimestamp)
        .neq('updated_at', lastTimestamp); // Exclude the exact same timestamp
      
      if (changeError) {
        console.error('❌ Change detection query failed:', changeError.message);
        return;
      }
      
      if (changedData.length > 0) {
        console.log('\n🎉 CHANGE DETECTED!');
        console.log(`   Found ${changedData.length} updated attendee(s):`);
        
        changedData.forEach(attendee => {
          console.log(`   - ${attendee.first_name} ${attendee.last_name}`);
          console.log(`     Updated at: ${attendee.updated_at}`);
          console.log(`     Bio: ${attendee.bio ? attendee.bio.substring(0, 100) + '...' : '(no bio)'}`);
        });
        
        // Update our last timestamp
        const newTimestamp = changedData[0].updated_at;
        console.log(`   New timestamp: ${newTimestamp}`);
        lastTimestamp = newTimestamp;
        
        console.log('\n✅ Timestamp-based change detection works!');
        console.log('   This approach can be used for efficient cache updates.\n');
      } else {
        console.log('   No changes detected');
      }
      
    } catch (error) {
      console.error('❌ Error during change detection:', error);
    }
  };
  
  // Check every 5 seconds
  const interval = setInterval(checkForChanges, 5000);
  
  // Initial check
  await checkForChanges();
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    clearInterval(interval);
    process.exit(0);
  });
}

runSpike().catch(error => {
  console.error('❌ Spike failed:', error);
  process.exit(1);
});
