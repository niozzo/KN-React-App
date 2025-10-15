# Data Relationship Analysis: Seat Assignment Display

## 🔍 Complete Data Flow for Event `4c057931-0223-491f-8a7f-ba232bc2a95c`

### Entity Relationship Chain

```
AGENDA ITEM → SEATING CONFIGURATION → SEAT ASSIGNMENT → ATTENDEE
```

---

## 📊 Step-by-Step Data Trace for "Opening Remarks"

### Step 1: Agenda Item
**Source:** `kn_cache_agenda_items.json`

```json
{
  "id": "4c057931-0223-491f-8a7f-ba232bc2a95c",
  "title": "Opening Remarks & Apax CEO Welcome | The Grand Ballroom, 8th Floor",
  "seating_type": "assigned",
  "has_seating": false  // ⚠️ Misleading, but has config via bridge table
  // ❌ MISSING: Direct seating_configuration_id reference
}
```

### Step 2: Seating Configuration (THE BRIDGE)
**Source:** `kn_cache_seating_configurations.ts`

```json
{
  "id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",  // ← Links to seat_assignments
  "agenda_item_id": "4c057931-0223-491f-8a7f-ba232bc2a95c",  // ← Links to agenda_items
  "dining_option_id": null,
  "has_seating": true,
  "seating_type": "assigned",
  "layout_type": "classroom",
  "configuration_status": "configured"
}
```

### Step 3: Seat Assignment
**Source:** `kn_cache_seat_assignments.json`

```json
{
  "id": "a351866f-95b2-4f41-b17d-666b5c18ec89",
  "seating_configuration_id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",  // ← Matches Step 2
  "attendee_id": "a02d7632-590f-4919-8def-63707244cdbd",  // ← Dave Burgess
  "row_number": ?,  // In full data
  "column_number": ?,  // In full data
  "attendee_first_name": "Dave",
  "attendee_last_name": "Burgess"
}
```

### Step 4: Attendee
**Source:** `conference_auth.json`

```json
{
  "id": "a02d7632-590f-4919-8def-63707244cdbd",
  "first_name": "Dave",
  "last_name": "Burgess",
  "title": "Principal",
  "company": "Apax"
}
```

---

## 🏗️ Complete Relationship Map

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENDA ITEMS (kn_cache_agenda_items)                           │
│ • id: 4c057931-0223-491f-8a7f-ba232bc2a95c                     │
│ • title: "Opening Remarks & Apax CEO Welcome"                  │
│ • seating_type: "assigned"                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ ❌ NO DIRECT LINK!
                         │ Must go through bridge table ↓
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ SEATING CONFIGURATIONS (kn_cache_seating_configurations)       │
│ • id: b890ef94-3cdd-4c30-982d-884a1cec4bd5    ←─────┐         │
│ • agenda_item_id: 4c057931... (links to agenda)     │         │
│ • dining_option_id: null                             │         │
│ • has_seating: true                                  │         │
└──────────────────────────────────────────────────────┼─────────┘
                                                       │
                                                       │ Link via
                                                       │ seating_configuration_id
                                                       │
┌──────────────────────────────────────────────────────▼─────────┐
│ SEAT ASSIGNMENTS (kn_cache_seat_assignments)                   │
│ • id: a351866f-95b2-4f41-b17d-666b5c18ec89                    │
│ • seating_configuration_id: b890ef94... (matches above)       │
│ • attendee_id: a02d7632... (Dave Burgess)                     │
│ • row_number: X                                                │
│ • column_number: Y                                             │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ Link via attendee_id
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│ ATTENDEE (conference_auth)                                     │
│ • id: a02d7632-590f-4919-8def-63707244cdbd                    │
│ • first_name: "Dave"                                           │
│ • last_name: "Burgess"                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Solution: Join Logic Required

Since `agenda_items` doesn't have a direct `seating_configuration_id` field, we need to:

### ARCHITECTURAL DECISION: Agenda Items as Source of Truth
**Decision Date:** 2025-10-15  
**Status:** Implemented  
**Rationale:** Agenda items represent the actual events and their requirements, making them the logical source of truth for seating requirements.

