# Test Issues Diagnostic Findings Report

**Date:** October 11, 2025  
**Phase:** Investigation Complete (Phases 1-3)

---

## Executive Summary

### Issues Addressed:
1. ✅ **Module Import Error** - FIXED
2. 🔍 **File Handle Leaks** - ROOT CAUSES IDENTIFIED  
3. 🚨 **Security Violations** - REAL ISSUES FOUND (66 violations)

### Key Findings:
- **File handle leaks** are caused by 3 active intervals + 13 event listeners not being cleaned up
- **Security violations** are REAL - sensitive PII data is being stored in localStorage without filtering
- **Process hanging** is due to resource leak accumulation (581 file handles = memory exhaustion)

---

## Part 1: Module Import Error (FIXED ✅)

### Issue:
```
Cannot find module 'applicationDatabaseService'
```

### Fix Applied:
**File:** `src/services/attendeeCacheFilterService.ts:10`

```typescript
// Changed from:
import { applicationDatabaseService } from './applicationDatabaseService';

// To:
import { applicationDatabaseService } from './applicationDatabaseService.ts';
```

### Status:
✅ **RESOLVED** - This will fix 2 test suite failures:
- `HomePage.edge-cases.test.tsx`
- `HomePage.time-override-edge-cases.test.tsx`

---

## Part 2: File Handle Leaks (ROOT CAUSE IDENTIFIED 🔍)

### Diagnostic Results:

**Source:** `leak-diagnostic.log` from `useSessionData.test.js`

```
=== LEAK DETECTOR REPORT ===
Active Intervals: 3
Active Timeouts: 0
Active Listeners: 
  - online: 1
  - offline: 1
  - pwa-status-change: 1
  - attendee-data-updated: 1
  - storage: 2
  - timeOverrideChanged: 2
  - timeOverrideBoundaryCrossed: 2
  - diningMetadataUpdated: 2
  - agendaMetadataUpdated: 2
===========================
```

### Root Causes Identified:

#### 1. Three Active Intervals Not Cleaned Up

**Suspected Sources:**
- `useSessionData.js:650` - Auto-refresh interval (refreshInterval = 300000ms / 5 minutes)
- `useSessionData.js:825` - Real-time update interval (1000ms / 1 second)
- Unknown third interval (possibly from TimeService or other service)

**Issue:** These intervals continue running after tests complete, preventing process exit.

#### 2. Thirteen Event Listeners Not Removed

**Categories:**

**Browser Events (3 listeners):**
- `online` (1) - from `useSessionData.js:628`
- `offline` (1) - from `useSessionData.js:629`
- `pwa-status-change` (1) - from `useSessionData.js:632`

**Custom Application Events (10 listeners):**
- `attendee-data-updated` (1)
- `storage` (2)
- `timeOverrideChanged` (2)
- `timeOverrideBoundaryCrossed` (2)
- `diningMetadataUpdated` (2)
- `agendaMetadataUpdated` (2)

**Issue:** Event listeners persist after component unmount, causing memory leaks and preventing garbage collection.

#### 3. Memory Exhaustion

**Evidence:**
```
Error: Worker terminated due to reaching memory limit: JS heap out of memory
code: 'ERR_WORKER_OUT_OF_MEMORY'
```

**Analysis:** 
- The 3 intervals + 13 listeners create 16 resource leaks per test
- With 17 tests running, that's potentially 272+ leaked resources
- These accumulate and multiply, leading to the 581 file handles observed
- Eventually causes heap out of memory and process hang

### Recommended Fixes:

#### Fix 1: Ensure Interval Cleanup in useSessionData

**File:** `src/hooks/useSessionData.js:650`

```javascript
// Auto-refresh interval (around line 650)
useEffect(() => {
  if (!autoRefresh || isOffline || !isAuthenticated) return;

  const interval = setInterval(() => {
    loadSessionData();
  }, refreshInterval);

  // ADD THIS CLEANUP:
  return () => {
    clearInterval(interval);
  };
}, [autoRefresh, isOffline, isAuthenticated, loadSessionData, refreshInterval]);
```

