# Unify Data Sync Methods for Login and Retry

## Problem

Currently, the app uses two different methods to fetch data:

- **Login**: Uses `serverDataSyncService.syncAllData()` with direct Supabase connections (works)
- **Retry**: Uses API endpoints in `dataService.ts` that require service role keys (fails with 500 errors)

This creates maintenance issues because data processing (filtering, transformation) happens in multiple places.

## Solution

Make retry operations reuse the same `serverDataSyncService.syncAllData()` method that login uses, ensuring:

- Single source of truth for data fetching
- Consistent data processing (filtering confidential data, transformations)
- No dependency on API endpoints or service role keys
- Easier maintenance

## Implementation Steps

### 1. Extract Transformation Logic into Private Method

**File**: `src/services/serverDataSyncService.ts`

Add a private method to handle all transformations and filtering (eliminates duplication):

```typescript
/**
 * Apply data transformations and filtering for specific tables
 * @param tableName - Name of table
 * @param records - Raw records from database
 * @returns Transformed and filtered records
 */
private async applyTransformations(tableName: string, records: any[]): Promise<any[]> {
  // Agenda items transformation
  if (tableName === 'agenda_items') {
    const { AgendaTransformer } = await import('../transformers/agendaTransformer.js');
    const agendaTransformer = new AgendaTransformer();
    records = agendaTransformer.transformArrayFromDatabase(records);
    records = agendaTransformer.sortAgendaItems(records);
  }
  
  // Dining options transformation
  if (tableName === 'dining_options') {
    const { DiningTransformer } = await import('../transformers/diningTransformer.js');
    const diningTransformer = new DiningTransformer();
    records = diningTransformer.transformArrayFromDatabase(records);
    records = diningTransformer.filterActiveDiningOptions(records);
    records = diningTransformer.sortDiningOptions(records);
  }
  
  // Sponsors and hotels filtering/sorting
  if (tableName === 'sponsors' || tableName === 'hotels') {
    records = records
      .filter(r => r.is_active !== false)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
  
  return records;
}
```

### 2. Update syncAllData() to Use applyTransformations()

**File**: `src/services/serverDataSyncService.ts`

Update the existing `syncAllData()` method to use the new `applyTransformations()` method (eliminates duplication):

```typescript
// In syncAllData() method, replace lines 126-139 with:
let records = data || [];

// Apply transformations using shared method
records = await this.applyTransformations(tableName, records);

// Cache the data (includes filtering for attendees)
await this.cacheTableData(tableName, records);
```

### 3. Add Individual Table Sync Methods to ServerDataSyncService

**File**: `src/services/serverDataSyncService.ts`

Add public methods to sync individual tables using the shared transformation logic:

```typescript
/**
 * Sync a single table and return the data
 * @param tableName - Name of table to sync
 * @returns Synced and processed data
 */
async syncTable(tableName: string): Promise<any[]> {
  try {
    const supabaseClient = await this.getAuthenticatedClient();
    
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*');
    
    if (error) {
      throw new Error(`Failed to sync ${tableName}: ${error.message}`);
    }
    
    let records = data || [];
    
    // Apply transformations using shared method
    records = await this.applyTransformations(tableName, records);
    
    // Cache the data (includes filtering for attendees)
    await this.cacheTableData(tableName, records);
    
    return records;
  } catch (error) {
    console.error(`Failed to sync ${tableName}:`, error);
    throw error;
  }
}

/**
 * Sync attendees table specifically
 */
async syncAttendees(): Promise<any[]> {
  return this.syncTable('attendees');
}

/**
 * Sync dining options table specifically
 */
async syncDiningOptions(): Promise<any[]> {
  return this.syncTable('dining_options');
}

/**
 * Sync sponsors table specifically
 */
async syncSponsors(): Promise<any[]> {
  return this.syncTable('sponsors');
}

/**
 * Sync hotels table specifically
 */
async syncHotels(): Promise<any[]> {
  return this.syncTable('hotels');
}

/**
 * Sync seating configurations table specifically
 */
async syncSeatingConfigurations(): Promise<any[]> {
  return this.syncTable('seating_configurations');
}

/**
 * Sync agenda items table specifically
 */
async syncAgendaItems(): Promise<any[]> {
  return this.syncTable('agenda_items');
}
```

### 4. Update dataService.ts to Use ServerDataSyncService

**File**: `src/services/dataService.ts`

Replace API calls with serverDataSyncService calls:

**For `getAllAttendees()` (line 75-104):**