### For Agenda Items:
```javascript
// 1. Get agenda item (SOURCE OF TRUTH for seating type)
const agendaItem = { 
  id: "4c057931-0223-491f-8a7f-ba232bc2a95c", 
  seating_type: "assigned",  // ← This determines behavior
  ... 
}

// 2. Find its seating configuration (for layout/assignments only)
const seatingConfig = seatingConfigurations.find(
  config => config.agenda_item_id === agendaItem.id
)
// Result: { id: "b890ef94-3cdd-4c30-982d-884a1cec4bd5", ... }

// 3. Find seat assignment for this attendee
const seatAssignment = seatAssignments.find(
  seat => seat.seating_configuration_id === seatingConfig.id 
       && seat.attendee_id === currentAttendeeId
)
// Result: { row_number: X, column_number: Y, ... }

// 4. Display logic based on agenda item seating type
if (agendaItem.seating_type === 'assigned') {
  if (seatAssignment) {
    // Show seat assignment
  } else {
    // Show "Assignment pending"
  }
} else {
  // Show "Open seating"
}
```

### For Dining Events:
```javascript
// 1. Get dining option
const diningOption = { id: "75d3f99a-3383-49a9-bc77-0328ece9df6c", ... }

// 2. Find its seating configuration
const seatingConfig = seatingConfigurations.find(
  config => config.dining_option_id === diningOption.id
)
// Result: { id: "7b0bf62f-970b-4b9c-a84c-fa4527243389", ... }

// 3. Find seat assignment (same as above)
```

---

## ✅ Data Verification: Dave Burgess Has 5 Seat Assignments

Dave's `seating_configuration_id` values from `seat_assignments`:
1. `0877d696-ebbc-4aa6-bcf6-9145857557ef`
2. `c4df64c7-e952-435f-967a-0d4303aa55f4`
3. `2069f9e1-fafb-4eb8-9cd5-8b2c83516c5b`
4. `b890ef94-3cdd-4c30-982d-884a1cec4bd5` ← **Opening Remarks!**
5. `f74ff9f7-1527-4d0d-bd40-6f4531eddc3b`

**Confirmed:** Dave DOES have a seat for the "Opening Remarks" event!

---

## 📋 Implementation Requirements

### Cache Files Needed:
- ✅ `kn_cache_agenda_items` - Agenda events
- ✅ `kn_cache_dining_options` - Dining events
- ✅ `kn_cache_seating_configurations` - **BRIDGE TABLE** (Currently missing from cache!)
- ✅ `kn_cache_seat_assignments` - Individual seat assignments
- ✅ `conference_auth` - Current attendee info

### Missing Cache:
**⚠️ The `kn_cache_seating_configurations` table is NOT being cached on login!**

This is why the seat assignments aren't showing up - the code can't bridge from agenda items to seat assignments without the configurations table.

---

## 🎯 Fix Required

**Add to initial data sync (authService.ts or similar):**

```typescript
// During login, after syncing other tables:
await serverDataSyncService.syncTable('seating_configurations')
```

Then in `useSessionData.js`, update the enhancement logic:

```javascript
// Load seating_configurations from cache
const seatingConfigs = JSON.parse(
  localStorage.getItem('kn_cache_seating_configurations')
)?.data || []

// For agenda items:
const enhanceEventWithSeatInfo = (event) => {
  // ARCHITECTURAL DECISION: Agenda item seating_type is source of truth
  if (event.seating_type === 'assigned') {
    // Find the seating configuration for this event
    const seatingConfig = seatingConfigs.find(
      config => config.agenda_item_id === event.id
    )
    
    if (!seatingConfig) return event
    
    // Find seat assignment
    const seatAssignment = seatAssignments.find(seat => 
      seat.seating_configuration_id === seatingConfig.id
    )
    
    return {
      ...event,
      seatInfo: seatAssignment ? {
        table: seatAssignment.table_name,
        seat: seatAssignment.seat_number,
        row: seatAssignment.row_number,
        column: seatAssignment.column_number,
        position: seatAssignment.seat_position
      } : null
    }
  } else {
    // For open seating, don't look for assignments
    return event
  }
}
```

---

## 📊 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Data Exists | ✅ Yes | Dave has seat for Opening Remarks |
| Relationship Mapped | ✅ Yes | Via seating_configurations bridge |
| Cache Populated | ❌ No | seating_configurations not cached |
| Code Implemented | ❌ No | Missing bridge table logic |

**Root Cause:** The `seating_configurations` table acts as a bridge but isn't being cached, so the code can't link agenda items to seat assignments.

**Fix:** Cache `seating_configurations` table and update join logic in `useSessionData.js`.

