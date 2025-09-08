# UI-Driven Database Schema Analysis

**Generated:** 2025-09-08  
**Based on:** Admin Interface Screenshots  
**Purpose:** Reverse-engineer database schema from UI forms

## Overview

This document analyzes the admin interface screenshots to understand the actual data structures and business logic, providing a more accurate picture of the database schema than the empty table analysis.

## Agenda Items Table Analysis

### Form Structure Analysis

From the "Edit Agenda Item" form, the `agenda_items` table structure is:

```typescript
interface AgendaItem {
  // Primary fields (likely auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Session Details (Required Fields)
  session_title: string        // Required - Text input
  date: string                 // Required - Date picker (MM/DD/YYYY format)
  session_type: SessionType    // Required - Dropdown selection
  start_time: string           // Required - Time picker (HH:MM AM/PM)
  end_time: string             // Required - Time picker (HH:MM AM/PM)
  location: string             // Required - Text input
  
  // Optional Fields
  capacity?: number            // Optional - Numeric input
  description?: string         // Optional - Multi-line text area
  
  // Seating Configuration
  seating_type: SeatingType    // Required - Dropdown selection
  seating_capacity?: number    // Optional - Numeric input (separate from capacity)
}

// Enumerations derived from UI dropdowns
type SessionType = 
  | 'keynote'
  | 'breakout-session'
  | 'executive-presentation'
  | 'panel-discussion'
  | 'meal'
  | 'reception'
  | 'networking'

type SeatingType = 
  | 'open-seating'
  | 'assigned-seating'
```

### Business Logic Insights

#### 1. Seating Management Integration
- **Assigned Seating Events**: When `seating_type = 'assigned-seating'`, the event appears in "Seating Management"
- **Relationship**: This confirms the link between `agenda_items` and `seat_assignments` tables
- **Capacity Management**: Two separate capacity fields suggest different capacity concepts

#### 2. Session Type Hierarchy
The 7 session types suggest a well-defined event structure:
- **Keynote**: Main presentations
- **Breakout Session**: Smaller group sessions
- **Executive Presentation**: C-level presentations
- **Panel Discussion**: Multi-speaker sessions
- **Meal**: Dining events
- **Reception**: Social/networking events
- **Networking**: Informal networking sessions

#### 3. Time Management
- **Duration Calculation**: `end_time - start_time` for session duration
- **Scheduling Logic**: Date + time combination for calendar integration
- **Capacity Planning**: Both general and seating capacity for different planning needs

## Updated Database Schema

### Agenda Items Table (Refined)

```sql
CREATE TABLE agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session Details
  session_title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
    'keynote', 'breakout-session', 'executive-presentation', 
    'panel-discussion', 'meal', 'reception', 'networking'
  )),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INTEGER,
  description TEXT,
  
  -- Seating Configuration
  seating_type VARCHAR(50) NOT NULL CHECK (seating_type IN (
    'open-seating', 'assigned-seating'
  )),
  seating_capacity INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships

```sql
-- Link to seat assignments for assigned seating events
ALTER TABLE seat_assignments 
ADD CONSTRAINT fk_seat_assignments_agenda_item 
FOREIGN KEY (agenda_item_id) REFERENCES agenda_items(id);

-- Index for performance
CREATE INDEX idx_agenda_items_date ON agenda_items(date);
CREATE INDEX idx_agenda_items_session_type ON agenda_items(session_type);
CREATE INDEX idx_agenda_items_seating_type ON agenda_items(seating_type);
```

## Frontend Architecture Implications

### Form Validation Rules

```typescript
const agendaItemValidation = {
  session_title: {
    required: true,
    maxLength: 255,
    message: "Session title is required"
  },
  date: {
    required: true,
    format: 'MM/DD/YYYY',
    message: "Date is required"
  },
  session_type: {
    required: true,
    enum: ['keynote', 'breakout-session', 'executive-presentation', 'panel-discussion', 'meal', 'reception', 'networking'],
    message: "Session type is required"
  },
  start_time: {
    required: true,
    format: 'HH:MM AM/PM',
    message: "Start time is required"
  },
  end_time: {
    required: true,
    format: 'HH:MM AM/PM',
    validate: (value: string, formData: any) => {
      // End time must be after start time
      return new Date(`2000-01-01 ${value}`) > new Date(`2000-01-01 ${formData.start_time}`)
    },
    message: "End time must be after start time"
  },
  location: {
    required: true,
    maxLength: 255,
    message: "Location is required"
  },
  seating_type: {
    required: true,
    enum: ['open-seating', 'assigned-seating'],
    message: "Seating type is required"
  }
}
```

### Component Architecture

```typescript
// Agenda Item Form Component
interface AgendaItemFormProps {
  agendaItem?: AgendaItem
  onSubmit: (data: AgendaItem) => void
  onCancel: () => void
}