```typescript
// BEFORE (lines 94-99):
// FALLBACK: API call if no cached data exists
console.log('🌐 API: No cached data found, fetching from API...')
const data = await apiGet<Attendee[]>('/api/attendees')
console.log('🌐 API: Fetched', data.length, 'attendees from API')
// Ensure stable ordering for UI
return [...data].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))

// AFTER:
// FALLBACK: Sync from database using same method as login
console.log('🌐 SYNC: No cached data found, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncAttendees()
console.log('🌐 SYNC: Synced', data.length, 'attendees from database')
// Data is already filtered and cached by syncAttendees()
return [...data].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
```

**For `getCurrentAttendeeData()` (line 110-180):**

```typescript
// BEFORE (lines 149-174):
// FALLBACK: Use same API endpoint as login for consistency
try {
  console.log('🌐 API FALLBACK: No cached data found, fetching from API...')
  const allAttendees = await apiGet<Attendee[]>('/api/attendees')
  // ... rest of logic
} catch (apiError) {
  console.warn('🌐 API ERROR:', apiError)
}

// AFTER:
// FALLBACK: Sync from database using same method as login
try {
  console.log('🌐 SYNC FALLBACK: No cached data found, syncing from database...')
  const { serverDataSyncService } = await import('./serverDataSyncService')
  const allAttendees = await serverDataSyncService.syncAttendees()
  console.log('🌐 SYNC FALLBACK: Synced', allAttendees.length, 'attendees')
  // Data is already filtered and cached by syncAttendees()
  
  if (Array.isArray(allAttendees)) {
    const attendee = allAttendees.find(a => a.id === current.id)
    if (attendee) {
      console.log('🌐 SYNC SUCCESS: Found attendee')
      return attendee
    }
  }
} catch (syncError) {
  console.warn('🌐 SYNC ERROR:', syncError)
}
```

**For `getAllDiningOptions()` (line 321-334):**

```typescript
// BEFORE (lines 325-329):
const data = await apiGet<DiningOption[]>('/api/dining-options')
return [...data]
  .filter(d => (d as any).is_active !== false)
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

// AFTER:
// Use same sync method as login
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncDiningOptions()
// Data is already filtered and sorted by syncDiningOptions()
return data
```

### 5. Add localStorage-First Pattern to getAllDiningOptions

**File**: `src/services/dataService.ts` (line 321-334)

Add localStorage check before syncing (matching pattern used for attendees):

```typescript
export const getAllDiningOptions = async (): Promise<DiningOption[]> => {
  requireAuthentication()
  
  try {
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_dining_options')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const diningOptions = cacheObj.data || cacheObj
        if (Array.isArray(diningOptions) && diningOptions.length > 0) {
          console.log('✅ LOCALSTORAGE: Using cached dining options')
          return diningOptions
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached dining options:', cacheError)
    }
    
    // FALLBACK: Sync from database using same method as login
    console.log('🌐 SYNC: No cached dining options, syncing from database...')
    const { serverDataSyncService } = await import('./serverDataSyncService')
    const data = await serverDataSyncService.syncDiningOptions()
    return data
  } catch (error) {
    console.error('❌ Error fetching dining options:', error)
    throw new DataServiceError('Failed to fetch dining options', 'FETCH_ERROR')
  }
}
```

### 6. Update All Other Data Fetching Functions

**File**: `src/services/dataService.ts`

Replace ALL remaining API calls with sync service calls:

**For `getAllAgendaItems()` (line 189-218):**

```typescript
// BEFORE (lines 210-213):
// FALLBACK: API call if no cached data exists
console.log('🌐 No cached agenda items found, fetching from API...')
const data = await apiGet<AgendaItem[]>('/api/agenda-items')
return [...data]

// AFTER:
// FALLBACK: Sync from database using same method as login
console.log('🌐 SYNC: No cached agenda items, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncTable('agenda_items')
return data
```

**For `getAllSponsors()` (line 249-280):**

```typescript
// BEFORE (lines 271-274):
// FALLBACK: API call if no cached data exists
console.log('🌐 No cached sponsors found, fetching from API...')
const data = await apiGet<Sponsor[]>('/api/sponsors')
return [...data]

// AFTER:
// FALLBACK: Sync from database using same method as login
console.log('🌐 SYNC: No cached sponsors, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncTable('sponsors')
return data
```

**For `getAllHotels()` (line 357-369):**

