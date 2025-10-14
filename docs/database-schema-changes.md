# Database Schema Changes Analysis

**Generated:** 2025-01-27  
**Source:** Local cache data analysis vs current TypeScript interfaces  
**Purpose:** Document schema changes that have occurred in production database

## 🚨 **CRITICAL CHANGES IDENTIFIED**

### **1. SeatAssignments Table - NEW FIELDS ADDED**

**New Fields:**
- ✅ `is_blocked: boolean` - Whether seat assignment is blocked
- ✅ `is_pending_review: boolean` - Whether assignment is pending review

**Field Type Changes:**
- `table_name: string | null` - Now nullable (was `string`)
- `seat_number: number | null` - Now nullable (was `number`)

**Current Status:** ✅ **UPDATED** in `src/types/seating.ts`

---

### **2. SeatingConfigurations Table - MAJOR EXPANSION**

**New Fields Added:**
- ✅ `configuration_status: string` - Status like "configured"
- ✅ `weightings: any` - Weightings object (empty `{}`)
- ✅ `algorithm_status: string` - Status like "idle"
- ✅ `algorithm_job_id: string | null` - Algorithm job ID (null)
- ✅ `algorithm_results: any` - Algorithm results object (empty `{}`)
- ✅ `parent_configuration_id: string | null` - Parent configuration ID (null)
- ✅ `copy_type: string | null` - Copy type (null)
- ✅ `is_master: boolean` - Whether this is master configuration (false)
- ✅ `last_synced_at: string | null` - Last synced timestamp (null)

**Current Status:** ✅ **UPDATED** in `src/types/seating.ts`

---

### **3. LayoutConfig Structure - COMPLETELY CHANGED**

**OLD Structure (Grid-based):**
```typescript
interface LayoutConfig {
  rows: number
  aisles: any[]
  columns: number
  seatSpacing: { vertical: number; horizontal: number }
  sectionDivider: number
  unavailableSeats: any[]
}
```

**NEW Structure (Table-based):**
```typescript
interface LayoutConfig {
  tables: Array<{
    name: string           // e.g., "Table 1: VIP CEOs"
    shape: string          // e.g., "rectangle-horizontal", "round"
    capacity: number       // e.g., 12
    position: { x: number; y: number }
  }>
  layout_type: string      // "table"
}
```

**Table Shapes Used:**
- `rectangle-horizontal`
- `rectangle-vertical`
- `round`

**Current Status:** ✅ **UPDATED** in `src/types/seating.ts`

---

### **4. Agenda Items - NO CHANGES**

**Speaker Field Analysis:**
- ✅ Uses `speaker: object | null` (not `speaker_name`)
- ✅ Has computed field `speakerInfo: string`
- ✅ Current TypeScript interface is correct

**Current Status:** ✅ **NO CHANGES NEEDED**

---

### **5. Dining Options - NO CHANGES**

**Field Analysis:**
- ✅ All fields match current TypeScript interface
- ✅ No new fields detected

**Current Status:** ✅ **NO CHANGES NEEDED**

---

## 📋 **SUMMARY OF UPDATES MADE**

### **Files Updated:**
1. ✅ `src/types/seating.ts` - Updated with all new fields

### **Key Changes:**
1. **SeatAssignment Interface:**
   - Added `is_blocked: boolean`
   - Added `is_pending_review: boolean`
   - Made `table_name` and `seat_number` nullable

2. **SeatingConfiguration Interface:**
   - Added 8 new fields for algorithm management
   - Added master/copy configuration support
   - Added sync tracking

3. **LayoutConfig Interface:**
   - Completely restructured for table-based layouts
   - Removed grid-based fields
   - Added table array with shapes and positions

---

## 🔍 **VERIFICATION NEEDED**

### **Database Connection Required:**
To verify these changes are current, run:
```bash
node scripts/quick-db-inspection.js
```

### **API Testing Required:**
Test the updated interfaces with:
- Seat assignment creation/updates
- Seating configuration management
- Layout configuration handling

---

## 🚀 **NEXT STEPS**

1. **Test Updated Interfaces:**
   - Verify all new fields work with API calls
   - Test seat assignment blocking/review functionality
   - Test table-based layout configuration

2. **Update Services:**
   - Update `SeatAssignmentService` to handle new fields
   - Update `SeatingConfigurationService` for new algorithm fields
   - Update layout management for table-based configurations

3. **Update UI Components:**
   - Add UI for blocking/reviewing seat assignments
   - Update seating chart to handle table-based layouts
   - Add algorithm status indicators

---

## 📊 **IMPACT ASSESSMENT**

### **High Impact:**
- Layout configuration structure change affects all seating charts
- New algorithm fields suggest automated seating assignment features

### **Medium Impact:**
- Seat assignment blocking/review affects admin workflows
- Master/copy configuration affects multi-event management

### **Low Impact:**
- Additional metadata fields for tracking and sync

---

*This analysis is based on local cache data from 2025-01-27. Verify with live database before implementing changes.*
