# Active Status Filtering Architecture - Visual Reference

**Related**: `adr-active-status-filtering-unification.md`  
**Purpose**: Visual guide to the filtering architecture change

---

## Before: Inconsistent Filtering (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │Attendees│  │ Agenda  │  │ Dining  │  │Sponsors │          │
│  │(222)    │  │ Items   │  │ Options │  │ (27)    │          │
│  │Active:  │  │ (10)    │  │ (2)     │  │Active:  │          │
│  │Unknown  │  │Active:  │  │Active:  │  │Unknown  │          │
│  └─────────┘  │Unknown  │  │Unknown  │  └─────────┘          │
│                └─────────┘  └─────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              ServerDataSyncService.applyTransformations()        │
│                                                                   │
│  ❌ Attendees:      NO FILTERING                                │
│  ❌ Agenda Items:   NO FILTERING                                │
│  ✅ Dining Options: FILTERED ← filterActiveDiningOptions()      │
│  ✅ Sponsors:       FILTERED ← filter(is_active !== false)      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                          CACHE LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ kn_cache_attendees          ← Contains inactive ❌      │   │
│  │ kn_cache_agenda_items       ← Contains inactive ❌      │   │
│  │ kn_cache_dining_options     ← Only active ✅            │   │
│  │ kn_cache_sponsors           ← Only active ✅            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│                                                                   │
│  ❌ AttendeeService:  NO FILTERING                              │
│  ⚠️  AgendaService:   FILTERED HERE (3 places) ← REDUNDANT     │
│  ✅ DataService:      Already filtered                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                          UI LAYER                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │Bio Page │  │Home Page│  │Schedule │  │Sponsors │          │
│  │         │  │         │  │  Page   │  │  Page   │          │
│  │Inactive │  │Only     │  │Only     │  │Only     │          │
│  │visible? │  │Active ✅│  │Active ✅│  │Active ✅│          │
│  │❌       │  └─────────┘  └─────────┘  └─────────┘          │
│  └─────────┘                                                     │
└─────────────────────────────────────────────────────────────────┘

⚠️ PROBLEMS:
  1. Inconsistent filtering locations (3 different layers)
  2. Agenda Items filter AFTER caching (inefficient)
  3. Attendees never filtered (data leak)
  4. Code duplication (same logic in multiple places)
  5. Cache pollution (inactive records stored)
```

---

## After: Unified Filtering (Proposed Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │Attendees│  │ Agenda  │  │ Dining  │  │Sponsors │          │
│  │(222)    │  │ Items   │  │ Options │  │ (27)    │          │
│  │Active:  │  │ (10)    │  │ (2)     │  │Active:  │          │
│  │200      │  │Active: 9│  │Active:2 │  │25       │          │
│  │Inactive:│  │Inactive:│  │Inactive:│  │Inactive:│          │
│  │22       │  │1        │  │0        │  │2        │          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              ServerDataSyncService.applyTransformations()        │
│              ★★★ SINGLE SOURCE OF TRUTH ★★★                      │
│                                                                   │
│  ✅ Attendees:      FILTERED ← filterActiveAttendees()          │
│  ✅ Agenda Items:   FILTERED ← filterActiveAgendaItems()        │
│  ✅ Dining Options: FILTERED ← filterActiveDiningOptions()      │
│  ✅ Sponsors:       FILTERED ← filterActiveSponsors()           │
│                                                                   │
│  📊 Result: Only ACTIVE records pass through                    │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                          CACHE LAYER                             │
│              ★ Inactive records NEVER enter cache ★             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ kn_cache_attendees          ← Only active (200) ✅      │   │
│  │ kn_cache_agenda_items       ← Only active (9) ✅        │   │
│  │ kn_cache_dining_options     ← Only active (2) ✅        │   │
│  │ kn_cache_sponsors           ← Only active (25) ✅       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  📈 Benefits: 10-20% smaller cache, faster reads                │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│              ★ No filtering needed - data pre-filtered ★        │
│                                                                   │
│  ✅ AttendeeService:  Already filtered                          │
│  ✅ AgendaService:    Already filtered (3 filters removed)      │
│  ✅ DataService:      Already filtered                          │
│                                                                   │
│  🎯 Focus: Business logic, not filtering                        │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                          UI LAYER                                │
│              ★ Guaranteed to receive only active data ★         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │Bio Page │  │Home Page│  │Schedule │  │Sponsors │          │
│  │         │  │         │  │  Page   │  │  Page   │          │
│  │Only     │  │Only     │  │Only     │  │Only     │          │
│  │Active ✅│  │Active ✅│  │Active ✅│  │Active ✅│          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│                                                                   │
│  🎨 Simplified: No defensive filtering needed                   │
└─────────────────────────────────────────────────────────────────┘

✅ BENEFITS:
  1. Single source of truth (one filtering location)
  2. Efficient caching (inactive records never cached)
  3. Consistent behavior (all entities filtered identically)
  4. Better performance (10-20% smaller cache)
  5. Cleaner code (no duplication)
  6. Easier testing (one location to test)
```

