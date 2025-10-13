# Story 8.7: Company Name Normalization - Architectural Review

**Reviewer:** Winston (Architect) 🏗️  
**Date:** 2025-10-13  
**Story:** 8.7 - Company Name Normalization via Application-Side Transformation  
**Status:** ⚠️ **NEEDS CLARIFICATIONS** - Mostly compliant with minor issues

---

## Executive Summary

Story 8.7 proposes adding company name normalization via application-side transformation. The approach is **generally sound** and follows most architectural principles, but requires **3 critical clarifications** regarding caching strategy, confidential data boundaries, and service layer patterns.

**Overall Assessment:** ✅ **APPROVED WITH MODIFICATIONS**

---

## ✅ COMPLIANT AREAS

### 1. ✅ Read-Only Database Access
**Status:** FULLY COMPLIANT

The story correctly:
- ✅ Loads `standardized_companies` and `company_aliases` tables (read-only)
- ✅ Never modifies database data
- ✅ Operates entirely at application layer
- ✅ Respects the "cannot modify main database" constraint

**Architecture Compliance:** ✅ **PERFECT**

```typescript
// Story correctly specifies read-only access
"Service that loads and caches standardized_companies and company_aliases tables"
```

---

### 2. ✅ Transformer Pattern Usage
**Status:** FULLY COMPLIANT

The story correctly:
- ✅ Leverages existing `AttendeeTransformer` computed fields pattern
- ✅ Follows `BaseTransformer<T>` architecture
- ✅ Uses `ComputedField` type from existing patterns
- ✅ Preserves original `attendee.company` field

**Architecture Reference:**
```typescript
// Existing pattern (lines 52-75 in attendeeTransformer.ts)
const computedFields: ComputedField[] = [
  { name: 'fullName', sourceFields: ['first_name', 'last_name'], ... },
  { name: 'displayName', sourceFields: ['first_name', 'last_name', 'company'], ... }
]

// Story proposes (CORRECT):
{
  name: 'companyStandardized',
  sourceFields: ['company'],
  computation: (data: any) => {
    const service = CompanyNormalizationService.getInstance()
    return service.normalizeCompanyName(data.company)
  },
  type: 'object'
}
```

**Architecture Compliance:** ✅ **EXCELLENT**

---

### 3. ✅ Type Safety
**Status:** FULLY COMPLIANT

The story correctly:
- ✅ Defines new `StandardizedCompany` interface
- ✅ Extends `Attendee` interface with optional computed fields
- ✅ Uses proper TypeScript patterns
- ✅ Follows existing type definition structure

**Architecture Compliance:** ✅ **PERFECT**

---

### 4. ✅ Service Layer Pattern
**Status:** MOSTLY COMPLIANT (needs clarification on inheritance)

The story correctly:
- ✅ Creates dedicated `CompanyNormalizationService`
- ✅ Uses singleton pattern for caching
- ✅ Separates concerns properly
- ⚠️ **NEEDS CLARIFICATION:** Should extend `BaseService` like other services

**Recommendation:**
```typescript
// Add to Task 2:
export class CompanyNormalizationService extends BaseService {
  // ... implementation
}
```

**Architecture Compliance:** ✅ **GOOD** (with minor enhancement)

---

## ⚠️ CRITICAL ISSUES REQUIRING CLARIFICATION

### ⚠️ ISSUE 1: Caching Strategy - NOT localStorage

**Problem:** Story mentions "caching" but doesn't clearly specify that company data should be **IN-MEMORY ONLY**, not localStorage.

**Your Architecture Rules:**
- ✅ localStorage is for **filtered attendee data only** (per Story 2.2.4)
- ✅ Reference data (companies) should be in-memory caches
- ❌ Company lookup data should **NOT** go to localStorage

**Current Story Text (Ambiguous):**
```
AC 1: "Service provides O(1) lookup to resolve company name → standardized company"
AC 1: "Cache is loaded on service initialization and refreshed periodically"
```

**Required Clarification:**

Add to **Acceptance Criteria #1:**
```diff
1. **Service Layer - Company Normalization Service**
   - Create `CompanyNormalizationService.ts` that loads and caches `standardized_companies` and `company_aliases` tables
+  - ⚠️ CRITICAL: Cache is IN-MEMORY ONLY (private class properties), NOT localStorage
+  - Rationale: localStorage is reserved for filtered attendee data per security architecture
   - Service provides O(1) lookup to resolve company name → standardized company
   - Cache is loaded on service initialization and refreshed periodically
```

Add to **Implementation Notes:**
```typescript
export class CompanyNormalizationService extends BaseService {
  // ✅ CORRECT: In-memory caching
  private standardizedMap: Map<string, StandardizedCompany> = new Map();
  private aliasMap: Map<string, StandardizedCompany> = new Map();
  
  // ❌ INCORRECT: Do NOT use localStorage for company lookup data
  // localStorage.setItem('kn_company_cache', ...) // NEVER DO THIS
}
```

