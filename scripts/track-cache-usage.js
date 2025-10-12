/**
 * Cache Usage Tracking Script
 * 
 * This script instruments localStorage.getItem to track which cache keys are accessed
 * after login and during typical user journeys.
 * 
 * Usage: Include this script at the top of your app to start tracking
 */

(function() {
  // Store original localStorage methods
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  
  // Track cache access
  const cacheAccess = {
    reads: {},
    writes: {},
    firstAccessTime: {},
    sessionStart: Date.now()
  };
  
  // Override getItem to track reads
  Storage.prototype.getItem = function(key) {
    const value = originalGetItem.call(this, key);
    
    // Only track our cache keys
    if (key.startsWith('kn_cache_') || key.startsWith('kn_cached_')) {
      const timeSinceStart = Date.now() - cacheAccess.sessionStart;
      
      if (!cacheAccess.reads[key]) {
        cacheAccess.reads[key] = 0;
        cacheAccess.firstAccessTime[key] = timeSinceStart;
        console.log(`📊 [CACHE TRACKER] First read: ${key} at ${timeSinceStart}ms`);
      }
      
      cacheAccess.reads[key]++;
    }
    
    return value;
  };
  
  // Override setItem to track writes
  Storage.prototype.setItem = function(key, value) {
    if (key.startsWith('kn_cache_') || key.startsWith('kn_cached_')) {
      const timeSinceStart = Date.now() - cacheAccess.sessionStart;
      
      if (!cacheAccess.writes[key]) {
        cacheAccess.writes[key] = 0;
        console.log(`💾 [CACHE TRACKER] First write: ${key} at ${timeSinceStart}ms`);
      }
      
      cacheAccess.writes[key]++;
    }
    
    return originalSetItem.call(this, key, value);
  };
  
  // Expose tracking data globally
  window.__cacheTracker = {
    getReport: function() {
      const report = {
        sessionDuration: Date.now() - cacheAccess.sessionStart,
        tables: {}
      };
      
      // Analyze each tracked key
      const allKeys = new Set([
        ...Object.keys(cacheAccess.reads),
        ...Object.keys(cacheAccess.writes)
      ]);
      
      allKeys.forEach(key => {
        const tableName = key.replace('kn_cache_', '').replace('kn_cached_', '');
        const reads = cacheAccess.reads[key] || 0;
        const writes = cacheAccess.writes[key] || 0;
        const firstAccess = cacheAccess.firstAccessTime[key];
        
        report.tables[tableName] = {
          cacheKey: key,
          reads,
          writes,
          firstAccessTimeMs: firstAccess,
          isUnused: reads === 0 && writes > 0,
          isReadAfterLogin: firstAccess && firstAccess < 5000 // Read within 5 seconds
        };
      });
      
      return report;
    },
    
    printReport: function() {
      const report = this.getReport();
      
      console.log('\n========================================');
      console.log('📊 CACHE USAGE REPORT');
      console.log('========================================');
      console.log(`Session Duration: ${(report.sessionDuration / 1000).toFixed(2)}s`);
      console.log('\nTables Analysis:');
      console.log('----------------------------------------\n');
      
      // Group by usage status
      const unused = [];
      const lazyLoaded = [];
      const immediate = [];
      
      Object.entries(report.tables).forEach(([name, data]) => {
        if (data.isUnused) {
          unused.push({ name, data });
        } else if (data.isReadAfterLogin) {
          immediate.push({ name, data });
        } else {
          lazyLoaded.push({ name, data });
        }
      });
      
      if (unused.length > 0) {
        console.log('🔴 UNUSED TABLES (written but never read):');
        unused.forEach(({ name, data }) => {
          console.log(`  - ${name}: ${data.writes} writes, 0 reads`);
          console.log(`    → Recommendation: Remove from initial sync`);
        });
        console.log('');
      }
      
      if (lazyLoaded.length > 0) {
        console.log('🟡 LAZY-LOADED TABLES (read later):');
        lazyLoaded.forEach(({ name, data }) => {
          console.log(`  - ${name}: First read at ${(data.firstAccessTimeMs / 1000).toFixed(2)}s`);
          console.log(`    ${data.reads} reads total`);
          console.log(`    → Recommendation: Consider on-demand loading`);
        });
        console.log('');
      }
      
      if (immediate.length > 0) {
        console.log('🟢 IMMEDIATELY USED TABLES (read within 5s):');
        immediate.forEach(({ name, data }) => {
          console.log(`  - ${name}: First read at ${(data.firstAccessTimeMs / 1000).toFixed(2)}s`);
          console.log(`    ${data.reads} reads total`);
        });
        console.log('');
      }
      
      console.log('========================================\n');
      
      // Summary
      const totalTables = Object.keys(report.tables).length;
      console.log('SUMMARY:');
      console.log(`  Total tables: ${totalTables}`);
      console.log(`  Unused: ${unused.length} (${((unused.length / totalTables) * 100).toFixed(0)}%)`);
      console.log(`  Lazy-loaded: ${lazyLoaded.length} (${((lazyLoaded.length / totalTables) * 100).toFixed(0)}%)`);
      console.log(`  Immediate: ${immediate.length} (${((immediate.length / totalTables) * 100).toFixed(0)}%)`);
      console.log('');
      
      return report;
    },
    
    reset: function() {
      cacheAccess.reads = {};
      cacheAccess.writes = {};
      cacheAccess.firstAccessTime = {};
      cacheAccess.sessionStart = Date.now();
      console.log('🔄 Cache tracker reset');
    }
  };
  
  console.log('✅ Cache usage tracker initialized');
  console.log('📊 Run window.__cacheTracker.printReport() to see usage report');
})();

