# ADR: Active Status Filtering Unification

**Status:** Proposed  
**Date:** 2025-10-12  
**Architect:** Winston 🏗️  
**Decision:** Unify `is_active` filtering across all data entities in a single architectural layer

---

## Context

The application currently has **inconsistent** `is_active` filtering across four core data entities:

### Current State Analysis

| Entity | has `is_active` | Filtered in ServerDataSyncService | Filtered in Service Layer | Filtered in API Layer |
|--------|----------------|----------------------------------|-------------------------|---------------------|
| **Attendees** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Agenda Items** | ✅ Yes | ❌ No | ✅ Yes (AgendaService lines 331, 399, 442) | ❌ No |
| **Dining Options** | ✅ Yes | ✅ Yes (line 99) | N/A | ✅ Yes (API line 97) |
| **Sponsors** | ✅ Yes | ✅ Yes (line 106) | N/A | ✅ Yes (API line 99) |

### Problems with Current Architecture

1. **Inconsistent Filtering Locations**: Filtering happens in 3 different layers (ServerDataSyncService, Service Layer, API Layer)
2. **Code Duplication**: Same filtering logic exists in multiple places
3. **Cache Inconsistency**: Agenda items filter AFTER caching, meaning inactive items are cached
4. **Maintenance Burden**: Changes require updates in multiple locations
5. **Testing Complexity**: Each filtering location requires separate test coverage
6. **Missing Attendee Filtering**: Inactive attendees are never filtered out

### Architectural Pattern Already Established

The codebase already demonstrates the **correct pattern** in `IMPLEMENTATION-SUMMARY-COMPANY-FILTERING.md`:

> "Added a data transformation at the sync layer... This ensures:
> - ✅ Single point of transformation
> - ✅ Filtered data flows through all caching layers
> - ✅ Consistent display across all components
> - ✅ Easy to extend if more cases arise"

The pattern is clear: **`ServerDataSyncService.applyTransformations()` is the single source of truth for data transformations**.

---

## Decision

**Unify ALL `is_active` filtering in `ServerDataSyncService.applyTransformations()`** to ensure filtered data flows through all caching layers consistently.

### Architectural Principles

1. **Single Responsibility**: One location for all `is_active` filtering
2. **Filter Before Cache**: Inactive records never enter the cache
3. **Consistent API**: All transformers implement `filterActive{EntityName}()` method
4. **Separation of Concerns**: Services focus on business logic, not filtering
5. **Defense in Depth**: Keep API-level filtering as a safety net, but make ServerDataSyncService authoritative

---

## Implementation Plan

### Phase 1: Standardize Transformer API (Week 1, Day 1-2)

**Objective**: Ensure all transformers have consistent filter methods

#### 1.1 Update BaseTransformer

```typescript
// src/transformers/baseTransformer.ts

export abstract class BaseTransformer<T> implements DataTransformer<T> {
  // ... existing code ...
  
  /**
   * Filter active records based on is_active field
   * Override this method if entity uses different field name
   * @param records - Array of transformed records
   * @returns Filtered array with only active records
   */
  filterActive(records: T[]): T[] {
    return records.filter((record: any) => record.is_active !== false)
  }
}
```

#### 1.2 Update Entity Transformers

**AgendaTransformer** (ADD):
```typescript
// src/transformers/agendaTransformer.ts

/**
 * Filter active agenda items
 * Maps to isActive field after transformation
 */
filterActiveAgendaItems(agendaItems: AgendaItem[]): AgendaItem[] {
  return agendaItems.filter(item => item.isActive !== false)
}
```

**AttendeeTransformer** (ADD):
```typescript
// src/transformers/attendeeTransformer.ts

/**
 * Filter active attendees
 * Maps to isActive field after transformation
 */
filterActiveAttendees(attendees: Attendee[]): Attendee[] {
  return attendees.filter(attendee => attendee.isActive !== false)
}
```

**DiningTransformer** (EXISTS - Verify):
```typescript
// src/transformers/diningTransformer.ts:281-283
// ✅ Already implemented correctly
filterActiveDiningOptions(diningOptions: DiningOption[]): DiningOption[] {
  return diningOptions.filter(option => option.is_active !== false)
}
```

