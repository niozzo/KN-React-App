# Database-Driven Architecture Analysis

**Generated:** 2025-09-08  
**Updated:** 2025-09-09  
**Based on:** Database Structure Analysis (278 rows across 11 tables)  
**Connection Method:** Authenticated Supabase API via Vercel Serverless Functions (per ADR-003)

## Executive Summary

This document provides architectural guidance based on the comprehensive analysis of the Knowledge Now React application database. The analysis reveals a sophisticated event management system with 278 active records across 11 tables, designed for conference/event management with advanced features like seating assignments, sponsor management, and attendee tracking.

## Database Architecture Overview

### Core Data Model

The database follows a well-structured event management pattern with the following key entities:

#### Primary Tables (With Data)
1. **`attendees`** (222 rows) - Core attendee information and preferences
2. **`seat_assignments`** (29 rows) - Seating management system
3. **`sponsors`** (27 rows) - Sponsor directory and management

#### Supporting Tables (With Data)
4. **`agenda_items`** (10 rows) - Event schedule and agenda management
5. **`dining_options`** (2 rows) - Dining and meal preferences  
6. **`hotels`** (3 rows) - Hotel and accommodation management
7. **`seating_configurations`** (3 rows) - Seating arrangement templates
8. **`user_profiles`** (1 row) - User account management

#### Empty Tables (Ready for Data)
9. **`breakout_sessions`** - Breakout session details
10. **`import_history`** - Data import tracking
11. **`layout_templates`** - Seating layout configurations

## Data Structure Analysis

### Attendees Table (Primary Entity)
**35 columns** - Comprehensive attendee management system

**Key Features (Actual Database Fields):**
- **Personal Information**: `salutation`, `first_name`, `last_name`, `email`, `title`, `company`, `bio`, `photo`
- **Contact Information**: `business_phone`, `mobile_phone`
- **Address Management**: `address1`, `address2`, `postal_code`, `city`, `state`, `country`, `country_code`
- **Hotel Information**: `check_in_date`, `check_out_date`, `hotel_selection`, `custom_hotel`, `room_type`
- **Registration Management**: `registration_id`, `registration_status`, `access_code`
- **Spouse Management**: `has_spouse`, `spouse_details` (JSON object)
- **Event Preferences**: `dining_selections` (JSON object), `selected_breakouts` (array), `dietary_requirements`
- **Role Attributes**: `attributes` (JSON object), `is_cfo`, `is_apax_ep`
- **Assistant Information**: `assistant_name`, `assistant_email`
- **External Integration**: `idloom_id`, `last_synced_at`

**Architectural Implications:**
- Rich data model supports complex event management
- JSON fields for flexible preference storage (`spouse_details`, `dining_selections`, `attributes`)
- Role-based access patterns evident
- International event support built-in
- Clearbit logo service integration for company photos

### Seat Assignments Table
**15 columns** - Sophisticated seating management

**Key Features (Actual Database Fields):**
- **Assignment Management**: `seating_configuration_id`, `attendee_id`, `assignment_type`, `assigned_at`
- **Seat Information**: `table_name`, `seat_number`, `seat_position` (JSON with x/y coordinates)
- **Spatial Management**: `column_number`, `row_number` (nullable)
- **Attendee Integration**: `attendee_first_name`, `attendee_last_name` (cached for performance)
- **Notes**: `notes` field for assignment comments

**Architectural Implications:**
- Real-time seating management capability
- Visual seating chart support with coordinate system
- Flexible assignment workflows (manual/automatic)
- Performance optimization through denormalized attendee names
- Table-based seating system with numbered seats

### Sponsors Table
**7 columns** - Clean sponsor management

**Key Features (Actual Database Fields):**
- **Brand Management**: `name` (company name), `logo` (logo URL), `website`
- **Status Control**: `is_active` (active/inactive status)
- **Display Management**: `display_order` (UI ordering)

**Architectural Implications:**
- Simple, effective sponsor directory
- Clearbit logo service integration (logo URLs use clearbit.com)
- Display ordering for UI presentation
- Clean separation of brand and status management

## Architectural Recommendations

### 1. Data Access Layer Architecture

**✅ IMPLEMENTED**: Authenticated Supabase API via Vercel Serverless Functions

```typescript
// Working data access pattern (per ADR-003)
interface DataAccessLayer {
  // Serverless API endpoints
  api: {
    '/api/db/tables': () => Promise<TableInfo[]>
    '/api/db/table-count?table=name': (table: string) => Promise<{count: number}>
    '/api/db/table-data?table=name': (table: string) => Promise<any[]>
    '/api/db/table-structure?table=name': (table: string) => Promise<ColumnInfo[]>
  }
  
  // Authenticated Supabase client
  supabase: {
    getAuthenticatedClient(): Promise<SupabaseClient>
    getTableCount(table: string): Promise<number>
    getTableData(table: string): Promise<any[]>
  }
}
```

**Key Implementation Details:**
- ✅ **Authentication**: Server-side Supabase client with user credentials
- ✅ **RLS Compliance**: All queries respect Row Level Security policies  
- ✅ **Vercel Integration**: Serverless functions handle database access
- ✅ **Data Access**: Successfully retrieves all table data (agenda_items: 10 rows, etc.)

### 2. State Management Architecture

**Recommended Pattern**: Redux Toolkit with RTK Query