---

## Data Flow Comparison

### Before (Inconsistent)
```
┌────────────┐
│  Database  │
└────────────┘
      ↓ (raw data with inactive records)
┌────────────┐
│   Sync     │  ← Filters: Dining ✅, Sponsors ✅
└────────────┘      Missing: Attendees ❌, Agenda ❌
      ↓ (partially filtered)
┌────────────┐
│   Cache    │  ← Contains inactive Attendees + Agenda
└────────────┘
      ↓ (mixed data)
┌────────────┐
│  Services  │  ← AgendaService filters here (redundant)
└────────────┘
      ↓ (finally filtered)
┌────────────┐
│     UI     │
└────────────┘
```

### After (Consistent)
```
┌────────────┐
│  Database  │
└────────────┘
      ↓ (raw data with inactive records)
┌────────────┐
│   Sync     │  ← ★ FILTERS ALL ENTITIES ★
└────────────┘      Attendees ✅, Agenda ✅, Dining ✅, Sponsors ✅
      ↓ (fully filtered)
┌────────────┐
│   Cache    │  ← Only active records (10-20% smaller)
└────────────┘
      ↓ (clean data)
┌────────────┐
│  Services  │  ← No filtering needed
└────────────┘
      ↓ (pass-through)
┌────────────┐
│     UI     │  ← Guaranteed active data
└────────────┘
```

---

## Transformer Interface Contract

### All Transformers Implement
```typescript
interface DataTransformer<T> {
  // Core transformation
  transformFromDatabase(dbData: any): T
  transformArrayFromDatabase(dbDataArray: any[]): T[]
  
  // ★ NEW: Active filtering (required)
  filterActive{EntityName}(records: T[]): T[]
  
  // Sorting (optional)
  sort{EntityName}(records: T[]): T[]
}
```

### Implementation Pattern
```typescript
export class EntityTransformer extends BaseTransformer<Entity> {
  /**
   * Filter active records
   * @param records - Transformed records
   * @returns Only active records (is_active !== false)
   */
  filterActiveEntities(records: Entity[]): Entity[] {
    return records.filter(record => record.is_active !== false)
    // Note: Treats undefined/null as active (defaultValue: true)
  }
}
```

---

## Code Change Summary

### Files Modified (11 files)
```
src/
├── transformers/
│   ├── baseTransformer.ts          ← Add filterActive() method
│   ├── agendaTransformer.ts        ← Add filterActiveAgendaItems()
│   └── attendeeTransformer.ts      ← Add filterActiveAttendees()
├── services/
│   ├── serverDataSyncService.ts    ← Apply all filters here
│   └── agendaService.ts            ← Remove 3 redundant filters
└── __tests__/
    ├── transformers/
    │   └── active-filtering.test.ts         ← NEW test file
    └── integration/
        └── active-filtering.integration.test.ts  ← NEW test file

api/
├── dining-options.js               ← Add comment (defense in depth)
├── sponsors.js                     ← Add comment (defense in depth)
└── attendees.js                    ← Add comment (why no filtering)

docs/
├── architecture/
│   ├── adr-active-status-filtering-unification.md  ← NEW ADR
│   └── active-filtering-architecture-diagram.md     ← This file
├── stories/
│   └── DRAFT-active-status-filtering-unification.md ← NEW story
└── testing/
    └── active-filtering-verification.md    ← NEW checklist
```

