#!/usr/bin/env node

/**
 * Test script for table assignments API endpoints
 * Tests both single table and full population endpoints
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const SINGLE_ENDPOINT = '/api/sync-table-assignments-single';
const FULL_ENDPOINT = '/api/sync-table-assignments-full';

// Helper function to make HTTP requests
const makeRequest = (url, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

// Test single table endpoint
const testSingleTable = async () => {
  console.log('\n🧪 Testing Single Table Endpoint...');
  console.log(`URL: ${BASE_URL}${SINGLE_ENDPOINT}`);
  
  try {
    const response = await makeRequest(`${BASE_URL}${SINGLE_ENDPOINT}`);
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Single table endpoint working');
      console.log(`Table: ${response.data.table}`);
      console.log(`Attendees: ${response.data.attendees}`);
      console.log(`Message: ${response.data.message}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📊 Sample Data:');
        console.log(JSON.stringify(response.data.data[0], null, 2));
      }
    } else {
      console.log('❌ Single table endpoint failed');
      console.log('Error:', response.data);
    }
    
    return response.status === 200;
  } catch (error) {
    console.log('❌ Single table endpoint error:', error.message);
    return false;
  }
};

// Test full population endpoint
const testFullPopulation = async () => {
  console.log('\n🧪 Testing Full Population Endpoint...');
  console.log(`URL: ${BASE_URL}${FULL_ENDPOINT}`);
  
  try {
    const response = await makeRequest(`${BASE_URL}${FULL_ENDPOINT}`);
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Full population endpoint working');
      console.log(`Tables Processed: ${response.data.tables_processed}`);
      console.log(`Total Attendees: ${response.data.total_attendees}`);
      console.log(`Message: ${response.data.message}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📊 Sample Tables:');
        response.data.data.slice(0, 3).forEach((table, index) => {
          console.log(`\nTable ${index + 1}: ${table.table_name}`);
          console.log(`Attendees: ${table.attendees.length}`);
          if (table.attendees.length > 0) {
            console.log(`Sample attendee: ${table.attendees[0].first_name} ${table.attendees[0].last_name}`);
          }
        });
      }
    } else {
      console.log('❌ Full population endpoint failed');
      console.log('Error:', response.data);
    }
    
    return response.status === 200;
  } catch (error) {
    console.log('❌ Full population endpoint error:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Table Assignments API Tests');
  console.log(`Base URL: ${BASE_URL}`);
  
  const singleResult = await testSingleTable();
  const fullResult = await testFullPopulation();
  
  console.log('\n📋 Test Results Summary:');
  console.log(`Single Table Endpoint: ${singleResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Full Population Endpoint: ${fullResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (singleResult && fullResult) {
    console.log('\n🎉 All tests passed! API endpoints are working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
};

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