const AgendaItemForm: React.FC<AgendaItemFormProps> = ({ agendaItem, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<AgendaItem>>(agendaItem || {})
  
  return (
    <form onSubmit={handleSubmit}>
      <SessionDetailsSection 
        data={formData}
        onChange={updateFormData}
        validation={agendaItemValidation}
      />
      <SeatingConfigurationSection 
        data={formData}
        onChange={updateFormData}
        validation={agendaItemValidation}
      />
    </form>
  )
}
```

### State Management

```typescript
// Redux slice for agenda items
export const agendaSlice = createSlice({
  name: 'agenda',
  initialState: {
    items: [] as AgendaItem[],
    loading: false,
    error: null as string | null
  },
  reducers: {
    setAgendaItems: (state, action) => {
      state.items = action.payload
    },
    addAgendaItem: (state, action) => {
      state.items.push(action.payload)
    },
    updateAgendaItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    }
  }
})

// API endpoints
export const agendaApi = createApi({
  reducerPath: 'agendaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/agenda/',
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState())
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['AgendaItem'],
  endpoints: (builder) => ({
    getAgendaItems: builder.query<AgendaItem[], void>({
      query: () => '',
      providesTags: ['AgendaItem'],
    }),
    createAgendaItem: builder.mutation<AgendaItem, Partial<AgendaItem>>({
      query: (agendaItem) => ({
        url: '',
        method: 'POST',
        body: agendaItem,
      }),
      invalidatesTags: ['AgendaItem'],
    }),
    updateAgendaItem: builder.mutation<AgendaItem, AgendaItem>({
      query: (agendaItem) => ({
        url: `${agendaItem.id}`,
        method: 'PUT',
        body: agendaItem,
      }),
      invalidatesTags: ['AgendaItem'],
    }),
  }),
})
```

## Integration with Existing Tables

### Seat Assignments Integration

```typescript
// Enhanced seat assignment with agenda item relationship
interface SeatAssignment {
  id: string
  agenda_item_id: string        // NEW: Link to agenda item
  seating_configuration_id: string
  attendee_id: string
  table_name?: string
  seat_number?: string
  seat_position: { x: number, y: number }
  assignment_type: 'manual' | 'automatic'
  assigned_at: string
  notes: string
  created_at: string
  updated_at: string
  column_number: number
  row_number: number
  attendee_first_name: string
  attendee_last_name: string
}

// Query to get seat assignments for a specific agenda item
const getSeatAssignmentsForAgendaItem = async (agendaItemId: string) => {
  const { data, error } = await supabase
    .from('seat_assignments')
    .select('*')
    .eq('agenda_item_id', agendaItemId)
    .order('row_number, column_number')
  
  return { data, error }
}
```

## Dining Options Table Analysis

### Form Structure Analysis

From the "Edit Dining Option" form, the `dining_options` table structure is:

```typescript
interface DiningOption {
  // Primary fields (likely auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Event Details (Required Fields)
  event_name: string           // Required - Text input
  date: string                 // Required - Date picker (MM/DD/YYYY format)
  time: string                 // Required - Time picker (HH:MM AM/PM)
  location: string             // Required - Text input
  venue_address: string        // Required - Text input
  display_order: number        // Required - Numeric input
  
  // Optional Fields
  maximum_capacity?: number    // Optional - Numeric input with helper text
  
  // Status
  active: boolean              // Checkbox - available for selection
  
  // Seating Configuration
  seating_type: DiningSeatingType  // Required - Radio button group
}

type DiningSeatingType = 
  | 'open-seating'
  | 'assigned-seating'
```

### Business Logic Insights

#### 1. Event Management
- **Display Order**: Required field for ordering dining options in UI
- **Active Status**: Boolean flag to control availability for selection
- **Capacity Management**: Optional maximum capacity with clear helper text

#### 2. Seating Integration
- **Open Seating**: "Guests can sit anywhere" - no specific seat management
- **Assigned Seating**: "Specific seat assignments managed in Seating Management" - links to seating system
- **Consistent Pattern**: Same seating types as agenda items, showing unified seating management

#### 3. Venue Management
- **Location vs Address**: Separate fields for venue name and physical address
- **Date/Time**: Same format as agenda items for consistency

### Updated Database Schema

```sql
CREATE TABLE dining_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  event_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  venue_address VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  maximum_capacity INTEGER,
  active BOOLEAN DEFAULT true,
  
  -- Seating Configuration
  seating_type VARCHAR(50) NOT NULL CHECK (seating_type IN (
    'open-seating', 'assigned-seating'
  )),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dining_options_date ON dining_options(date);
