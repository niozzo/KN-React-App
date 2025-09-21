// Debug script to test syncAllData method
import { serverDataSyncService } from './src/services/serverDataSyncService.js';

async function testSync() {
  try {
    console.log('Testing syncAllData...');
    const result = await serverDataSyncService.syncAllData();
    console.log('Result:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', result ? Object.keys(result) : 'undefined');
  } catch (error) {
    console.error('Error:', error);
  }
}

testSync();