```typescript
// BEFORE (lines 361-364):
const data = await apiGet<Hotel[]>('/api/hotels')
return [...data]
  .filter(h => (h as any).is_active !== false)
  .sort((a, b) => ((a as any).display_order ?? 0) - ((b as any).display_order ?? 0))

// AFTER:
// Add localStorage-first pattern, then sync if needed
try {
  const cachedData = localStorage.getItem('kn_cache_hotels')
  if (cachedData) {
    const cacheObj = JSON.parse(cachedData)
    const hotels = cacheObj.data || cacheObj
    if (Array.isArray(hotels) && hotels.length > 0) {
      console.log('✅ LOCALSTORAGE: Using cached hotels')
      return hotels
    }
  }
} catch (cacheError) {
  console.warn('⚠️ Failed to load cached hotels:', cacheError)
}

console.log('🌐 SYNC: No cached hotels, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncTable('hotels')
return data
```

**For `getAllSeatingConfigurations()` (line 394-404):**

```typescript
// BEFORE (lines 398-399):
const data = await apiGet<any[]>('/api/seating-configurations')
return data

// AFTER:
// Add localStorage-first pattern, then sync if needed
try {
  const cachedData = localStorage.getItem('kn_cache_seating_configurations')
  if (cachedData) {
    const cacheObj = JSON.parse(cachedData)
    const configs = cacheObj.data || cacheObj
    if (Array.isArray(configs) && configs.length > 0) {
      console.log('✅ LOCALSTORAGE: Using cached seating configurations')
      return configs
    }
  }
} catch (cacheError) {
  console.warn('⚠️ Failed to load cached seating configurations:', cacheError)
}

console.log('🌐 SYNC: No cached seating configurations, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
const data = await serverDataSyncService.syncTable('seating_configurations')
return data
```

### 7. Fix Personalized Data Functions

**File**: `src/services/dataService.ts`

**For `getAttendeeSeatAssignments()` (line 288-314):**

```typescript
// BEFORE (lines 306-310):
// FALLBACK: API call if no cached data exists
console.log('🌐 API: No cached seat assignments found, fetching from API...')
const data = await apiGet<SeatAssignment[]>(`/api/attendees/${attendeeId}/seat-assignments`)
console.log('🌐 API: Fetched', data.length, 'seat assignments from API for attendee', attendeeId)
return data

// AFTER:
// FALLBACK: Sync seat_assignments table if cache is empty
console.log('🌐 SYNC: No cached seat assignments, syncing from database...')
const { serverDataSyncService } = await import('./serverDataSyncService')
await serverDataSyncService.syncTable('seat_assignments')
// Re-read from cache after sync
const cachedData = localStorage.getItem('kn_cache_seat_assignments')
if (cachedData) {
  const cacheObj = JSON.parse(cachedData)
  const seatAssignments = cacheObj.data || cacheObj
  return seatAssignments.filter((seat: SeatAssignment) => seat.attendee_id === attendeeId)
}
return []
```

**For `getAttendeeSelectedAgendaItems()` (line 225-243):**

```typescript
// BEFORE:
const attendee = await apiGet<{ selected_breakouts?: string[] }>(`/api/attendees/${attendeeId}`)
const selected = Array.isArray(attendee?.selected_breakouts) ? attendee.selected_breakouts : []
if (selected.length === 0) return []
const all = await apiGet<AgendaItem[]>('/api/agenda-items')

// AFTER (use direct calls, not imports):
const allAttendees = await getAllAttendees() // Direct call
const attendee = allAttendees.find(a => a.id === attendeeId)
const selected = Array.isArray(attendee?.selected_breakouts) ? attendee.selected_breakouts : []
if (selected.length === 0) return []
const all = await getAllAgendaItems() // Direct call
return all
  .filter(item => selected.includes(item.id as unknown as string))
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
```

**For `getAttendeeHotelSelection()` (line 376-388):**

```typescript
// BEFORE:
const attendee = await apiGet<{ hotel_selection?: string }>(`/api/attendees/${attendeeId}`)
if (!attendee?.hotel_selection) return null
const hotel = await apiGet<Hotel>(`/api/hotels/${attendee.hotel_selection}`)

// AFTER (use direct calls):
const allAttendees = await getAllAttendees() // Direct call
const attendee = allAttendees.find(a => a.id === attendeeId)
if (!attendee?.hotel_selection) return null
const allHotels = await getAllHotels() // Direct call
const hotel = allHotels.find(h => h.id === attendee.hotel_selection)
return hotel || null
```