**SponsorTransformer** (EXISTS - Verify):
```typescript
// src/transformers/sponsorTransformer.ts:237-239
// ✅ Already implemented correctly
filterActiveSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.filter(sponsor => sponsor.is_active !== false)
}
```

**Files to Modify**:
- `src/transformers/baseTransformer.ts` (add base method)
- `src/transformers/agendaTransformer.ts` (add filter method)
- `src/transformers/attendeeTransformer.ts` (add filter method)

---

### Phase 2: Centralize Filtering in ServerDataSyncService (Week 1, Day 3-4)

**Objective**: Move all filtering to the centralized transformation layer

#### 2.1 Update ServerDataSyncService.applyTransformations()

```typescript
// src/services/serverDataSyncService.ts

/**
 * Apply data transformations and filtering for specific tables
 * @param tableName - Name of table
 * @param records - Raw records from database
 * @returns Transformed and filtered records
 */
private async applyTransformations(tableName: string, records: any[]): Promise<any[]> {
  // Agenda items transformation AND FILTERING
  if (tableName === 'agenda_items') {
    const { AgendaTransformer } = await import('../transformers/agendaTransformer.js');
    const agendaTransformer = new AgendaTransformer();
    records = agendaTransformer.transformArrayFromDatabase(records);
    records = agendaTransformer.filterActiveAgendaItems(records); // NEW: Add filtering
    records = agendaTransformer.sortAgendaItems(records);
  }
  
  // Attendees transformation AND FILTERING
  if (tableName === 'attendees') {
    const { AttendeeTransformer } = await import('../transformers/attendeeTransformer.js');
    const attendeeTransformer = new AttendeeTransformer();
    
    // Edge case: Clear company for specific attendees (existing logic)
    const ATTENDEES_WITHOUT_COMPANY = [
      'de8cb880-e6f5-425d-9267-1eb0a2817f6b',
      '21d75c80-9560-4e4c-86f0-9345ddb705a1'
    ];
    
    records = records.map(attendee => {
      if (ATTENDEES_WITHOUT_COMPANY.includes(attendee.id)) {
        return { ...attendee, company: '' };
      }
      return attendee;
    });
    
    // NEW: Transform and filter attendees
    records = attendeeTransformer.transformArrayFromDatabase(records);
    records = attendeeTransformer.filterActiveAttendees(records);
    
    console.log(`🔧 Filtered to ${records.length} active attendees`);
  }
  
  // Dining options transformation (ALREADY CORRECT)
  if (tableName === 'dining_options') {
    const { DiningTransformer } = await import('../transformers/diningTransformer.js');
    const diningTransformer = new DiningTransformer();
    records = diningTransformer.transformArrayFromDatabase(records);
    records = diningTransformer.filterActiveDiningOptions(records); // ✅ Already here
    records = diningTransformer.sortDiningOptions(records);
  }
  
  // Sponsors and hotels filtering (ALREADY CORRECT)
  if (tableName === 'sponsors' || tableName === 'hotels') {
    records = records
      .filter(r => r.is_active !== false) // ✅ Already here
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
  
  return records;
}
```

**Files to Modify**:
- `src/services/serverDataSyncService.ts` (update applyTransformations method)

---

### Phase 3: Remove Redundant Filtering (Week 1, Day 5)

**Objective**: Clean up duplicate filtering in downstream services

#### 3.1 Remove Filtering from AgendaService

**Current Code** (lines 331, 399, 442):
```typescript
const filteredItems = agendaItems.filter((item: any) => item.isActive);
```

**Updated Code**:
```typescript
// REMOVED: Filtering now happens in ServerDataSyncService
// const filteredItems = agendaItems.filter((item: any) => item.isActive);

// Data is already filtered before caching
const agendaItems = (cachedData as any)?.data || cachedData;
```

**Files to Modify**:
- `src/services/agendaService.ts` (remove 3 instances of `.filter((item: any) => item.isActive)`)

#### 3.2 Update API Endpoints (Defense in Depth)

Keep API-level filtering as a **safety net** but document that ServerDataSyncService is authoritative:

```typescript
// api/dining-options.js and api/sponsors.js
// Keep existing filtering but add comment:

// Defense in depth: Filter active records
// NOTE: Primary filtering happens in ServerDataSyncService.applyTransformations()
// This is a safety net for direct API access
transformedData = diningTransformer.filterActiveDiningOptions(transformedData)
```

**Files to Modify**:
- `api/dining-options.js` (add comment only)
- `api/sponsors.js` (add comment only)

---

### Phase 4: Testing & Validation (Week 2)

#### 4.1 Unit Tests

**New Test File**: `src/__tests__/transformers/active-filtering.test.ts`

```typescript
/**
 * Active Status Filtering Tests
 * Validates consistent is_active filtering across all transformers
 */

import { describe, it, expect } from 'vitest'
import { AgendaTransformer } from '../../transformers/agendaTransformer'
import { AttendeeTransformer } from '../../transformers/attendeeTransformer'
import { DiningTransformer } from '../../transformers/diningTransformer'
import { SponsorTransformer } from '../../transformers/sponsorTransformer'

describe('Active Status Filtering - Cross-Entity Consistency', () => {
  describe('AgendaTransformer', () => {
    it('should filter out inactive agenda items', () => {
      const transformer = new AgendaTransformer()
      const items = [
        { id: '1', title: 'Active', isActive: true },
        { id: '2', title: 'Inactive', isActive: false },
        { id: '3', title: 'Active', isActive: true },
      ]
      
      const filtered = transformer.filterActiveAgendaItems(items)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(item => item.isActive !== false)).toBe(true)
    })
    
    it('should keep items with undefined is_active (default true)', () => {
      const transformer = new AgendaTransformer()
      const items = [
        { id: '1', title: 'Active', isActive: undefined },
      ]
      
      const filtered = transformer.filterActiveAgendaItems(items)
      
      expect(filtered).toHaveLength(1)
    })
  })
  
  describe('AttendeeTransformer', () => {
    it('should filter out inactive attendees', () => {
      const transformer = new AttendeeTransformer()
      const attendees = [
        { id: '1', name: 'Active', isActive: true },
        { id: '2', name: 'Inactive', isActive: false },
      ]
      
      const filtered = transformer.filterActiveAttendees(attendees)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('1')
    })
  })
  
  // Similar tests for DiningTransformer and SponsorTransformer
})
```

#### 4.2 Integration Tests

**Update File**: `src/__tests__/services/serverDataSyncService.test.ts`

```typescript
describe('ServerDataSyncService - Active Filtering Integration', () => {
  it('should filter inactive records in applyTransformations for all entity types', async () => {
    const mockRecords = {
      attendees: [
        { id: '1', isActive: true },
        { id: '2', isActive: false }
      ],
      agenda_items: [
        { id: '1', isActive: true },
        { id: '2', isActive: false }
      ],
      dining_options: [
        { id: '1', is_active: true },
        { id: '2', is_active: false }
      ],
      sponsors: [
        { id: '1', is_active: true },
        { id: '2', is_active: false }
      ]
    }
    
    // Test each entity type
    for (const [tableName, records] of Object.entries(mockRecords)) {
      const filtered = await service.applyTransformations(tableName, records)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('1')
    }
  })
  
  it('should ensure filtered data flows through cache', async () => {
    // Mock data with inactive record
    const mockData = [
      { id: '1', title: 'Active', isActive: true },
      { id: '2', title: 'Inactive', isActive: false }
    ]
    
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null })
    })
    
    // Sync to cache
    await service.syncTable('agenda_items')
    
    // Verify cache only contains active records
    const cachedData = await unifiedCache.get('kn_cache_agenda_items')
    expect(cachedData).toHaveLength(1)
    expect(cachedData[0].id).toBe('1')
  })
})
```

#### 4.3 Manual Verification Checklist

Create: `docs/testing/active-filtering-verification.md`