CREATE INDEX idx_dining_options_active ON dining_options(active);
CREATE INDEX idx_dining_options_display_order ON dining_options(display_order);
CREATE INDEX idx_dining_options_seating_type ON dining_options(seating_type);
```

## Next Steps

1. **Validate Schema**: Test the inferred schema against actual database constraints
2. **Create Migration**: Generate SQL migration to add missing columns/constraints
3. **Update Types**: Generate TypeScript types from refined schema
4. **Build Components**: Create form components based on UI analysis
5. **Test Integration**: Verify agenda items and dining options integrate properly with seating system
6. **Cross-Reference**: Ensure consistency between agenda items and dining options seating types

## Sponsors Table Analysis

### Form Structure Analysis

From the "Sponsor Details" form, the `sponsors` table structure is:

```typescript
interface Sponsor {
  // Primary fields (likely auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Sponsor Details (Required Fields)
  company_name: string        // Required - Text input
  logo_url: string           // Required - URL field
  display_order: number      // Required - Numeric input
  
  // Optional Fields
  website?: string           // Optional - URL field with logo fetching
  
  // Status
  active: boolean            // Checkbox - "show in carousel"
}
```

### Business Logic Insights

#### 1. Logo Management System
- **Automatic Logo Fetching**: "Logo will be automatically fetched when you enter a website"
- **Multiple Sources**: Clearbit, Logo.dev, and company favicon integration
- **Manual Override**: Users can manually set logo URLs
- **Preview System**: Circular logo preview in the form

#### 2. Display Management
- **Carousel Integration**: Active sponsors are shown in a carousel
- **Display Ordering**: Required field for consistent UI ordering
- **Active Status**: Boolean flag to control carousel visibility

#### 3. Company Information
- **Company Name**: Primary identifier for the sponsor
- **Website Integration**: Optional website field that triggers logo fetching
- **Logo URL**: Required field for logo display

### Updated Database Schema

```sql
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sponsor Details
  company_name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500) NOT NULL,
  display_order INTEGER NOT NULL,
  website VARCHAR(500),
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sponsors_active ON sponsors(active);
CREATE INDEX idx_sponsors_display_order ON sponsors(display_order);
CREATE INDEX idx_sponsors_company_name ON sponsors(company_name);
```

### Logo Fetching Integration

```typescript
// Logo fetching service integration
interface LogoFetchingService {
  fetchFromClearbit(website: string): Promise<string>
  fetchFromLogoDev(website: string): Promise<string>
  fetchFavicon(website: string): Promise<string>
  fetchLogo(website: string, companyName?: string): Promise<LogoFetchResponse>
}

// Implementation example
const logoFetchingService: LogoFetchingService = {
  fetchFromClearbit: async (website: string) => {
    const domain = extractDomainFromWebsite(website)
    return `https://logo.clearbit.com/${domain}`
  },
  
  fetchFromLogoDev: async (website: string) => {
    // Implementation for Logo.dev API
    const response = await fetch(`https://logo.dev/api/logo?url=${website}`)
    const data = await response.json()
    return data.logo_url
  },
  
  fetchFavicon: async (website: string) => {
    // Implementation for favicon fetching
    return `${website}/favicon.ico`
  },
  
  fetchLogo: async (website: string, companyName?: string) => {
    // Try multiple sources in order of preference
    try {
      const clearbitUrl = await this.fetchFromClearbit(website)
      return { logo_url: clearbitUrl, source: 'clearbit', success: true }
    } catch (error) {
      try {
        const logoDevUrl = await this.fetchFromLogoDev(website)
        return { logo_url: logoDevUrl, source: 'logo-dev', success: true }
      } catch (error) {
        try {
          const faviconUrl = await this.fetchFavicon(website)
          return { logo_url: faviconUrl, source: 'favicon', success: true }
        } catch (error) {
          return { logo_url: '', source: 'manual', success: false, error: 'Failed to fetch logo' }
        }
      }
    }
  }
}
```

## Cross-Entity Relationships

### Sponsors ↔ Attendees
```typescript
// Sponsor-attendee relationship
interface SponsorAttendeeRelationship {
  sponsor: Sponsor
  sponsorAttendees: Attendee[]
  // Identified by company name matching and attributes.sponsorAttendee = true
}

// Query to get sponsor attendees
const getSponsorAttendees = async (sponsorId: string) => {
  const sponsor = await getSponsor(sponsorId)
  const attendees = await supabase
    .from('attendees')
    .select('*')
    .eq('company', sponsor.company_name)
    .eq('attributes->>sponsorAttendee', 'true')
  
  return attendees.data || []
}
```

### Sponsors ↔ Carousel Display
```typescript
// Carousel management
interface SponsorCarousel {
  activeSponsors: Sponsor[]
  displayOrder: number[]
  logoUrls: string[]
}

