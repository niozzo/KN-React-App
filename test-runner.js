#!/usr/bin/env node

/**
 * Aggressive Test Runner with Hanging Prevention
 * This script runs tests in smaller batches to prevent hanging
 */

import { spawn } from 'child_process';
import path from 'path';

// Test batches to run separately
const testBatches = [
  // Core functionality tests (fastest)
  'src/__tests__/utils/**/*.test.*',
  'src/__tests__/transformers/**/*.test.*',
  'src/__tests__/services/timeService.*.test.*',
  
  // Component tests (medium)
  'src/__tests__/components/SimpleComponent.test.*',
  'src/__tests__/components/Header.test.*',
  'src/__tests__/components/OfflineIndicator.test.*',
  'src/__tests__/components/InstallPrompt.test.*',
  
  // Hook tests (medium)
  'src/__tests__/hooks/useAdminBroadcasts.test.*',
  'src/__tests__/hooks/useCountdown.test.*',
  
  // Service tests (medium)
  'src/__tests__/services/authService.test.*',
  'src/__tests__/services/dataService.test.*',
  'src/__tests__/services/pwaService.test.*',
  
  // Integration tests (slower - run last)
  'src/__tests__/integration/App.simple.test.*',
  'src/__tests__/integration/signOutFlow.simple.test.*',
  
  // Complex tests (slowest - run separately)
  'src/__tests__/components/LoginPage.enhanced.test.*',
  'src/__tests__/components/LoginPage.integration.test.*',
  'src/__tests__/e2e/**/*.test.*'
];

async function runTestBatch(batchPattern, batchIndex) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running Test Batch ${batchIndex + 1}: ${batchPattern}`);
    
    const testProcess = spawn('npm', ['test', '--', '--run', '--reporter=verbose', batchPattern], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });
    
    // Set a timeout for each batch
    const timeout = setTimeout(() => {
      console.log(`⏰ Batch ${batchIndex + 1} timed out after 60 seconds`);
      testProcess.kill('SIGTERM');
      resolve({ success: false, timeout: true });
    }, 60000);
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log(`✅ Batch ${batchIndex + 1} completed successfully`);
        resolve({ success: true, code });
      } else {
        console.log(`❌ Batch ${batchIndex + 1} failed with code ${code}`);
        resolve({ success: false, code });
      }
    });
    
    testProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`💥 Batch ${batchIndex + 1} errored:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Aggressive Test Runner');
  console.log(`📊 Running ${testBatches.length} test batches`);
  
  const results = [];
  
  for (let i = 0; i < testBatches.length; i++) {
    try {
      const result = await runTestBatch(testBatches[i], i);
      results.push({ batch: testBatches[i], ...result });
      
      // If a batch times out, continue with next batch
      if (result.timeout) {
        console.log(`⏭️  Skipping to next batch due to timeout`);
        continue;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`💥 Batch ${i + 1} crashed:`, error.message);
      results.push({ batch: testBatches[i], success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📋 Test Results Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const timedOut = results.filter(r => r.timeout).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏰ Timed Out: ${timedOut}`);
  
  if (failed > 0 || timedOut > 0) {
    console.log('\n🔍 Failed/Timed Out Batches:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.batch}: ${r.timeout ? 'TIMEOUT' : `CODE ${r.code || 'ERROR'}`}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test runner interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test runner terminated');
  process.exit(1);
});

runAllTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});
