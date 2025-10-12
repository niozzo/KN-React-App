# Login Cache Optimization - Performance Testing Guide

**Purpose**: Measure actual performance improvement from Phase 1 optimizations

## Baseline (Before Optimization)

### Expected Metrics (to be measured on `develop` branch)

**Database Queries**:
- Count: 12 queries during login
- Tables: 8 conference + 4 application tables

**Login Time**:
- Measure from "Login button click" to "Home page rendered"
- Expected: 2-4 seconds (network dependent)

**localStorage Usage**:
- Measure total size of `kn_cache_*` keys
- Expected: ~500KB - 2MB depending on data volume

## How to Measure Baseline

### 1. Checkout develop branch
```bash
git checkout develop
npm run dev
```

### 2. Open DevTools Network Tab

**Before logging in**:
1. Open DevTools → Network tab
2. Enable "Preserve log"
3. Clear existing logs

### 3. Measure Login Performance

**Start timer when**:
- Click login button or press Enter

**End timer when**:
- Home page fully rendered
- All initial data loaded

**Record**:
- Total time (ms)
- Number of network requests
- Database query count (check Supabase logs)

### 4. Measure localStorage

**In DevTools Console**:
```javascript
// Count cache keys
const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('kn_cache_'));
console.log('Cache keys:', cacheKeys.length);

// Calculate total size
let totalSize = 0;
cacheKeys.forEach(key => {
  const value = localStorage.getItem(key);
  totalSize += value ? value.length : 0;
});
console.log('Total cache size:', (totalSize / 1024).toFixed(2), 'KB');

// List each cache
cacheKeys.forEach(key => {
  const value = localStorage.getItem(key);
  const size = value ? value.length : 0;
  console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
});
```

### 5. Track Cache Usage

**Add tracking script to index.html**:
```html
<script src="/scripts/track-cache-usage.js"></script>
```

**After login and navigating app**:
```javascript
// In DevTools Console
window.__cacheTracker.printReport()
```

**Record**:
- Which tables are read
- Which tables are never accessed
- Time to first access for each table

## After Optimization (feature/optimize-login-cache)

### Expected Improvements

**Database Queries**:
- Count: 10 queries (-17%)
- Removed: `user_profiles`, `attendee_metadata`

**Login Time**:
- Expected improvement: ~15%
- Estimated: 1.7-3.4 seconds

**localStorage Usage**:
- Reduced by size of 2 removed tables
- Estimated reduction: 50-200KB

### Measurement Process

Repeat all steps from baseline measurement on the feature branch:

```bash
git checkout feature/optimize-login-cache
npm run dev
```

## Performance Test Results Template

```markdown
## Performance Test Results

**Test Date**: [Date]
**Tester**: [Name]
**Network**: [Fast 3G / WiFi / etc]
**Data Volume**: [Number of attendees, events, etc]

### Baseline (develop branch)

**Login Performance**:
- Login time: X.XX seconds
- Network requests: XX
- Database queries: 12

**localStorage**:
- Total cache keys: 12
- Total size: XXX KB
- Unused caches: [list]

**Cache Usage**:
- user_profiles: [used/unused]
- attendee_metadata: [used/unused]

### After Optimization (feature/optimize-login-cache)

**Login Performance**:
- Login time: X.XX seconds (-XX%)
- Network requests: XX
- Database queries: 10 (-17%)

**localStorage**:
- Total cache keys: 10
- Total size: XXX KB (-XX KB)
- Removed caches: user_profiles, attendee_metadata

**Improvements**:
- Time saved: X.XX seconds
- Queries reduced: 2 (17%)
- Storage saved: XX KB

### Observations

- [ ] Login feels faster
- [ ] No errors in console
- [ ] All features working
- [ ] No cache misses for removed tables
- [ ] Offline mode still works

### Recommendation

[ ] Approve for merge
[ ] Needs more testing
[ ] Issues found: [describe]
```

## Automated Performance Testing

### Using Lighthouse

```bash
# Install Lighthouse
npm install -g lighthouse

# Run performance audit
lighthouse http://localhost:5173/login --view
```

**Metrics to track**:
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Speed Index
- Total Blocking Time (TBT)

### Using Chrome DevTools Performance

1. Open DevTools → Performance tab
2. Click Record
3. Perform login
4. Stop recording
5. Analyze timeline

**Look for**:
- Network activity during login
- Database query timing
- localStorage operations
- Main thread blocking time

## Network Throttling Tests

Test under various network conditions:

### Fast 3G
```
Download: 1.6 Mbps
Upload: 750 Kbps
RTT: 562.5 ms
```

### Slow 3G
```
Download: 400 Kbps
Upload: 400 Kbps
RTT: 2000 ms
```

### WiFi
```
Download: 30+ Mbps
Upload: 15+ Mbps
RTT: 2 ms
```

**Record**: Impact is more noticeable on slower networks

## Database Query Logging

### In Supabase Dashboard

1. Go to project dashboard
2. Open SQL Editor
3. Enable query logging
4. Monitor queries during login
5. Count and time each query

### Expected Queries (Before)

1. Authenticate user (access code lookup)
2-9. Sync 8 conference tables (including user_profiles)
10-13. Sync 4 application tables (including attendee_metadata)

### Expected Queries (After)

1. Authenticate user
2-8. Sync 7 conference tables (no user_profiles)
9-11. Sync 3 application tables (no attendee_metadata)

## Comparison Script

```javascript
// Run this in DevTools Console on both branches
const measureLoginPerformance = () => {
  const startTime = performance.now();
  const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('kn_cache_'));
  
  let totalSize = 0;
  const cacheDetails = {};
  
  cacheKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = value ? value.length : 0;
    totalSize += size;
    
    const tableName = key.replace('kn_cache_', '');
    cacheDetails[tableName] = {
      size: (size / 1024).toFixed(2) + ' KB',
      exists: !!value
    };
  });
  
  return {
    cacheCount: cacheKeys.length,
    totalSize: (totalSize / 1024).toFixed(2) + ' KB',
    tables: cacheDetails,
    measurementTime: performance.now() - startTime
  };
};

// Run and copy results
console.log(JSON.stringify(measureLoginPerformance(), null, 2));
```

## Success Criteria

Phase 1 optimization is successful if:

- ✅ Login time reduced by at least 10%
- ✅ Database queries reduced from 12 to 10
- ✅ No errors or cache misses
- ✅ All features working normally
- ✅ Offline mode functional
- ✅ localStorage size reduced

## Regression Testing

Ensure no functionality broken:

- [ ] Login/logout works
- [ ] Home page displays correctly
- [ ] Schedule page loads
- [ ] Sponsors page loads
- [ ] Meet page (attendee directory)
- [ ] Settings page
- [ ] Dining options display
- [ ] Seat assignments show
- [ ] Offline mode works
- [ ] Admin panel (if applicable)

## Next Steps After Testing

1. **If successful**:
   - Document results
   - Update summary with actual metrics
   - Create PR
   - Request merge

2. **If issues found**:
   - Document issues
   - Investigate root cause
   - Fix or rollback
   - Re-test

3. **Consider Phase 2**:
   - If Phase 1 shows good results
   - Plan lazy-loading for sponsors/hotels
   - Estimate additional impact

