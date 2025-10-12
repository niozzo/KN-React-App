# Story: Active Status Filtering Unification

**Story ID**: TBD  
**Epic**: Data Architecture Improvements  
**Type**: Enhancement  
**Priority**: Medium  
**Status**: DRAFT  
**Architecture Reference**: `docs/architecture/adr-active-status-filtering-unification.md`

---

## Story

**As a** system architect  
**I want** consistent `is_active` filtering across all data entities in a single architectural layer  
**So that** inactive records are never cached or displayed, ensuring data consistency and improving performance

---

## Context

Currently, `is_active` filtering is **inconsistent** across four core data entities:
- **Attendees**: Not filtered anywhere ❌
- **Agenda Items**: Filtered in AgendaService (after caching) ⚠️
- **Dining Options**: Filtered in ServerDataSyncService ✅ and API ✅
- **Sponsors**: Filtered in ServerDataSyncService ✅ and API ✅

This creates:
- **Cache inefficiency**: Inactive records stored unnecessarily
- **Code duplication**: Same logic in multiple places
- **Maintenance burden**: Changes require multiple updates
- **Data inconsistency**: Agenda items filter AFTER caching

The architectural pattern is already established in `IMPLEMENTATION-SUMMARY-COMPANY-FILTERING.md`: transformations should happen in `ServerDataSyncService.applyTransformations()` before caching.

---

## Acceptance Criteria

### Primary Criteria
1. ✅ All four entity types (attendees, agenda items, dining options, sponsors) filter `is_active` in `ServerDataSyncService.applyTransformations()`
2. ✅ All transformers implement consistent `filterActive{EntityName}()` methods
3. ✅ Redundant filtering removed from `AgendaService`
4. ✅ Inactive records never enter cache
5. ✅ All unit and integration tests pass
6. ✅ Manual verification checklist 100% complete

### Performance Criteria
7. ✅ Cache size reduced by 10-20% (assuming typical inactive record percentage)
8. ✅ No performance regression in data loading times

### Quality Criteria
9. ✅ Code coverage for filtering logic ≥ 90%
10. ✅ Zero lint errors introduced
11. ✅ Documentation updated for all changes

---

## Technical Approach

### Architecture Pattern
```
Database → ServerDataSyncService.applyTransformations() → Cache → Services → UI
              ↑
              └─ Single point of filtering (AUTHORITATIVE)
```

### Implementation Layers
1. **Transformer Layer**: Add consistent filter methods
2. **Sync Service Layer**: Apply filtering before cache
3. **Service Layer**: Remove redundant filtering
4. **API Layer**: Keep as defense-in-depth (comment only)

---

## Tasks

### Task 1: Standardize Transformer API ⏱️ 4 hours

**Objective**: Ensure all transformers have consistent filter methods

#### Subtasks
- [ ] Add `filterActive()` base method to `BaseTransformer`
  - File: `src/transformers/baseTransformer.ts`
  - Method signature: `filterActive(records: T[]): T[]`
  - Default implementation: `records.filter((record: any) => record.is_active !== false)`

- [ ] Add `filterActiveAgendaItems()` to `AgendaTransformer`
  - File: `src/transformers/agendaTransformer.ts`
  - Filter based on `isActive` field (post-transformation)
  - Handle undefined as active (default true)

- [ ] Add `filterActiveAttendees()` to `AttendeeTransformer`
  - File: `src/transformers/attendeeTransformer.ts`
  - Filter based on `isActive` field (post-transformation)
  - Handle undefined as active (default true)

- [ ] Verify existing filter methods
  - `DiningTransformer.filterActiveDiningOptions()` - already exists ✅
  - `SponsorTransformer.filterActiveSponsors()` - already exists ✅

**Testing**:
- Unit test for base method in `BaseTransformer`
- Unit test for each entity transformer filter method
- Test handling of `undefined`, `null`, `false`, `true` values

**Files Modified**:
- `src/transformers/baseTransformer.ts`
- `src/transformers/agendaTransformer.ts`
- `src/transformers/attendeeTransformer.ts`

---

### Task 2: Centralize Filtering in ServerDataSyncService ⏱️ 6 hours

**Objective**: Move ALL filtering to the centralized transformation layer

#### Subtasks
- [ ] Update `applyTransformations()` for agenda_items
  - Add: `records = agendaTransformer.filterActiveAgendaItems(records)`
  - Place AFTER transformation, BEFORE sorting
  - Location: After line 72 in `serverDataSyncService.ts`

- [ ] Update `applyTransformations()` for attendees
  - Add transformation step (currently missing)
  - Add: `records = attendeeTransformer.transformArrayFromDatabase(records)`
  - Add: `records = attendeeTransformer.filterActiveAttendees(records)`
  - Keep existing company filtering logic
  - Location: Lines 76-92 in `serverDataSyncService.ts`

