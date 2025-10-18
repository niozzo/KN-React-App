#!/usr/bin/env node

/**
 * Quick Dining Seat Assignments Check
 * 
 * Simple script to check if dining seat assignments exist in the database
 * and compare with cache data.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the same configuration as the main app
const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Maple & Ash dining configuration ID (from cache analysis)
const MAPLE_ASH_CONFIG_ID = '6b6b5e7e-7e12-4bff-86df-4656cbd85d16';

console.log('🍽️ Quick Dining Seat Assignments Check');
console.log('=====================================\n');

async function checkDiningAssignments() {
    try {
        console.log('1. Checking for Maple & Ash dining seat assignments...');
        
        // Query seat assignments for the Maple & Ash dining configuration
        const { data: diningAssignments, error } = await supabase
            .from('seat_assignments')
            .select('*')
            .eq('seating_configuration_id', MAPLE_ASH_CONFIG_ID);
        
        if (error) {
            console.log(`❌ Database query failed: ${error.message}`);
            return;
        }
        
        console.log(`📊 Found ${diningAssignments ? diningAssignments.length : 0} dining seat assignments in database`);
        
        if (diningAssignments && diningAssignments.length > 0) {
            console.log('\n📋 Dining Assignments:');
            diningAssignments.forEach((assignment, index) => {
                console.log(`  ${index + 1}. ${assignment.attendee_first_name} ${assignment.attendee_last_name}`);
                console.log(`     Table: ${assignment.table_name || 'N/A'}`);
                console.log(`     Seat: ${assignment.seat_number || 'N/A'}`);
                console.log(`     Row: ${assignment.row_number || 'N/A'}, Column: ${assignment.column_number || 'N/A'}`);
                console.log(`     Assignment Type: ${assignment.assignment_type}`);
                console.log(`     Assigned At: ${assignment.assigned_at}`);
                console.log('');
            });
        } else {
            console.log('📭 No dining seat assignments found in database');
        }
        
        // Check cache data
        console.log('\n2. Checking cache data...');
        const cachePath = path.join(process.cwd(), 'docs', 'localCacheCopy', 'kn_cache_seat_assignments.json');
        
        if (!fs.existsSync(cachePath)) {
            console.log('❌ Cache file not found');
            return;
        }
        
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        const cacheAssignments = cacheData.data || cacheData;
        const cacheDiningAssignments = cacheAssignments.filter(a => a.seating_configuration_id === MAPLE_ASH_CONFIG_ID);
        
        console.log(`📊 Cache contains ${cacheDiningAssignments.length} dining seat assignments`);
        
        // Compare results
        console.log('\n3. Comparison Results:');
        console.log('======================');
        
        if (diningAssignments && diningAssignments.length > 0 && cacheDiningAssignments.length === 0) {
            console.log('🚨 ISSUE CONFIRMED: Dining assignments exist in database but NOT in cache!');
            console.log('   This indicates a filtering issue during the sync process.');
        } else if (diningAssignments && diningAssignments.length === 0) {
            console.log('📭 No dining assignments found in database - none have been created yet.');
        } else if (diningAssignments && diningAssignments.length === cacheDiningAssignments.length) {
            console.log('✅ Database and cache match - no filtering issue.');
        } else {
            console.log('⚠️ Partial mismatch between database and cache.');
        }
        
        // Show total seat assignments for context
        console.log('\n4. Total Seat Assignments Context:');
        console.log(`📊 Database total: ${diningAssignments ? 'N/A (limited query)' : 'N/A'}`);
        console.log(`📊 Cache total: ${cacheAssignments.length}`);
        
        if (cacheAssignments.length > 0) {
            console.log('\n📋 Sample cache assignments:');
            cacheAssignments.slice(0, 3).forEach((assignment, index) => {
                console.log(`  ${index + 1}. ${assignment.attendee_first_name} ${assignment.attendee_last_name}`);
                console.log(`     Config: ${assignment.seating_configuration_id}`);
                console.log(`     Table: ${assignment.table_name || 'N/A'}`);
            });
        }
        
    } catch (err) {
        console.error('❌ Script error:', err.message);
    }
}

// Run the check
checkDiningAssignments();
