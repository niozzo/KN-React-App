# Seating System Architecture Clarification

**Generated:** 2025-09-08  
**Updated:** 2025-10-15  
**Based on:** UI Analysis and Business Logic Understanding  
**Purpose:** Clarify seating system as configuration tool vs data entry system

## Core Understanding

The seating system is primarily a **configuration and management tool** rather than a data entry form. The essential business data is the **attendee-seat assignment relationship**.

## ARCHITECTURAL DECISION: Agenda Items as Source of Truth

**Decision Date:** 2025-10-15  
**Status:** Implemented  
**Rationale:** Agenda items represent the actual events and their requirements, making them the logical source of truth for seating requirements.

### Key Principles:
1. **Agenda items determine seating behavior** - `seating_type` field drives display logic
2. **Seating configurations provide layout only** - Used for seat generation and assignment storage
3. **No conflicting sources of truth** - Prevents data inconsistencies

### Implementation Impact:
- Session display logic prioritizes `agenda_item.seating_type` over `seating_configuration.seating_type`
- Seating configurations are used only for:
  - Layout definition
  - Seat assignment storage
  - NOT for determining if seating is assigned or open

## Seating System Components

### 1. Configuration Layer (Admin Tools)
- **Seating Configurations**: Define layout templates and available seats
- **Layout Templates**: Visual grid layouts for different venues
- **Seat Management**: Create, modify, and organize seat positions

### 2. Assignment Layer (Core Business Data)
- **Seat Assignments**: The critical relationship between attendees and seats
- **Assignment Types**: Manual vs automatic assignment
- **Event Context**: Which event (agenda item or dining option) the assignment is for

### 3. Management Layer (Admin Interface)
- **Visual Seating Chart**: Drag-and-drop interface for seat management
- **Bulk Operations**: Assign multiple attendees to seats
- **Conflict Resolution**: Handle seating conflicts and preferences

## Simplified Data Model

### Core Seat Assignment Entity
```typescript
interface SeatAssignment {
  id: string
  attendee_id: string           // The attendee being assigned
  seat_id: string              // The seat being assigned (simplified)
  event_id: string             // Which event (agenda_item_id or dining_option_id)
  event_type: 'agenda' | 'dining'  // Type of event
  assignment_type: 'manual' | 'automatic'
  assigned_at: string
  notes?: string
  created_at: string
  updated_at: string
}
```

### Simplified Seat Entity
```typescript
interface Seat {
  id: string
  seating_configuration_id: string
  seat_number: string          // e.g., "A1", "B5", "Table 3"
  position: { x: number, y: number }  // Visual position
  is_available: boolean
  created_at: string
  updated_at: string
}
```

### Seating Configuration (Admin Tool)
```typescript
interface SeatingConfiguration {
  id: string
  name: string                 // e.g., "Grand Ballroom Layout"
  venue: string
  total_seats: number
  layout_data: LayoutData      // Grid configuration
  is_active: boolean
  created_at: string
  updated_at: string
}
```

## Business Logic Flow

### 1. Setup Phase (Admin)
```typescript
// 1. Create seating configuration
const config = await createSeatingConfiguration({
  name: "Grand Ballroom Layout",
  venue: "The Grand Ballroom, 8th Floor",
  total_seats: 250,
  layout_data: { /* grid layout */ }
})

// 2. Generate seats from configuration
const seats = await generateSeatsFromConfiguration(config.id)
// Creates 250 seat records with positions A1, A2, A3, etc.
```

### 2. Assignment Phase (Admin/System)
```typescript
// 3. Assign attendee to specific seat
const assignment = await createSeatAssignment({
  attendee_id: "attendee-123",
  seat_id: "seat-A1",
  event_id: "agenda-item-456",
  event_type: "agenda",
  assignment_type: "manual"
})
```

