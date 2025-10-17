// TypeScript interfaces for Seating System based on actual database schema
// Generated from real database data via authenticated Supabase API

export type AssignmentType = 'manual' | 'automatic'

// Core Seat Assignment Entity (Actual database fields)
export interface SeatAssignment {
  id: string
  seating_configuration_id: string  // Reference to seating configuration
  attendee_id: string              // The attendee being assigned
  table_name: string | null       // Table name (e.g., "Table 1") - nullable
  seat_number: number | null       // Seat number within table - nullable
  seat_position: { x: number, y: number }  // Visual position coordinates
  assignment_type: AssignmentType  // Manual or automatic assignment
  assigned_at: string             // When assignment was made
  notes: string                   // Assignment notes (can be empty)
  created_at: string
  updated_at: string
  column_number: number | null    // Column number (nullable)
  row_number: number | null       // Row number (nullable)
  attendee_first_name: string     // Cached attendee first name
  attendee_last_name: string      // Cached attendee last name
  is_blocked: boolean             // NEW: Whether assignment is blocked
  is_pending_review: boolean      // NEW: Whether assignment is pending review
}

// Seat Entity (Configuration)
export interface Seat {
  id: string
  seating_configuration_id: string
  seat_number: string          // e.g., "A1", "B5", "Table 3"
  position: { x: number, y: number }  // Visual position
  is_available: boolean
  created_at: string
  updated_at: string
}

// Seating Configuration (Actual database fields)
export interface SeatingConfiguration {
  id: string
  agenda_item_id: string | null      // Reference to agenda item (nullable)
  dining_option_id: string | null    // Reference to dining option (nullable)
  layout_template_id: string | null  // Reference to layout template (nullable)
  seating_type: 'open' | 'assigned'  // Seating type
  auto_assignment_rules: any         // Auto-assignment rules object
  is_active: boolean                 // Active status
  created_at: string
  updated_at: string
  layout_type: string                // Layout type (e.g., "table")
  layout_config: LayoutConfig        // Layout configuration object
  configuration_status: string       // Configuration status (e.g., "configured")
  weightings: any                    // NEW: Weightings object
  algorithm_status: string           // NEW: Algorithm status (e.g., "idle")
  algorithm_job_id: string | null    // NEW: Algorithm job ID
  algorithm_results: any            // NEW: Algorithm results object
  parent_configuration_id: string | null  // NEW: Parent configuration ID
  copy_type: string | null          // NEW: Copy type
  is_master: boolean                 // NEW: Whether this is a master configuration
  last_synced_at: string | null     // NEW: Last synced timestamp
}

// Layout configuration structure (from actual database)
// Updated to match current table-based structure
export interface LayoutConfig {
  tables: Array<{
    name: string           // e.g., "Table 1: VIP CEOs"
    shape: string          // e.g., "rectangle-horizontal", "round", "rectangle-vertical"
    capacity: number       // e.g., 12
    position: { x: number; y: number }
  }>
  layout_type: string      // "table"
}

// Layout data structure
export interface LayoutData {
  grid: {
    rows: number
    columns: number
  }
  seats: Array<{
    id: string
    seat_number: string
    position: { x: number, y: number }
    is_available: boolean
  }>
  tables?: Array<{
    id: string
    name: string
    seats: string[]
    position: { x: number, y: number }
  }>
}

// Form data interfaces
export interface SeatAssignmentFormData {
  attendee_id: string
  seat_id: string
  event_id: string
  event_type: EventType
  assignment_type: AssignmentType
  notes?: string
}

export interface SeatingConfigurationFormData {
  name: string
  venue: string
  total_seats: number
  layout_data: LayoutData
  is_active: boolean
}

// API response types
export interface SeatAssignmentResponse {
  data: SeatAssignment[]
  error?: string
}

export interface SeatResponse {
  data: Seat[]
  error?: string
}

export interface SeatingConfigurationResponse {
  data: SeatingConfiguration[]
  error?: string
}

// Request types
export interface CreateSeatAssignmentRequest {
  attendee_id: string
  seat_id: string
  event_id: string
  event_type: EventType
  assignment_type?: AssignmentType
  notes?: string
}

export interface UpdateSeatAssignmentRequest extends CreateSeatAssignmentRequest {
  id: string
}

export interface CreateSeatingConfigurationRequest {
  name: string
  venue: string
  total_seats: number
  layout_data: LayoutData
  is_active?: boolean
}

export interface UpdateSeatingConfigurationRequest extends CreateSeatingConfigurationRequest {
  id: string
}

// Display types with related data
export interface SeatAssignmentDisplay extends SeatAssignment {
  attendee: {
    id: string
    first_name: string
    last_name: string
    company: string
    email: string
  }
  seat: {
    id: string
    seat_number: string
    position: { x: number, y: number }
  }
  event: {
    id: string
    name: string
    date: string
    time: string
    location: string
  }
}

export interface SeatingChartDisplay {
  configuration: SeatingConfiguration
  seats: Array<{
    seat: Seat
    assignment?: SeatAssignmentDisplay
    is_occupied: boolean
  }>
  statistics: {
    total_seats: number
    occupied_seats: number
    available_seats: number
    occupancy_rate: number
  }
}

// Helper functions
export const isSeatOccupied = (seat: Seat, assignments: SeatAssignment[]): boolean => {
  return assignments.some(assignment => assignment.seat_id === seat.id)
}

export const getSeatAssignment = (seat: Seat, assignments: SeatAssignment[]): SeatAssignment | undefined => {
  return assignments.find(assignment => assignment.seat_id === seat.id)
}

export const calculateOccupancyRate = (totalSeats: number, occupiedSeats: number): number => {
  return totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0
}

export const sortSeatsByPosition = (seats: Seat[]): Seat[] => {
  return [...seats].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y
    }
    return a.position.x - b.position.x
  })
}

export const generateSeatNumber = (row: number, column: number): string => {
  const rowLetter = String.fromCharCode(65 + row) // A, B, C, etc.
  return `${rowLetter}${column + 1}`
}

// Validation
export interface SeatAssignmentValidation {
  attendee_id: {
    required: boolean
    message: string
  }
  seat_id: {
    required: boolean
    message: string
  }
  event_id: {
    required: boolean
    message: string
  }
  event_type: {
    required: boolean
    enum: EventType[]
    message: string
  }
}

// Constants
export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'agenda', label: 'Agenda Item' },
  { value: 'dining', label: 'Dining Option' }
]

export const ASSIGNMENT_TYPES: { value: AssignmentType; label: string }[] = [
  { value: 'manual', label: 'Manual Assignment' },
  { value: 'automatic', label: 'Automatic Assignment' }
]