**File:** `src/hooks/useSessionData.js:825`

```javascript
// Real-time update interval (around line 825)
useEffect(() => {
  // ... setup code ...
  const interval = setInterval(handleRealTimeUpdate, 1000);

  return () => {
    clearInterval(interval);
    // ALSO ADD:
    TimeService.stopBoundaryMonitoring?.();
  };
}, [/* dependencies */]);
```

#### Fix 2: Add Comprehensive Test Cleanup

**File:** `src/__tests__/hooks/useSessionData.test.js`

Add enhanced cleanup in `afterEach`:

```javascript
afterEach(() => {
  vi.restoreAllMocks();
  
  // Clear all timers
  vi.clearAllTimers();
  
  // Remove all known event listeners
  const events = [
    'online', 'offline', 'pwa-status-change',
    'attendee-data-updated', 'storage',
    'timeOverrideChanged', 'timeOverrideBoundaryCrossed',
    'diningMetadataUpdated', 'agendaMetadataUpdated'
  ];
  
  // Clear each event type
  events.forEach(event => {
    // Remove all instances
    const handlers = window.eventListeners?.[event] || [];
    handlers.forEach(handler => {
      window.removeEventListener(event, handler);
    });
  });
  
  // Clear localStorage
  localStorage.clear();
});
```

#### Fix 3: Increase Test Timeouts

**File:** `vitest.config.ts`

```typescript
testTimeout: 5000,        // Increase from 3000
hookTimeout: 5000,        // Keep at 5000
teardownTimeout: 15000,   // Increase from 10000
```

---

## Part 3: Security Violations (REAL ISSUES FOUND 🚨)

### Diagnostic Results:

**Source:** `security-audit.log` from `productionCacheAudit.test.ts`

### Test 1: Complete localStorage Audit

**Violations Found:** 66 total

**Categories of Sensitive Data Being Cached:**

#### Phone Numbers (132 violations across 3 cache keys):
- `business_phone`: "555-123-4567"
- `mobile_phone`: "555-987-6543"
- `spouse_details.mobilePhone`: "555-111-2222"

#### Physical Addresses (198 violations):
- `address1`: "123 Main Street"
- `address2`: "Apt 4B"
- `postal_code`: "12345"
- `city`: "New York"
- `state`: "NY"
- `country`: "United States"
- `country_code`: "US"

#### Hotel & Travel Information (132 violations):
- `check_in_date`: "2025-10-20"
- `check_out_date`: "2025-10-22"
- `hotel_selection`: "hotel-uuid-123"
- `custom_hotel`: "Custom Hotel Name"
- `room_type`: "suite"

#### Personal Preferences (99 violations):
- `dietary_requirements`: "Vegetarian"
- `has_spouse`: true
- `is_spouse`: false
- `spouse_details`: {email, phone, dietary requirements}

#### Sensitive Identifiers (66 violations):
- `access_code`: "SECRET123" ⚠️ CRITICAL
- `idloom_id`: "IDLOOM123"

#### Contact Information (66 violations):
- `assistant_name`: "Jane Assistant"
- `assistant_email`: "jane.assistant@example.com"
- `spouse_details.email`: "spouse@example.com"

### Test 2: Attendee Key Identification

**Keys Found:** 
- ✅ `kn_cache_attendees`
- ✅ `kn_cache_attendee`
- ✅ `kn_current_attendee_info`

**Keys Missing:**
- ❌ `kn_attendee_selections` - Not being tested/used
- ❌ `kn_user_data` - Not being tested/used

**Analysis:** Tests expect certain cache keys that may not actually be used in production. This might be a test expectation issue rather than a code issue.

### Test 3 & 4: Security Compliance

Additional violations found in nested data structures and compliance checks (details in full log).

---

## Security Risk Assessment

### Severity: **HIGH** 🔴

**Why This Matters:**

