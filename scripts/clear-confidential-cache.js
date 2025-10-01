#!/usr/bin/env node

/**
 * Clear Confidential Data from Cache
 * 
 * This script removes all cached attendee data that may contain confidential information
 * and forces a fresh sync with the new filtering in place.
 */

console.log('🧹 Starting confidential data cache cleanup...');

// List of cache keys that may contain confidential attendee data
const confidentialCacheKeys = [
  'kn_cache_attendees',
  'kn_cache_attendee', 
  'conference_auth',
  'attendees', // Legacy key
  'kn_sync_status',
  'kn_cache_version'
];

// Clear each cache key
confidentialCacheKeys.forEach(key => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      console.log(`✅ Cleared cache key: ${key}`);
    } else {
      console.log(`⚠️ localStorage not available, skipping: ${key}`);
    }
  } catch (error) {
    console.error(`❌ Failed to clear ${key}:`, error.message);
  }
});

// Clear all cache keys that start with kn_cache_ (comprehensive cleanup)
if (typeof localStorage !== 'undefined') {
  const allKeys = Object.keys(localStorage);
  const knCacheKeys = allKeys.filter(key => key.startsWith('kn_cache_'));
  
  knCacheKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Cleared kn_cache key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to clear ${key}:`, error.message);
    }
  });
}

console.log('🔒 Confidential data cache cleanup completed');
console.log('📝 Next login will populate cache with filtered data only');
