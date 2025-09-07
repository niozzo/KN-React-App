// Simple Node.js script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    try {
        // Test basic connection by making a simple query
        // Let's try some common table names that might exist
        const commonTables = ['users', 'profiles', 'posts', 'products', 'orders', 'customers', 'items'];
        
        console.log('🔍 Testing connection with common table names...');
        
        let foundTables = [];
        
        for (const tableName of commonTables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (!error) {
                    foundTables.push(tableName);
                    console.log(`✅ Found table: ${tableName}`);
                }
            } catch (err) {
                // Table doesn't exist or no access, continue
            }
        }
        
        if (foundTables.length > 0) {
            console.log(`\n✅ Connection successful!`);
            console.log(`📊 Found ${foundTables.length} accessible tables:`);
            foundTables.forEach((table, index) => {
                console.log(`  ${index + 1}. ${table}`);
            });
            
            // Test reading from first found table
            const firstTable = foundTables[0];
            console.log(`\n🔍 Testing data read from '${firstTable}'...`);
            
            const { data: sampleData, error: sampleError } = await supabase
                .from(firstTable)
                .select('*')
                .limit(3);
            
            if (sampleError) {
                console.log(`⚠️  Could not read data from ${firstTable}:`, sampleError.message);
            } else {
                console.log(`✅ Successfully read ${sampleData.length} rows from ${firstTable}`);
                if (sampleData.length > 0) {
                    console.log('📋 Sample row:', JSON.stringify(sampleData[0], null, 2));
                }
            }
        } else {
            console.log('⚠️  Connection successful but no common tables found.');
            console.log('💡 You may need to create tables in your Supabase dashboard first.');
            console.log('💡 Or the tables might have different names than expected.');
        }
        
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

// Run the test
testConnection();