- [ ] Verify dining_options filtering
  - Already correct at line 99 ✅
  - No changes needed

- [ ] Verify sponsors/hotels filtering
  - Already correct at line 106 ✅
  - No changes needed

- [ ] Add logging for filtered counts
  - Log: `Filtered to ${records.length} active {entity_type}`
  - Helps with debugging and monitoring

**Testing**:
- Integration test: Verify filtering happens before caching
- Integration test: Verify inactive records don't enter cache
- Integration test: Verify all four entity types filter correctly
- Test with mock data containing active and inactive records

**Files Modified**:
- `src/services/serverDataSyncService.ts`

---

### Task 3: Remove Redundant Filtering from AgendaService ⏱️ 2 hours

**Objective**: Clean up duplicate filtering in downstream services

#### Subtasks
- [ ] Remove filtering at line 331
  - Current: `const filteredItems = agendaItems.filter((item: any) => item.isActive)`
  - Change to: `const agendaItems = (cachedData as any)?.data || cachedData;`
  - Add comment: `// Data is already filtered in ServerDataSyncService`

- [ ] Remove filtering at line 399
  - Remove: `.filter((item: any) => item.isActive)`
  - Keep sorting logic

- [ ] Remove filtering at line 442
  - Remove: `.filter((item: any) => item.isActive)`
  - Keep sorting logic

**Testing**:
- Regression test: Verify agenda service still returns correct data
- Integration test: Verify home page displays only active sessions
- Integration test: Verify schedule page displays only active sessions

**Files Modified**:
- `src/services/agendaService.ts`

---

### Task 4: Update API Endpoints (Defense in Depth) ⏱️ 1 hour

**Objective**: Document that ServerDataSyncService is authoritative

#### Subtasks
- [ ] Add comment to `api/dining-options.js` line 97
  ```javascript
  // Defense in depth: Filter active records
  // NOTE: Primary filtering happens in ServerDataSyncService.applyTransformations()
  // This is a safety net for direct API access
  transformedData = diningTransformer.filterActiveDiningOptions(transformedData)
  ```

- [ ] Add comment to `api/sponsors.js` line 99
  - Same comment as above

- [ ] Add comment to `api/attendees.js`
  - Currently no filtering - add comment explaining why
  - "NOTE: Filtering happens in ServerDataSyncService. API serves raw data for admin purposes."

**Testing**:
- Manual test: Direct API calls still return filtered data
- Manual test: Verify API endpoints work as expected

**Files Modified**:
- `api/dining-options.js`
- `api/sponsors.js`
- `api/attendees.js`

---

### Task 5: Unit Tests ⏱️ 6 hours

**Objective**: Achieve 90%+ test coverage for filtering logic

#### Subtasks
- [ ] Create test file: `src/__tests__/transformers/active-filtering.test.ts`
  - Test AgendaTransformer filtering
  - Test AttendeeTransformer filtering
  - Test DiningTransformer filtering (verify existing)
  - Test SponsorTransformer filtering (verify existing)
  - Test edge cases: undefined, null, false, true
  - Test empty arrays
  - Test arrays with all inactive records

- [ ] Update test file: `src/__tests__/services/serverDataSyncService.test.ts`
  - Test filtering for all four entity types
  - Test filtered data flows through cache
  - Test cache doesn't contain inactive records
  - Mock database responses with active/inactive mix

- [ ] Update test file: `src/__tests__/services/agendaService.test.ts`
  - Verify redundant filtering removed
  - Test service still returns correct data
  - Verify no inactive items in results

**Coverage Target**: 90%+ for all filtering-related code

**Files Created/Modified**:
- `src/__tests__/transformers/active-filtering.test.ts` (new)
- `src/__tests__/services/serverDataSyncService.test.ts` (update)
- `src/__tests__/services/agendaService.test.ts` (update)

---

### Task 6: Integration Tests ⏱️ 4 hours

**Objective**: Verify end-to-end filtering behavior

#### Subtasks
- [ ] Create test file: `src/__tests__/integration/active-filtering.integration.test.ts`
  - Test full data sync flow with inactive records
  - Verify cache population with only active records
  - Test UI components receive only active data
  - Test cache invalidation and refresh

- [ ] Test scenarios:
  - Sync data with 50/50 active/inactive split
  - Verify cache size is 50% smaller
  - Toggle is_active in database and re-sync
  - Verify UI updates correctly

**Files Created**:
- `src/__tests__/integration/active-filtering.integration.test.ts` (new)

---

### Task 7: Manual Verification ⏱️ 3 hours

**Objective**: Verify filtering works correctly in all UI contexts

#### Subtasks
- [ ] Create verification document: `docs/testing/active-filtering-verification.md`
- [ ] Pre-implementation verification
  - Document current filtering locations
  - Verify transformer field mappings
  - Snapshot current cache contents

