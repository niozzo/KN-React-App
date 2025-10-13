# RCA - Round 3 Test Failures (6 failures)

**Date**: October 12, 2025  
**Status**: 6 failures (2 ForceSync, 4 useSessionData)

---

## Executive Summary

**Results**: 123 passed, 6 failed (95.3% pass rate)  
**Progress**: From 7 → 6 failures (slight improvement but 2 persist)  
**Categories**: 
- 2 ForceSync tests (mock implementation issue)
- 4 useSessionData-seating-bridge tests (data not found)

---

## Failure Category 1: ForceSync Tests (2 failures)

### Failing Tests
1. ForceSync.integration.test.tsx > should execute complete sync workflow successfully
2. ForceSync.pwa.test.tsx > should handle partial data sync results

### Error
```
AssertionError: expected "getAgendaItemsWithAssignments" to be called at least once
```

### HTML Evidence
Both show: "Failed to load admin data. Please try again."

### Root Cause
My previous fix was incomplete! The issue:

```typescript
// What I did:
mockAdminService.getAgendaItemsWithAssignments.mockClear();
mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);

// Problem: mockClear() ALSO clears the other mocks!
// When AdminPage loads after sync, it needs:
// - ensureDataLoaded → Still has mock ✓
// - getAgendaItemsWithAssignments → Re-mocked ✓
// - getDiningOptionsWithMetadata → CLEARED! ✗
// - getAvailableAttendees → CLEARED! ✗
```

The load fails because 2 of 3 required methods have no mock implementation!

### Solution
Re-mock ALL three admin service methods after clear:

```typescript
mockAdminService.getAgendaItemsWithAssignments.mockClear();
mockAdminService.getDiningOptionsWithMetadata.mockClear();
mockAdminService.getAvailableAttendees.mockClear();

// Re-setup ALL three
mockAdminService.getAgendaItemsWithAssignments.mockResolvedValue([]);
mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
mockAdminService.getAvailableAttendees.mockResolvedValue([]);
```

---

## Failure Category 2: useSessionData Tests (4 failures)

### Failing Tests
1. should enhance agenda item with seat info using bridge table
2. should return event without seatInfo when no seating configuration exists
3. should return event with null seatInfo when configuration exists but no seat assignment
4. should enhance dining event with seat info using bridge table

### Error Pattern
```javascript
const agendaEvent = sessions.find(e => e.id === 'agenda-item-001');
expect(agendaEvent).toBeDefined(); // ✗ FAILS - agendaEvent is undefined
```

### Root Cause
The hook `useSessionData` isn't returning agenda items in the expected format or location. The test expects items in `sessions` array but they might be in a different structure.

### Investigation Needed
1. Check what `useSessionData` actually returns
2. Check if the mock data is properly structured
3. Verify the bridge table logic is working

---

## Fix Plan

### Priority 1: ForceSync (2 tests) - 5 minutes
**Confidence**: High - I know exactly what's wrong

```typescript
// In both test files, after mockClear(), add:
mockAdminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
mockAdminService.getAvailableAttendees.mockResolvedValue([]);
```

### Priority 2: useSessionData (4 tests) - 15 minutes
**Confidence**: Medium - Need to investigate

1. Read the test file
2. Understand expected data structure
3. Check hook implementation
4. Fix mock data or test expectations

---

## Quick Fix Implementation

Let me fix ForceSync first (quick win), then investigate useSessionData.