**For `getAttendeeDiningSelections()` (line 341-351):**

```typescript
// NOTE: This function appears to fetch personalized dining selections
// Since there's no API endpoint for this, it should be removed or 
// reimplemented to use the attendee's dining preferences from cached data
// RECOMMENDATION: Check if this function is actually used, if not, mark as deprecated
```

### 8. Update Architecture Documentation

**File**: `docs/architecture/current-issues-status.md`

Update Issue #2 status:

```markdown
### 3. API 500 Errors (RESOLVED)

**Problem:** `GET /api/attendees 500 (Internal Server Error)`
**Root Cause:** Retry operations used API endpoints instead of direct Supabase connections
**Impact:** Medium - API fallback failed, but localStorage cache worked
**Status:** RESOLVED - Retry now uses same sync method as login
**Action Taken:** Refactored dataService.ts to reuse serverDataSyncService

**Resolution:**
- Eliminated dependency on API endpoints
- Retry operations now use serverDataSyncService.syncTable()
- Consistent data processing (filtering, transformation) in one place
- No service role keys needed
```

## Benefits

1. **Single Source of Truth**: All data processing happens in serverDataSyncService
2. **Consistent Filtering**: Confidential data filtering happens once, in one place
3. **Consistent Transformation**: Data transformations (AgendaTransformer, DiningTransformer) applied consistently
4. **No API Dependencies**: No need for service role keys or API endpoints
5. **Easier Maintenance**: Changes to data processing only need to be made in one location
6. **Architecture Compliance**: Both login and retry use the same localStorage-first pattern

## Testing

After implementation:

1. Clear localStorage
2. Log in (should work as before)
3. Clear localStorage again
4. Navigate to a page that triggers data fetch
5. Verify data loads without 500 errors
6. Verify confidential data is filtered
7. Check console logs for "SYNC" messages instead of "API" messages

## Files Changed

- `src/services/serverDataSyncService.ts` - Add applyTransformations(), syncTable(), and convenience methods for all tables
- `src/services/dataService.ts` - Replace ALL API calls with sync service calls (13 locations)
- `docs/architecture/current-issues-status.md` - Update Issue #2 status

## Summary of Changes

**API Calls Being Replaced (13 total):**

1. `/api/attendees` (2 locations) - getAllAttendees(), getCurrentAttendeeData()
2. `/api/dining-options` (1 location) - getAllDiningOptions()
3. `/api/agenda-items` (2 locations) - getAllAgendaItems(), getAttendeeSelectedAgendaItems()
4. `/api/sponsors` (1 location) - getAllSponsors()
5. `/api/hotels` (2 locations) - getAllHotels(), getAttendeeHotelSelection()
6. `/api/seating-configurations` (1 location) - getAllSeatingConfigurations()
7. `/api/attendees/{id}` (2 locations) - getAttendeeSelectedAgendaItems(), getAttendeeHotelSelection()
8. `/api/attendees/{id}/seat-assignments` (1 location) - getAttendeeSeatAssignments()
9. `/api/attendees/{id}/dining-selections` (1 location) - getAttendeeDiningSelections()

**All replaced with:** Direct Supabase connections via serverDataSyncService (same as login)

### To-dos

- [ ] Add applyTransformations() private method to serverDataSyncService.ts
- [ ] Update syncAllData() to use applyTransformations() method
- [ ] Add syncTable() and convenience methods to serverDataSyncService.ts
- [ ] Update getAllAttendees() to use serverDataSyncService instead of API
- [ ] Update getCurrentAttendeeData() to use serverDataSyncService instead of API
- [ ] Update getAllDiningOptions() to use serverDataSyncService with localStorage-first pattern
- [ ] Update getAllAgendaItems() to use serverDataSyncService instead of API
- [ ] Update getAllSponsors() to use serverDataSyncService instead of API
- [ ] Update getAllHotels() to use serverDataSyncService with localStorage-first pattern
- [ ] Update getAllSeatingConfigurations() to use serverDataSyncService with localStorage-first pattern
- [ ] Fix getAttendeeSeatAssignments() to sync seat_assignments table instead of API
- [ ] Fix getAttendeeSelectedAgendaItems() to use direct function calls instead of self-imports
- [ ] Fix getAttendeeHotelSelection() to use direct function calls instead of API
- [ ] Review getAttendeeDiningSelections() for deprecation or reimplementation
- [ ] Update architecture documentation to mark API 500 errors as resolved
- [ ] Test that retry operations work without API endpoints and data is properly filtered