```typescript
// API slice structure
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // Add Supabase auth headers
      const token = selectAuthToken(getState())
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Attendee', 'SeatAssignment', 'Sponsor', 'AgendaItem'],
  endpoints: (builder) => ({
    // Attendee endpoints
    getAttendees: builder.query<Attendee[], void>({
      query: () => 'attendees',
      providesTags: ['Attendee'],
    }),
    
    // Seating endpoints
    getSeatAssignments: builder.query<SeatAssignment[], string>({
      query: (configId) => `seating/assignments/${configId}`,
      providesTags: ['SeatAssignment'],
    }),
    
    // Sponsor endpoints
    getSponsors: builder.query<Sponsor[], void>({
      query: () => 'sponsors',
      providesTags: ['Sponsor'],
    }),
  }),
})
```

### 3. Component Architecture

**Recommended Structure**:
```
src/
├── components/
│   ├── attendees/
│   │   ├── AttendeeList.tsx
│   │   ├── AttendeeCard.tsx
│   │   └── AttendeeFilters.tsx
│   ├── seating/
│   │   ├── SeatingChart.tsx
│   │   ├── SeatAssignment.tsx
│   │   └── SeatingConfiguration.tsx
│   └── sponsors/
│       ├── SponsorDirectory.tsx
│       └── SponsorCard.tsx
├── hooks/
│   ├── useAttendees.ts
│   ├── useSeating.ts
│   └── useSponsors.ts
└── types/
    ├── attendee.ts
    ├── seating.ts
    └── sponsor.ts
```

### 4. Performance Optimization Strategies

#### Caching Strategy
```typescript
// Implement multi-level caching
const cacheConfig = {
  // Browser cache for static data
  static: {
    sponsors: 24 * 60 * 60 * 1000, // 24 hours
    seatingConfigurations: 60 * 60 * 1000, // 1 hour
  },
  
  // Memory cache for dynamic data
  dynamic: {
    attendees: 5 * 60 * 1000, // 5 minutes
    seatAssignments: 2 * 60 * 1000, // 2 minutes
  }
}
```

#### Data Loading Patterns
```typescript
// Implement progressive loading
const useProgressiveDataLoading = () => {
  // Load critical data first
  const { data: attendees } = useGetAttendeesQuery()
  
  // Load secondary data after critical data
  const { data: sponsors } = useGetSponsorsQuery(undefined, {
    skip: !attendees
  })
  
  // Load tertiary data last
  const { data: seatAssignments } = useGetSeatAssignmentsQuery(configId, {
    skip: !attendees || !sponsors
  })
}
```

### 5. Security Architecture

#### Row Level Security (RLS) Compliance
```typescript
// Implement RLS-aware data access
const createSecureDataAccess = (supabaseClient: SupabaseClient) => {
  return {
    // All queries automatically respect RLS policies
    getAttendees: async () => {
      const { data, error } = await supabaseClient
        .from('attendees')
        .select('*')
        .order('last_name')
      
      if (error) throw new Error(`RLS Error: ${error.message}`)
      return data
    },
    
    // Ensure user context for RLS evaluation
    getAttendeeById: async (id: string, userId: string) => {
      const { data, error } = await supabaseClient
        .from('attendees')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // RLS policy requirement
        .single()
      
      return data
    }
  }
}
```

### 6. Real-time Features Architecture

#### WebSocket Integration
```typescript
// Real-time seating updates
const useRealtimeSeating = (configId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel('seat-assignments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seat_assignments',
        filter: `seating_configuration_id=eq.${configId}`
      }, (payload) => {
        // Update local state with real-time changes
        dispatch(updateSeatAssignment(payload.new))
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [configId])
}
```

## Implementation Roadmap

### Phase 1: Core Data Access (Week 1-2)
1. **Setup Supabase Integration**
   - Configure RLS policies
   - Implement authentication flow
   - Create data access layer

2. **Attendee Management**
   - Build attendee list/detail views
   - Implement filtering and search
   - Add role-based access controls

### Phase 2: Seating Management (Week 3-4)
1. **Seating Chart Interface**
   - Visual seating chart component
   - Drag-and-drop seat assignment
   - Real-time updates

2. **Configuration Management**
   - Seating layout templates
   - Configuration CRUD operations
   - Import/export functionality

### Phase 3: Advanced Features (Week 5-6)
1. **Sponsor Directory**
   - Sponsor listing and details
   - Logo management
   - Display ordering

2. **Event Management**
   - Agenda item management
   - Breakout session scheduling
   - Dining option management

### Phase 4: Optimization (Week 7-8)
1. **Performance Tuning**
   - Implement caching strategies
   - Optimize database queries
   - Add loading states

2. **Real-time Features**
   - WebSocket integration
   - Live updates
   - Collaborative editing

## Technical Debt and Considerations

### Current Limitations
1. **Empty Tables**: 8 tables are empty, indicating incomplete data model
2. **RLS Complexity**: All tables have RLS enabled, requiring careful policy design
3. **JSON Fields**: Flexible but may impact query performance
4. **External Dependencies**: Clearbit logo service dependency

### Recommended Improvements
1. **Data Population**: Populate empty tables with realistic test data
2. **Index Optimization**: Add database indexes for common query patterns
3. **Type Safety**: Generate TypeScript types from database schema
4. **Error Handling**: Implement comprehensive error handling for API failures
5. **Monitoring**: Add performance monitoring and alerting

## Conclusion

The database analysis reveals a sophisticated event management system with rich data models and advanced features. The architecture should focus on:

1. **RLS-compliant data access** through Supabase API
2. **Progressive data loading** for optimal performance
3. **Real-time capabilities** for collaborative features
4. **Type-safe development** with generated TypeScript types
5. **Comprehensive error handling** for production reliability

The existing data structure provides a solid foundation for building a comprehensive event management application with advanced seating, sponsor, and attendee management capabilities.

---

*This architecture document is based on the database structure analysis performed on 2025-09-08, covering 278 rows across 11 tables in the Knowledge Now React application database.*