```markdown
# Active Filtering Verification Checklist

## Pre-Implementation Verification
- [ ] Document current filtering locations for each entity
- [ ] Verify all transformers have is_active field mapping
- [ ] Confirm cache contents before changes

## Post-Implementation Verification
- [ ] **Attendees**: Verify inactive attendees don't appear in:
  - [ ] Bio page search results
  - [ ] Meet page attendee lists
  - [ ] Cached attendee data
  
- [ ] **Agenda Items**: Verify inactive sessions don't appear in:
  - [ ] Home page now/next cards
  - [ ] Schedule page agenda list
  - [ ] Cached agenda data
  
- [ ] **Dining Options**: Verify inactive options don't appear in:
  - [ ] Home page dining events
  - [ ] Schedule page dining list
  - [ ] Cached dining data
  
- [ ] **Sponsors**: Verify inactive sponsors don't appear in:
  - [ ] Sponsor carousel
  - [ ] Sponsor directory page
  - [ ] Cached sponsor data

## Cache Integrity
- [ ] Clear all caches
- [ ] Trigger data sync
- [ ] Verify cache contains only active records
- [ ] Check localStorage backup contains only active records

## API Endpoints
- [ ] Direct API call to /api/attendees returns only active
- [ ] Direct API call to /api/agenda-items returns only active
- [ ] Direct API call to /api/dining-options returns only active
- [ ] Direct API call to /api/sponsors returns only active

## Edge Cases
- [ ] Test with is_active = undefined (should be treated as active)
- [ ] Test with is_active = null (should be treated as active)
- [ ] Test with is_active = false (should be filtered out)
- [ ] Test data sync after toggling is_active in database
```

---

## Benefits

### Architectural Benefits
1. **Single Source of Truth**: All filtering happens in one location
2. **Cache Efficiency**: Inactive records never enter cache, reducing storage and improving performance
3. **Consistent Behavior**: All parts of app see same filtered data
4. **Maintainability**: Changes to filtering logic only need one update
5. **Testability**: One location to test instead of multiple

### Performance Benefits
1. **Reduced Cache Size**: ~10-20% reduction (assuming 10-20% inactive records)
2. **Faster Cache Reads**: Fewer records to iterate over
3. **Reduced Memory**: Inactive records never loaded into memory
4. **Faster UI Rendering**: Fewer records to render in lists

### Business Benefits
1. **Data Integrity**: Inactive records consistently hidden across app
2. **User Experience**: Users never see stale/inactive data
3. **Admin Control**: Toggling is_active in database immediately affects all users
4. **Compliance**: Ensures deactivated attendees don't appear in any view

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Comprehensive test suite before deployment
- Manual verification checklist
- Gradual rollout (test in staging first)

### Risk 2: API Endpoint Direct Access
**Mitigation**: 
- Keep API-level filtering as defense in depth
- Document that ServerDataSyncService is primary

### Risk 3: Cache Invalidation Issues
**Mitigation**: 
- Clear all caches during deployment
- Add cache version key to force refresh

---

## Implementation Timeline

### Week 1: Development
- **Day 1-2**: Phase 1 - Standardize Transformer API
- **Day 3-4**: Phase 2 - Centralize Filtering
- **Day 5**: Phase 3 - Remove Redundant Filtering

### Week 2: Testing & Validation
- **Day 1-2**: Phase 4.1 - Unit Tests
- **Day 3**: Phase 4.2 - Integration Tests
- **Day 4**: Phase 4.3 - Manual Verification
- **Day 5**: Code Review & Documentation

### Week 3: Deployment
- **Day 1**: Deploy to staging
- **Day 2-3**: Staging validation
- **Day 4**: Deploy to production
- **Day 5**: Production monitoring

---

## Success Criteria

1. ✅ All four entity types have consistent filtering in ServerDataSyncService
2. ✅ All transformer tests pass with 90%+ coverage
3. ✅ Integration tests verify filtered data flows through cache
4. ✅ Manual verification checklist 100% complete
5. ✅ No inactive records appear in any UI component
6. ✅ Cache size reduced by 10-20%
7. ✅ Zero regression bugs in production

---

## Related Documents

- `IMPLEMENTATION-SUMMARY-COMPANY-FILTERING.md` - Pattern we're following
- `docs/architecture/data-access-architecture.md` - Overall data architecture
- `docs/architecture/schema-evolution-strategy.md` - Transformer pattern
- `unify-data-sync-methods.plan.md` - Related sync unification

---

## Approval

**Architect**: Winston 🏗️  
**Status**: Awaiting Approval  
**Next Step**: Present to team for review and approval

---

*This ADR establishes the architectural pattern for unified active status filtering across all data entities in the Knowledge Now application.*