- [ ] Post-implementation verification
  - Clear all caches
  - Trigger data sync
  - Verify each entity type in UI:
    - Attendees: Bio page, Meet page
    - Agenda Items: Home page, Schedule page
    - Dining Options: Home page, Schedule page
    - Sponsors: Sponsor carousel, directory
  - Check localStorage contents
  - Check cache contents in DevTools

- [ ] Edge case testing
  - Test with is_active = undefined
  - Test with is_active = null
  - Test toggling is_active in database

**Files Created**:
- `docs/testing/active-filtering-verification.md` (created in ADR)

---

### Task 8: Documentation Updates ⏱️ 2 hours

**Objective**: Update all relevant documentation

#### Subtasks
- [ ] Update `docs/architecture/data-access-architecture.md`
  - Document centralized filtering pattern
  - Add diagram showing filtering flow

- [ ] Update `docs/architecture/schema-evolution-strategy.md`
  - Document filter methods in transformer interface

- [ ] Update `README.md` if needed
  - Document active status filtering behavior

- [ ] Update code comments
  - Add JSDoc comments to all filter methods
  - Document filtering locations

**Files Modified**:
- `docs/architecture/data-access-architecture.md`
- `docs/architecture/schema-evolution-strategy.md`
- `README.md` (if applicable)

---

## Dev Notes

### Critical Implementation Order
1. **Must Do First**: Add transformer filter methods (Task 1)
2. **Then**: Update ServerDataSyncService (Task 2)
3. **Finally**: Remove redundant filtering (Task 3)

This order ensures no period where filtering is broken.

### Testing Strategy
- Unit test each transformer individually
- Integration test the full sync flow
- Manual verification in staging environment
- Monitor production after deployment

### Rollback Plan
If issues arise:
1. Revert Task 3 first (restore AgendaService filtering)
2. Revert Task 2 (remove ServerDataSyncService filtering)
3. Keep Task 1 (transformer methods don't hurt)

### Performance Monitoring
- Track cache size before/after
- Monitor data sync duration
- Watch for any UI rendering issues

---

## File List

### New Files
- `src/__tests__/transformers/active-filtering.test.ts`
- `src/__tests__/integration/active-filtering.integration.test.ts`
- `docs/architecture/adr-active-status-filtering-unification.md`
- `docs/testing/active-filtering-verification.md`
- `docs/stories/DRAFT-active-status-filtering-unification.md` (this file)

### Modified Files
- `src/transformers/baseTransformer.ts`
- `src/transformers/agendaTransformer.ts`
- `src/transformers/attendeeTransformer.ts`
- `src/services/serverDataSyncService.ts`
- `src/services/agendaService.ts`
- `api/dining-options.js`
- `api/sponsors.js`
- `api/attendees.js`
- `src/__tests__/services/serverDataSyncService.test.ts`
- `src/__tests__/services/agendaService.test.ts`
- `docs/architecture/data-access-architecture.md`
- `docs/architecture/schema-evolution-strategy.md`

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**: 
- Comprehensive test suite before deployment
- Deploy to staging first
- Gradual rollout with monitoring

### Risk 2: Cache Invalidation Issues
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Force cache clear during deployment
- Add cache version key
- Monitor cache contents post-deployment

### Risk 3: Performance Regression
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Benchmark before/after
- Monitor production metrics
- Rollback plan ready

---

## Dependencies

**Blocks**: None  
**Blocked By**: None  
**Related Stories**: 
- Story 1.7: Data Transformation Layer (completed)
- Story 2.4: localStorage Backup Simplification (completed)

---

## Estimation

**Total Effort**: 28 hours (~3.5 days)

### Breakdown
- Task 1: 4 hours
- Task 2: 6 hours
- Task 3: 2 hours
- Task 4: 1 hour
- Task 5: 6 hours
- Task 6: 4 hours
- Task 7: 3 hours
- Task 8: 2 hours

**Recommended Sprint**: 1 sprint (1 week with testing)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tasks completed and checked off
- [ ] All tests passing (unit, integration, manual)
- [ ] Code coverage ≥ 90% for filtering logic
- [ ] Zero lint errors
- [ ] Code review completed and approved
- [ ] Documentation updated
- [ ] Deployed to staging and validated
- [ ] Deployed to production
- [ ] Post-deployment monitoring shows no regressions

---

## Success Metrics

1. **Cache Efficiency**: 10-20% reduction in cache size
2. **Code Quality**: Zero duplicate filtering logic
3. **Test Coverage**: ≥ 90% for filtering code
4. **Zero Bugs**: No regression bugs in production
5. **Consistency**: All four entity types filter identically

---

**Status**: DRAFT - Awaiting Approval  
**Next Step**: Review with team, assign to James (@dev) for implementation

---

*This story implements the architectural pattern defined in ADR: Active Status Filtering Unification*