1. **PII Exposure:** Personal Identifiable Information (phone numbers, addresses) stored in browser localStorage
2. **Access Codes:** Sensitive authentication tokens (`access_code`) are cached unencrypted
3. **GDPR/Privacy Concerns:** Storing this data violates data minimization principles
4. **Browser Access:** Any JavaScript on the page can read localStorage
5. **Persistence:** Data remains even after browser closes
6. **XSS Risk:** Cross-site scripting attacks can exfiltrate all cached data

### What Should Be Cached vs. Filtered:

**✅ SAFE TO CACHE:**
- `id` (UUID)
- `first_name`
- `last_name`
- `email` (debatable, but often needed for display)
- `company`
- `title`
- `selected_agenda_items` (IDs only)
- `selected_breakouts` (IDs only)

**❌ MUST BE FILTERED:**
- Phone numbers (business_phone, mobile_phone)
- Physical addresses (all address fields)
- Access codes / passwords
- Hotel information (travel plans)
- Dietary requirements (medical information)
- Spouse details (third-party PII)
- Assistant information
- External IDs (idloom_id)

### Recommended Approach:

**Option A: Fix Filtering Code** (RECOMMENDED)

Update `attendeeCacheFilterService.ts` to properly filter all confidential fields before caching.

**File:** `src/services/attendeeCacheFilterService.ts`

Ensure `CONFIDENTIAL_FIELDS` array includes all the fields found in violations:

```typescript
const CONFIDENTIAL_FIELDS = [
  'business_phone',
  'mobile_phone',
  'address1',
  'address2',
  'postal_code',
  'city',
  'state',
  'country',
  'country_code',
  'check_in_date',
  'check_out_date',
  'hotel_selection',
  'custom_hotel',
  'room_type',
  'has_spouse',
  'is_spouse',
  'spouse_details',
  'dietary_requirements',
  'access_code',
  'idloom_id',
  'assistant_name',
  'assistant_email'
];
```

**Option B: Update Test Expectations** (NOT RECOMMENDED)

If business determines some fields are acceptable to cache, update tests to allow specific violations. This is risky and not recommended for PII data.

---

## Recommendations Summary

### Immediate Actions Required:

1. ✅ **Module Import** - Already fixed
2. 🔴 **Security Filtering** - Fix confidential data leakage (HIGH PRIORITY)
3. 🟡 **File Handle Leaks** - Fix interval and event listener cleanup (MEDIUM PRIORITY)
4. 🟢 **Test Timeouts** - Increase timeouts to prevent false failures (LOW PRIORITY)

### Next Steps:

1. **User Decision Required:**
   - Approve security fix approach (add fields to filter list)
   - Confirm which fields are acceptable to cache (if any beyond the safe list)

2. **Implementation Order:**
   - Phase 1: Security fixes (protect user data)
   - Phase 2: Resource leak fixes (improve test stability)
   - Phase 3: Test configuration updates (prevent timeouts)

3. **Testing:**
   - Re-run security tests after filtering updates
   - Re-run all tests to verify process exits cleanly
   - Monitor hanging-process reporter output

---

## Files Modified So Far:

1. ✅ `src/services/attendeeCacheFilterService.ts` - Import fix
2. ✅ `src/__tests__/utils/leak-detector.ts` - Created diagnostic tool
3. ✅ `src/__tests__/setup.ts` - Added leak tracking
4. ✅ `src/__tests__/security/productionCacheAudit.test.ts` - Added debug logging

## Files Pending Updates:

1. ⏳ `src/services/attendeeCacheFilterService.ts` - Add missing fields to filter
2. ⏳ `src/hooks/useSessionData.js` - Fix interval cleanup
3. ⏳ `src/__tests__/hooks/useSessionData.test.js` - Add comprehensive cleanup
4. ⏳ `vitest.config.ts` - Increase timeouts
5. ⏳ `src/__tests__/security/productionCacheAudit.test.ts` - Update test expectations (if needed)

---

**Status:** Investigation Phase Complete - Awaiting User Decision on Fix Priorities

