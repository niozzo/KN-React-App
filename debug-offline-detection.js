/**
 * Debug Script for Enhanced Offline Detection
 * Run this in the browser console to test offline detection
 */

console.log('🔍 Enhanced Offline Detection Debug Script');
console.log('=====================================');

// Check platform detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSimulator = navigator.userAgent.includes('Simulator');
const isChrome = /Chrome/.test(navigator.userAgent);

console.log('📱 Platform Detection:');
console.log(`  iOS: ${isIOS}`);
console.log(`  Simulator: ${isSimulator}`);
console.log(`  Chrome: ${isChrome}`);
console.log(`  User Agent: ${navigator.userAgent}`);

// Check online status
console.log('🌐 Network Status:');
console.log(`  navigator.onLine: ${navigator.onLine}`);
console.log(`  Connection API: ${navigator.connection ? 'Available' : 'Not Available'}`);

if (navigator.connection) {
  console.log(`  Effective Type: ${navigator.connection.effectiveType}`);
  console.log(`  Downlink: ${navigator.connection.downlink}`);
  console.log(`  RTT: ${navigator.connection.rtt}`);
}

// Test offline detection logic
console.log('🧪 Offline Detection Logic:');
const basicOnline = navigator.onLine;
const hasGoodConnection = navigator.connection && 
  navigator.connection.effectiveType !== 'offline' &&
  navigator.connection.effectiveType !== 'slow-2g';

console.log(`  Basic Online: ${basicOnline}`);
console.log(`  Good Connection: ${hasGoodConnection}`);

// iOS Simulator specific logic
if (isIOS && isSimulator) {
  const conservativeResult = basicOnline && hasGoodConnection !== false;
  console.log(`  iOS Simulator Conservative: ${conservativeResult}`);
  console.log('🍎 Using conservative offline detection for iOS Simulator');
} else {
  const standardResult = basicOnline && (hasGoodConnection !== false);
  console.log(`  Standard Detection: ${standardResult}`);
}

// Test event listeners
console.log('🎧 Event Listeners:');
console.log('  Online/Offline events should be logged when network changes');

// Monitor connection changes
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    console.log('📶 Connection changed:', {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    });
  });
}

console.log('✅ Debug script loaded. Check for offline indicator behavior!');
console.log('💡 Toggle network in simulator to test offline detection');
