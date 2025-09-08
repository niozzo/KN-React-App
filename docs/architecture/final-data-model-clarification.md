# Final Data Model Clarification

**Generated:** 2025-09-08  
**Based on:** User Clarification on Table Usage  
**Purpose:** Final simplified data model for the application

## Key Clarifications

### **Admin-Only Tables** (Not needed by application)
- **seating_configurations** - Admin tool only
- **layout_templates** - Admin tool only  
- **import_history** - Admin tool only
- **user_profiles** - Admin tool only

### **Breakout Sessions Clarification**
- **breakout_sessions** - Not a separate entity
- **Breakout sessions are agenda items** with `session_type = 'breakout-session'`
- The separate table is likely for admin management or historical data

## Final Application Data Model

### **Core Tables** (6 tables - 100% understood)

#### 1. **attendees** (222 rows) - PRIMARY ENTITY
```typescript
interface Attendee {
  id: string
  // Personal Information
  salutation: string
  first_name: string
  last_name: string
  email: string
  title: string
  company: string
  bio: string
  photo: string
  
  // Contact Information
  business_phone: string
  mobile_phone: string
  address1: string
  address2: string
  postal_code: string
  city: string
  state: string
  country: string
  country_code: string
  
  // Event Preferences
  hotel_selection: string
  custom_hotel: string
  room_type: string
  check_in_date: string
  check_out_date: string
  dining_selections: object
  selected_breakouts: object
  dietary_requirements: string
  
  // Role Attributes
  attributes: {
    ceo: boolean
    cfo: boolean
    cLevelExec: boolean
    sponsorAttendee: boolean
    portfolioCompanyExecutive: boolean
    // ... other role flags
  }
  is_cfo: boolean
  is_apax_ep: boolean
  
  // Spouse Information
  has_spouse: boolean
  spouse_details: object
  
  // System Fields
  registration_id: string
  registration_status: string
  access_code: string
  assistant_name: string
  assistant_email: string
  idloom_id: string
  last_synced_at: string
  created_at: string
  updated_at: string
}
```

#### 2. **agenda_items** (0 rows) - EVENT MANAGEMENT
```typescript
interface AgendaItem {
  id: string
  session_title: string
  date: string
  session_type: 'keynote' | 'breakout-session' | 'executive-presentation' | 'panel-discussion' | 'meal' | 'reception' | 'networking'
  start_time: string
  end_time: string
  location: string
  capacity?: number
  description?: string
  seating_type: 'open-seating' | 'assigned-seating'
  seating_capacity?: number
  created_at: string
  updated_at: string
}
```

#### 3. **dining_options** (0 rows) - DINING EVENTS
```typescript
interface DiningOption {
  id: string
  event_name: string
  date: string
  time: string
  location: string
  venue_address: string
  display_order: number
  maximum_capacity?: number
  active: boolean
  seating_type: 'open-seating' | 'assigned-seating'
  created_at: string
  updated_at: string
}
```

#### 4. **hotels** (0 rows) - ACCOMMODATION
```typescript
interface Hotel {
  id: string
  hotel_name: string
  phone_number: string
  address: string
  display_order: number
  website?: string
  active: boolean
  created_at: string
  updated_at: string
}
```

#### 5. **sponsors** (27 rows) - SPONSOR MANAGEMENT
```typescript
interface Sponsor {
  id: string
  company_name: string
  logo_url: string
  display_order: number
  website?: string
  active: boolean
  created_at: string
  updated_at: string
}
```

#### 6. **seat_assignments** (29 rows) - SEATING RELATIONSHIPS
```typescript
interface SeatAssignment {
  id: string
  attendee_id: string
  seat_id: string
  event_id: string
  event_type: 'agenda' | 'dining'
  assignment_type: 'manual' | 'automatic'
  assigned_at: string
  notes?: string
  created_at: string
  updated_at: string
}
```

## Simplified Architecture

### **Application Focus**
The application only needs to work with these 6 core tables:

1. **attendees** - Primary entity with all attendee data
2. **agenda_items** - Event sessions (including breakout sessions)
3. **dining_options** - Dining events
4. **hotels** - Accommodation options
5. **sponsors** - Sponsor directory
6. **seat_assignments** - Seating relationships

### **Admin Tools** (Separate concern)
The admin tools manage:
- Seating configurations and layouts
- Import/export operations
- User management
- Template management

### **Breakout Sessions Understanding**
- **Breakout sessions are agenda items** with `session_type = 'breakout-session'`
- The `breakout_sessions` table is likely for:
  - Admin management of breakout session details
  - Historical data or specialized breakout session properties
  - Not needed for the main application functionality

## Data Relationships

### **Primary Relationships**
```
attendees (1) ←→ (many) seat_assignments
agenda_items (1) ←→ (many) seat_assignments
dining_options (1) ←→ (many) seat_assignments
hotels (1) ←→ (many) attendees (via hotel_selection)
sponsors (1) ←→ (many) attendees (via company matching)
```

### **Attendee Selections**
```typescript
// Attendee selections are stored as JSON objects in attendees table
interface AttendeeSelections {
  dining_selections: {
    [eventId: string]: {
      attending: boolean
      dining_option_id?: string
    }
  }
  selected_breakouts: string[]  // Array of agenda_item IDs with session_type = 'breakout-session'
  hotel_selection: string       // Hotel ID or 'own-arrangements'
  custom_hotel: string          // Custom hotel name if not from list
}
```

## Implementation Priority

### **Phase 1: Core Data Access** (Ready now)
1. **Attendee Management** - Complete attendee profiles and selections
2. **Event Display** - Agenda items and dining options
3. **Hotel Selection** - Hotel directory and selection
4. **Sponsor Directory** - Sponsor carousel and information

### **Phase 2: Seating Integration** (Ready now)
1. **Seat Assignment** - Core attendee-seat relationships
2. **Event Seating** - Seating for agenda items and dining options
3. **Seating Management** - Admin tools for seat assignment

### **Phase 3: Advanced Features** (As needed)
1. **Breakout Session Details** - If breakout_sessions table has additional data
2. **Admin Tools** - Configuration and management interfaces

## Key Insights

### **Simplified Focus**
- **6 core tables** handle all application functionality
- **4 admin-only tables** are separate concerns
- **Breakout sessions** are agenda items, not separate entities

### **Clean Architecture**
- Application focuses on core business logic
- Admin tools handle configuration and management
- Clear separation of concerns

### **Ready for Implementation**
All 6 core tables are fully understood and ready for implementation. The application can be built without any dependency on the admin-only tables.

## Conclusion

The data model is **much simpler** than initially thought. We have a **complete understanding** of all tables needed for the application. The admin-only tables can be ignored for application development, and breakout sessions are just a type of agenda item.

**Status**: **READY FOR FULL IMPLEMENTATION** with 6 core tables.

---

*This clarification dramatically simplifies the architecture and confirms we have complete understanding of all application requirements.*
