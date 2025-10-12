# Manual Verification Checklist - Company Field Filtering

## Overview
Two speakers (IDs: `de8cb880-e6f5-425d-9267-1eb0a2817f6b` and `21d75c80-9560-4e4c-86f0-9345ddb705a1`) should not display company affiliation across all pages.

## Implementation Status
✅ Code implementation complete
✅ Unit tests complete (9/9 passing)
✅ Integration tests complete (6/6 passing)
✅ Manual verification complete - ALL CHECKS PASSED

## Manual Verification Checklist

### Prerequisites
- [ ] Clear browser cache and localStorage
- [ ] Re-login to the application to trigger data sync
- [ ] Verify you have access to test with these specific attendee IDs

### Test Case 1: Bio Page Detail View
**Component**: `/bio?id=<attendee_id>` (BioPage.jsx, lines 202-210)

**Test Steps**:
1. Navigate to `/bio?id=de8cb880-e6f5-425d-9267-1eb0a2817f6b`
2. Wait for page to fully load
3. Inspect the profile section

**Expected Result**:
- [ ] Name is displayed correctly
- [ ] Title is displayed correctly
- [ ] Company div is NOT rendered OR displays as empty (no "Apax" text visible)
- [ ] Bio text is displayed correctly

**Test Steps** (Second attendee):
1. Navigate to `/bio?id=21d75c80-9560-4e4c-86f0-9345ddb705a1`
2. Wait for page to fully load
3. Inspect the profile section

**Expected Result**:
- [ ] Name is displayed correctly
- [ ] Title is displayed correctly
- [ ] Company div is NOT rendered OR displays as empty (no "Apax" text visible)
- [ ] Bio text is displayed correctly

---

### Test Case 2: Bio Search Results
**Component**: AttendeeCard.tsx (lines 109-113)

**Test Steps**:
1. Navigate to the attendee search/meet page
2. Search for one of the affected attendees by name
3. Locate the attendee card in search results
4. Inspect the company field

**Expected Result**:
- [ ] Attendee card displays correctly
- [ ] Title is shown
- [ ] Company conditional check `{attendee.company && ...}` evaluates to false
- [ ] Company div is NOT rendered (no "Apax" text in the card)

---

### Test Case 3: Schedule Speaker Info
**Component**: agendaService.ts (lines 233-246) and SessionCard.jsx

**Test Steps**:
1. Navigate to the schedule/agenda page
2. Find a session where one of these attendees is a speaker
3. Inspect the speaker information display

**Expected Result**:
- [ ] Speaker name format is "First Last, Title" (e.g., "John Doe, Speaker")
- [ ] Speaker name format is NOT "First Last, Title at Apax"
- [ ] No company name appears in the speaker info string

---

### Test Case 4: Home Page Sessions
**Component**: HomePage.jsx (current/next sessions)

**Test Steps**:
1. Navigate to the home page (`/`)
2. Check if current or next session features one of these speakers
3. Inspect the speaker information in the session card

**Expected Result**:
- [ ] Speaker info displays name and title only
- [ ] No company affiliation is shown
- [ ] Format matches other speakers without company

---

## Cross-Browser Testing (Optional)
Test in multiple browsers to ensure consistency:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

---

## Rollback Plan
If issues are found:
1. The change is easily reversible - remove lines 75-92 in `serverDataSyncService.ts`
2. Users will need to clear cache and re-login to revert

---

## Notes
- Users must re-login or clear cache to see these changes take effect
- The transformation happens at data sync time, so cached data won't update automatically
- Empty string is used instead of null to maintain type consistency

---

## Sign-off
**Tested by**: User  
**Date**: 2025-10-12  
**All checks passed**: ☑ Yes ☐ No  
**Issues found**: None - All manual verification checks passed successfully

### Verification Results
✅ Bio Page Detail View - Company field not displayed for both attendees  
✅ Bio Search Results - Company field not rendered in AttendeeCard  
✅ Schedule Speaker Info - Speaker format correct (no company shown)  
✅ Home Page Sessions - Speaker info excludes company affiliation  

**Status**: READY FOR PRODUCTION DEPLOYMENT