### 3. Query Phase (Application)
```typescript
// 4. Get attendee's seat for an event
const attendeeSeat = await getAttendeeSeat("attendee-123", "agenda-item-456")

// 5. Get all seat assignments for an event
const eventSeating = await getEventSeating("agenda-item-456")
```

## Admin Interface Purpose

The seating admin interface serves as a **visual management tool** for:

1. **Layout Design**: Create and modify seating arrangements
2. **Bulk Assignment**: Assign multiple attendees efficiently
3. **Conflict Resolution**: Handle seating preferences and conflicts
4. **Visual Management**: Drag-and-drop seat assignments
5. **Reporting**: View seating statistics and utilization

## Simplified API Design

### Core Assignment Operations
```typescript
// Essential seat assignment operations
export const seatAssignmentApi = {
  // Assign attendee to seat
  assignSeat: async (attendeeId: string, seatId: string, eventId: string) => {
    return await supabase
      .from('seat_assignments')
      .insert({
        attendee_id: attendeeId,
        seat_id: seatId,
        event_id: eventId,
        assignment_type: 'manual'
      })
  },

  // Get attendee's seat for event
  getAttendeeSeat: async (attendeeId: string, eventId: string) => {
    const { data } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        seats (seat_number, position),
        attendees (first_name, last_name, company)
      `)
      .eq('attendee_id', attendeeId)
      .eq('event_id', eventId)
      .single()
    
    return data
  },

  // Get all assignments for event
  getEventSeating: async (eventId: string) => {
    const { data } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        seats (seat_number, position),
        attendees (first_name, last_name, company)
      `)
      .eq('event_id', eventId)
      .order('seats(seat_number)')
    
    return data
  },

  // Remove seat assignment
  removeSeatAssignment: async (assignmentId: string) => {
    return await supabase
      .from('seat_assignments')
      .delete()
      .eq('id', assignmentId)
  }
}
```

## Database Schema Simplification

### Seat Assignments Table (Core)
```sql
CREATE TABLE seat_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(id),
  seat_id UUID NOT NULL REFERENCES seats(id),
  event_id UUID NOT NULL,  -- Can reference agenda_items or dining_options
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('agenda', 'dining')),
  assignment_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one seat per attendee per event
  UNIQUE(attendee_id, event_id)
);

-- Indexes for performance
CREATE INDEX idx_seat_assignments_attendee ON seat_assignments(attendee_id);
CREATE INDEX idx_seat_assignments_event ON seat_assignments(event_id, event_type);
CREATE INDEX idx_seat_assignments_seat ON seat_assignments(seat_id);
```

### Seats Table (Configuration)
```sql
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seating_configuration_id UUID NOT NULL REFERENCES seating_configurations(id),
  seat_number VARCHAR(20) NOT NULL,  -- e.g., "A1", "B5", "Table 3"
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique seat numbers per configuration
  UNIQUE(seating_configuration_id, seat_number)
);
```

## Key Insights

### 1. **Configuration vs Assignment**
- **Configuration**: Admin tools for setting up seating layouts
- **Assignment**: Core business data linking attendees to seats

### 2. **Event Context**
- Seat assignments are always tied to specific events (agenda items or dining options)
- One attendee can have different seats for different events

### 3. **Simplified Data Model**
- Focus on the essential relationship: attendee → seat → event
- Remove complex denormalized fields that were causing confusion

### 4. **Admin Interface Purpose**
- Visual management tool, not data entry form
- Drag-and-drop for efficient seat management
- Bulk operations for large events

## Implementation Priority

1. **Core Assignment API**: Essential seat assignment operations
2. **Admin Management Tools**: Visual seating chart interface
3. **Configuration Tools**: Layout design and seat generation
4. **Reporting**: Seating statistics and utilization

This clarification simplifies the seating system to focus on its core purpose: **assigning attendees to specific seats for specific events**, with admin tools to make this process efficient and visual.

---

*This clarification focuses the seating system on its essential business purpose: attendee-seat assignment relationships, with admin tools for efficient management.*