### Lines of Code Impact
- **Added**: ~200 lines (filter methods + tests)
- **Removed**: ~20 lines (redundant filters)
- **Modified**: ~50 lines (service updates)
- **Net Change**: +230 lines

---

## Performance Impact

### Cache Size Reduction
```
Before:
- Attendees: 222 records × ~2KB = 444KB
- Agenda: 10 records × ~1KB = 10KB
- Dining: 2 records × ~1KB = 2KB
- Sponsors: 27 records × ~0.5KB = 13.5KB
Total: ~469.5KB

After (assuming 10% inactive):
- Attendees: 200 records × ~2KB = 400KB  ↓ 44KB
- Agenda: 9 records × ~1KB = 9KB         ↓ 1KB
- Dining: 2 records × ~1KB = 2KB         ↓ 0KB
- Sponsors: 25 records × ~0.5KB = 12.5KB ↓ 1KB
Total: ~423.5KB                          ↓ 46KB (9.8% reduction)
```

### Read Performance
```
Before:
- Cache read: 222 attendees to filter → ~5ms
- Service filter: Additional ~2ms
Total: ~7ms per read

After:
- Cache read: 200 attendees (no filter needed) → ~4.5ms
- Service filter: 0ms
Total: ~4.5ms per read (36% faster)
```

---

## Migration Path

### Phase 1: Add (Week 1, Days 1-2)
- Add filter methods to transformers
- Add tests
- **No breaking changes**

### Phase 2: Update (Week 1, Days 3-4)
- Update ServerDataSyncService to use new filters
- **Breaking change**: Cache behavior changes

### Phase 3: Clean (Week 1, Day 5)
- Remove redundant service layer filtering
- **Breaking change**: AgendaService signature changes

### Phase 4: Verify (Week 2)
- Run full test suite
- Manual verification
- Deploy to staging
- Monitor production

---

## Rollback Strategy

### If Issues Arise
```
Step 1: Revert Phase 3 (AgendaService cleanup)
  → Restores service-level filtering as safety net

Step 2: Clear production caches
  → Forces re-sync with working code

Step 3: If still broken, revert Phase 2
  → Restores original ServerDataSyncService

Step 4: Keep Phase 1 changes
  → Filter methods don't hurt, useful for future
```

### Monitoring Points
- Cache size metrics
- Data sync duration
- UI rendering performance
- Error rates
- User-reported issues

---

## Testing Strategy

### Test Pyramid
```
                     ▲
                    ╱ ╲
                   ╱   ╲
                  ╱ E2E ╲          1 test
                 ╱───────╲         (Manual verification)
                ╱         ╲
               ╱Integration╲       4 tests
              ╱─────────────╲      (Full sync flow)
             ╱               ╲
            ╱      Unit       ╲    20+ tests
           ╱───────────────────╲   (Transformer methods)
          ╱                     ╲
         ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
```

### Coverage Targets
- Transformer methods: 95%+
- ServerDataSyncService: 90%+
- Integration paths: 100%
- Overall: 90%+

---

## Questions & Answers

### Q: Why not filter in the database query?
**A**: We could, but:
1. RLS policies already control access
2. `is_active` is app-level logic, not security
3. Centralized filtering is easier to test/maintain
4. Allows admin tools to see inactive records

### Q: Why keep API-level filtering?
**A**: Defense in depth:
1. API endpoints might be called directly
2. Provides safety net if sync service fails
3. Minimal overhead (already transformed)

### Q: What if is_active is undefined?
**A**: Treated as active (defaultValue: true)
1. Backward compatible
2. Fail-open is safer than fail-closed
3. Explicit `false` required to hide

### Q: Performance impact of extra filtering?
**A**: Net positive:
1. Filter happens once (at sync)
2. Cache is smaller (faster reads)
3. Services skip redundant filtering
4. UI renders fewer items

---

**Summary**: This architecture change unifies active status filtering in a single location, improving consistency, performance, and maintainability while reducing code duplication.

---

*Visual reference for ADR: Active Status Filtering Unification*