// Get sponsors for carousel
const getCarouselSponsors = async (): Promise<SponsorCarouselItem[]> => {
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('display_order')
  
  return createCarouselItems(data || [])
}
```

## Hotels Table Analysis

### Form Structure Analysis

From the "Hotel Details" form, the `hotels` table structure is:

```typescript
interface Hotel {
  // Primary fields (likely auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Hotel Details (Required Fields)
  hotel_name: string         // Required - Text input
  phone_number: string       // Required - Text input
  address: string           // Required - Text input
  display_order: number     // Required - Numeric input
  
  // Optional Fields
  website?: string          // Optional - URL field
  
  // Status
  active: boolean           // Checkbox - "available for selection"
}
```

### Business Logic Insights

#### 1. Hotel Management
- **Display Ordering**: Required field for consistent UI ordering (same pattern as sponsors and dining options)
- **Active Status**: Boolean flag to control availability for attendee selection
- **Contact Information**: Phone number and website for hotel details
- **Address Management**: Full address field for location information

#### 2. Attendee Integration
- **Hotel Selection**: Attendees can select from available hotels
- **Custom Hotels**: Attendees can specify custom hotel arrangements
- **Room Types**: Integration with attendee room type preferences
- **Check-in/Check-out**: Date management for hotel stays

#### 3. Consistent UI Patterns
- **Display Order**: Same ordering system as sponsors and dining options
- **Active Status**: Same active/inactive pattern across all entities
- **Optional Website**: Same optional website field pattern as sponsors

### Updated Database Schema

```sql
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hotel Details
  hotel_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  display_order INTEGER NOT NULL,
  website VARCHAR(500),
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hotels_active ON hotels(active);
CREATE INDEX idx_hotels_display_order ON hotels(display_order);
CREATE INDEX idx_hotels_hotel_name ON hotels(hotel_name);
```

### Hotel Selection Integration

```typescript
// Hotel selection in attendee data
interface AttendeeHotelSelection {
  hotel_selection: string        // Hotel ID or 'own-arrangements'
  custom_hotel: string          // Custom hotel name if not from list
  room_type: string            // Room type preference
  check_in_date: string        // Check-in date
  check_out_date: string       // Check-out date
}

// Query to get hotel selection statistics
const getHotelSelectionStats = async () => {
  const { data: attendees } = await supabase
    .from('attendees')
    .select('hotel_selection, custom_hotel, room_type, check_in_date, check_out_date')
  
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('active', true)
    .order('display_order')
  
  // Calculate selection statistics
  const hotelStats = hotels.map(hotel => {
    const selections = attendees.filter(attendee => 
      attendee.hotel_selection === hotel.id
    )
    
    return {
      hotel,
      selection_count: selections.length,
      room_types: [...new Set(selections.map(s => s.room_type).filter(Boolean))]
    }
  })
  
  return hotelStats
}
```

### Hotel Management API

```typescript
// Hotel management endpoints
export const hotelApi = createApi({
  reducerPath: 'hotelApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/hotels/',
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState())
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Hotel'],
  endpoints: (builder) => ({
    getHotels: builder.query<Hotel[], HotelQuery>({
      query: (params) => ({
        url: '',
        params
      }),
      providesTags: ['Hotel'],
    }),
    getActiveHotels: builder.query<Hotel[], void>({
      query: () => '?active_only=true',
      providesTags: ['Hotel'],
    }),
    createHotel: builder.mutation<Hotel, CreateHotelRequest>({
      query: (hotel) => ({
        url: '',
        method: 'POST',
        body: hotel,
      }),
      invalidatesTags: ['Hotel'],
    }),
    updateHotel: builder.mutation<Hotel, UpdateHotelRequest>({
      query: (hotel) => ({
        url: `${hotel.id}`,
        method: 'PUT',
        body: hotel,
      }),
      invalidatesTags: ['Hotel'],
    }),
    getHotelSelectionStats: builder.query<HotelStats[], void>({
      query: () => 'stats',
      providesTags: ['Hotel'],
    }),
  }),
})
```

## Benefits of UI-Driven Analysis

1. **Business Logic Clarity**: UI reveals actual business rules and validation requirements
2. **Data Relationships**: Form interactions show how different data entities relate
3. **User Experience**: Understanding UI patterns helps design consistent data access patterns
4. **Validation Rules**: Form validation reveals database constraints and business rules
5. **Real-World Usage**: UI shows how data is actually used, not just how it's stored

---

*This analysis provides a more accurate understanding of the database schema by examining the actual user interface and business logic implementation.*