**Architecture Compliance:** ⚠️ **NEEDS CLARIFICATION**

---

### ⚠️ ISSUE 2: No Confidential Data in Company Tables

**Problem:** Story correctly caches company data, but doesn't explicitly confirm no confidential fields exist in these tables.

**Your Confidential Fields Policy:**
From `attendeeCacheFilterService.ts` (lines 54-91):
```typescript
const CONFIDENTIAL_FIELDS = [
  // Contact Information
  'business_phone', 'mobile_phone', 'email',
  // Travel & Accommodation
  'check_in_date', 'check_out_date', 'hotel_selection', 'custom_hotel', 'room_type',
  // Personal Details
  'has_spouse', 'dietary_requirements', 'is_spouse', 'spouse_details',
  // Address Information
  'address1', 'address2', 'postal_code', 'city', 'state', 'country', 'country_code',
  // Assistant Information
  'assistant_name', 'assistant_email',
  // System Identifiers
  'idloom_id', 'access_code'
]
```

**Company Tables to Cache:**
```typescript
// standardized_companies (93 rows)
{
  id, name, sector, geography, subsector,
  logo, website,
  is_parent_company, parent_company_id,
  seating_notes, priority_companies,
  fund_analytics_category, description,
  created_at, updated_at
}

// company_aliases (84 rows)
{
  id, alias, standardized_company_id,
  created_at, updated_at
}
```

**Verification:** ✅ **NO CONFIDENTIAL FIELDS** - All company table fields are safe reference data.

**Required Addition:**

Add to **Acceptance Criteria #5 - Data Integrity:**
```diff
5. **Data Integrity**
   - All 264 matched attendees (99.2%) automatically enriched with standardized company data
   - 2 unmatched attendees gracefully handled (display original company name)
   - No database modifications required
   - No changes to existing API contracts
+  - ✅ Company reference data contains NO confidential fields
+  - ✅ Company tables (standardized_companies, company_aliases) are safe for caching
+  - ✅ Service only caches public reference data (company names, sectors, geographies)
```

**Architecture Compliance:** ✅ **COMPLIANT** (but needs explicit confirmation)

---

### ⚠️ ISSUE 3: Computed Fields & Confidential Data Filtering

**Problem:** Need to ensure computed fields don't bypass existing confidential data filtering in `AttendeeTransformer`.

**Your Current Filtering:**
From `attendeeTransformer.ts` (lines 15-50):
```typescript
const fieldMappings: FieldMapping[] = [
  // Only SAFE_FIELDS are mapped (non-confidential fields)
  { source: 'company', target: 'company', type: 'string', defaultValue: '' },
  // ... other safe fields
]
// Note: Confidential fields are NOT mapped
```

**Story Proposes:**
```typescript
// New computed fields
companyStandardized: StandardizedCompany | null
companyDisplayName: string
companySector: string
companyGeography: string
```

**Risk Analysis:** ✅ **SAFE** - Computed fields derive from `attendee.company` (already safe) and company reference data (also safe).

**Required Confirmation:**

Add to **Task 4 - Extend AttendeeTransformer:**
```diff
- [ ] **Task 4: Extend AttendeeTransformer with Computed Fields** (AC: 2)
  - [ ] Update `src/transformers/attendeeTransformer.ts`
  - [ ] Add `companyStandardized` computed field to `computedFields` array
  - [ ] Add `companyDisplayName` computed field (canonical name or original)
  - [ ] Add `companySector` computed field (quick access to sector)
  - [ ] Add `companyGeography` computed field (quick access to geography)
  - [ ] Inject `CompanyNormalizationService` dependency
  - [ ] Ensure computed fields use cached lookups (no per-attendee DB queries)
+ - [ ] ✅ VERIFY: Computed fields only use safe source field (attendee.company)
+ - [ ] ✅ VERIFY: No confidential fields accessed or exposed in computed logic
+ - [ ] ✅ VERIFY: Company reference data contains no PII or confidential info
```

**Architecture Compliance:** ✅ **SAFE** (but needs explicit verification step)

---

## 📋 REQUIRED MODIFICATIONS TO STORY

### Modification 1: Clarify In-Memory Caching

**Location:** Acceptance Criteria #1, Task 2, Implementation Notes

