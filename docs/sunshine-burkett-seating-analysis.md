# Sunshine Burkett Seating Assignment Analysis

**Generated:** 2025-01-27  
**Purpose:** Analyze Sunshine Burkett's seat assignments for Opening Remarks and Maple & Ash dining

## 🎯 **SUMMARY**

**Sunshine Burkett** has **2 confirmed seat assignments**:

- ✅ **Opening Remarks**: **ASSIGNED** - Row 7, Column 8 (Classroom layout)
- ✅ **Maple & Ash Dining**: **ASSIGNED** - Table 1: VIP CEOs, Seat 11 (Table layout)

---

## 📋 **OPENING REMARKS ASSIGNMENT**

### **Event Details:**
- **Title**: "Opening Remarks & Apax CEO Welcome | The Grand Ballroom, 8th Floor"
- **Date**: 2025-10-21
- **Time**: 09:00:00 - 09:30:00
- **Location**: The Grand Ballroom, 8th Floor
- **Seating Type**: Assigned seating

### **Seating Configuration:**
- **Config ID**: `b890ef94-3cdd-4c30-982d-884a1cec4bd5`
- **Layout Type**: `classroom` (grid-based)
- **Configuration Status**: `configured`
- **Algorithm Status**: `idle`
- **Is Master**: `true`

### **Sunshine Burkett's Assignment:**
```json
{
  "id": "1f20f87f-d6a2-488c-88e4-a0df1313725d",
  "seating_configuration_id": "b890ef94-3cdd-4c30-982d-884a1cec4bd5",
  "attendee_id": "8a35ddb4-d59c-4ffd-a391-7a6b416c29ad",
  "table_name": null,
  "seat_number": null,
  "seat_position": {
    "x": 0,
    "y": 0
  },
  "assignment_type": "manual",
  "assigned_at": "2025-10-13T13:52:47.33+00:00",
  "notes": "",
  "created_at": "2025-10-13T13:52:47.705618+00:00",
  "updated_at": "2025-10-13T13:52:47.705618+00:00",
  "column_number": 8,
  "row_number": 7,
  "attendee_first_name": "Sunshine",
  "attendee_last_name": "Burkett",
  "is_blocked": false,
  "is_pending_review": false
}
```

### **Interpretation:**
- **Seat Location**: **Row 7, Column 8** (Classroom-style grid)
- **Assignment Type**: Manual assignment
- **Status**: Active (not blocked, not pending review)
- **Position**: Default coordinates (0,0) - actual position calculated from row/column
- **Assignment Date**: October 13, 2025

---

## 🍽️ **MAPLE & ASH DINING ASSIGNMENT**

### **Event Details:**
- **Name**: "Networking Dinner on Tuesday Evening @ Maple & Ash"
- **Date**: 2025-10-21
- **Time**: 18:30
- **Location**: Maple & Ash Restaurant
- **Seating Type**: Assigned seating with table assignments

### **Seating Configuration:**
- **Config ID**: `6b6b5e7e-7e12-4bff-86df-4656cbd85d16`
- **Layout Type**: `table` (table-based)
- **Configuration Status**: `configured`
- **Has Seating**: `true`

### **Sunshine Burkett's Assignment:**
```json
{
  "id": "9e6c0e10-1743-4f81-99d1-81ce6399e2ab",
  "seating_configuration_id": "6b6b5e7e-7e12-4bff-86df-4656cbd85d16",
  "attendee_id": "8a35ddb4-d59c-4ffd-a391-7a6b416c29ad",
  "table_name": "Table 1: VIP CEOs",
  "seat_number": 11,
  "seat_position": {
    "x": 0,
    "y": 0
  },
  "assignment_type": "manual",
  "assigned_at": "2025-10-13T01:38:56.324+00:00",
  "notes": "",
  "created_at": "2025-10-13T01:38:56.475266+00:00",
  "updated_at": "2025-10-13T01:38:56.475266+00:00",
  "column_number": null,
  "row_number": null,
  "attendee_first_name": "Sunshine",
  "attendee_last_name": "Burkett",
  "is_blocked": false,
  "is_pending_review": false
}
```

### **Interpretation:**
- **Table Assignment**: **Table 1: VIP CEOs, Seat 11**
- **Table Details**: Rectangle-horizontal shape, capacity of 12 seats
- **Assignment Type**: Manual assignment
- **Status**: Active (not blocked, not pending review)
- **Position**: Default coordinates (0,0) - actual position calculated from table/seat
- **Assignment Date**: October 13, 2025

### **Table Information:**
- **Table Name**: "Table 1: VIP CEOs"
- **Shape**: Rectangle-horizontal
- **Capacity**: 12 seats
- **Seat Number**: 11 (out of 12 possible seats)
- **Tablemates**: Other VIP CEOs (up to 11 other attendees)

---

## 🔍 **TECHNICAL ANALYSIS**

### **Assignment Patterns:**
- **Opening Remarks**: Uses **grid-based** seating (row/column system)
- **Maple & Ash**: Uses **table-based** seating (named tables with shapes)

### **Data Structure Differences:**
- **Grid Assignments**: `row_number` and `column_number` populated, `table_name` and `seat_number` are null
- **Table Assignments**: `table_name` and `seat_number` populated, `row_number` and `column_number` are null

### **Assignment Status:**
- **Opening Remarks**: ✅ Active assignment (not blocked, not pending review)
- **Maple & Ash**: ✅ Active assignment (not blocked, not pending review)

### **Additional Assignment:**
Sunshine also has a third assignment (Config ID: `c4df64c7-e952-435f-967a-0d4303aa55f4`) with the same grid position (Row 7, Column 8) but different timing and notes ("Synced from master configuration"). This suggests:
- Multiple seating configurations for different events
- Master configuration synchronization
- Possible duplicate or updated assignments

---

## 📊 **COMPARISON WITH AARON COOPER**

| Aspect | Aaron Cooper | Sunshine Burkett |
|--------|--------------|-------------------|
| **Opening Remarks** | ✅ Row 1, Column 10 | ✅ Row 7, Column 8 |
| **Maple & Ash** | ❌ No assignment | ✅ Table 1: VIP CEOs, Seat 11 |
| **Total Assignments** | 1 confirmed | 3 total (2 relevant) |
| **Assignment Status** | 1 active | 2 active |

---

## 🎯 **KEY INSIGHTS**

1. **Complete Coverage**: Sunshine has assignments for both events, unlike Aaron Cooper
2. **VIP Status**: Assigned to "Table 1: VIP CEOs" suggests high-priority seating
3. **Grid vs Table**: Demonstrates both seating systems working simultaneously
4. **Multiple Configs**: Shows the system supports multiple seating configurations per attendee

---

## 📋 **RECOMMENDATIONS**

1. **Verify Aaron Cooper**: Check why Aaron Cooper lacks Maple & Ash assignment
2. **Coordinate Calculation**: Implement proper position calculation for both grid and table layouts
3. **Assignment Validation**: Ensure all attendees have appropriate assignments for their registered events
4. **Data Consistency**: Review the multiple assignments for Sunshine to ensure they're all necessary

---

*This analysis is based on local cache data from 2025-01-27. Verify with live database for current status.*