**Add:**
```markdown
### Caching Architecture Clarification

**CRITICAL:** `CompanyNormalizationService` uses **IN-MEMORY caching ONLY**

- ✅ Store lookup maps in private class properties
- ✅ Use `Map<string, StandardizedCompany>` for O(1) lookups
- ❌ Do NOT use localStorage (reserved for filtered attendee data)
- ❌ Do NOT use sessionStorage
- ❌ Do NOT use IndexedDB

**Rationale:**
- Per Story 2.2.4, localStorage is for filtered attendee data only
- Company reference data is non-confidential but should not pollute cache
- In-memory caching provides same performance without localStorage overhead
- Cache refreshes on app reload (acceptable for reference data)

**Implementation:**
```typescript
export class CompanyNormalizationService extends BaseService {
  private static instance: CompanyNormalizationService;
  
  // ✅ CORRECT: In-memory caching
  private standardizedMap: Map<string, StandardizedCompany> = new Map();
  private aliasMap: Map<string, StandardizedCompany> = new Map();
  private initialized: boolean = false;
  
  async initialize(): Promise<void> {
    // Load from database
    const companies = await supabase.from('standardized_companies').select('*');
    const aliases = await supabase.from('company_aliases').select('*');
    
    // Build in-memory maps
    companies.data?.forEach(c => {
      this.standardizedMap.set(c.name.toLowerCase().trim(), c);
    });
    
    aliases.data?.forEach(a => {
      const company = companies.data?.find(c => c.id === a.standardized_company_id);
      if (company) {
        this.aliasMap.set(a.alias.toLowerCase().trim(), company);
      }
    });
    
    this.initialized = true;
  }
}
```
```

---

### Modification 2: Add Security Verification

**Location:** Task 6 - Testing

**Add test case:**
```diff
- [ ] **Task 6: Testing** (AC: 1, 2, 4, 5)
  - [ ] Unit tests for `CompanyNormalizationService`:
    - Test exact match lookup
    - Test alias match lookup
    - Test case-insensitive matching
    - Test whitespace trimming
    - Test graceful handling of unmatched companies
    - Test cache initialization and refresh
+   - ✅ Test no localStorage writes occur
+   - ✅ Test company data contains no confidential fields
  - [ ] Integration tests for `AttendeeTransformer`:
    - Test computed fields are populated correctly
    - Test original `company` field is preserved
    - Test all 3 match scenarios: exact, alias, unmatched
+   - ✅ Test computed fields don't expose confidential data
+   - ✅ Test existing confidential field filtering still works
```

---

### Modification 3: Update Dev Notes - Service Layer Pattern

**Location:** Dev Notes → Implementation Notes

**Add:**
```diff
1. **Service Initialization:**
   - Service should be singleton (single cache instance)
+  - Service extends BaseService for consistency
   - Initialize early in app lifecycle
   - Cache both `standardized_companies` and `company_aliases`
   - Build two lookup maps for fast O(1) access
+  - ✅ In-memory caching only (no localStorage)
```

---

## 🎯 FINAL ARCHITECTURE COMPLIANCE SCORECARD

| Category | Status | Notes |
|----------|--------|-------|
| **DB Access Rules** | ✅ COMPLIANT | Read-only, no modifications |
| **Confidential Data** | ✅ COMPLIANT | No confidential fields in company tables |
| **Caching Strategy** | ⚠️ NEEDS CLARIFICATION | Must specify in-memory only |
| **Transformer Pattern** | ✅ COMPLIANT | Correct use of computed fields |
| **Type Safety** | ✅ COMPLIANT | Proper TypeScript interfaces |
| **Service Layer** | ✅ COMPLIANT | Should extend BaseService |
| **Performance** | ✅ COMPLIANT | O(1) lookups, <100ms load time |
| **Security** | ✅ COMPLIANT | No PII, no confidential data exposure |
| **Testing** | ✅ COMPLIANT | Comprehensive test coverage |
| **Error Handling** | ✅ COMPLIANT | Graceful fallbacks |

---

## ✅ ARCHITECTURAL APPROVAL

**Decision:** ✅ **APPROVED WITH MODIFICATIONS**

**Required Changes:**
1. ⚠️ **CRITICAL:** Clarify in-memory caching (no localStorage) - **MUST FIX**
2. ✅ **RECOMMENDED:** Add explicit security verification tests
3. ✅ **RECOMMENDED:** Extend BaseService for consistency

**Once Modified:**
- ✅ Story follows all database access rules
- ✅ Story respects confidential data boundaries
- ✅ Story adheres to all architecture principles
- ✅ Ready for implementation

---

## 📝 IMPLEMENTATION CHECKLIST FOR DEV AGENT

Before starting implementation, verify:
- [ ] Read this architecture review
- [ ] Understand in-memory caching requirement (no localStorage)
- [ ] Confirm `CompanyNormalizationService extends BaseService`
- [ ] Add security verification tests
- [ ] Ensure computed fields don't bypass confidential filtering

---

**Reviewed By:** Winston 🏗️ (Architect)  
**Date:** 2025-10-13  
**Status:** Approved with modifications  
**Next Step:** PO to update story with clarifications, then proceed to implementation

