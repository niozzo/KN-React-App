// TypeScript interfaces for Seating System
// Simplified focus on attendee-seat assignment relationships

export type EventType = 'agenda' | 'dining'
export type AssignmentType = 'manual' | 'automatic'

// Core Seat Assignment Entity
export interface SeatAssignment {
  id: string
  attendee_id: string           // The attendee being assigned
  seat_id: string              // The seat being assigned
  event_id: string             // Which event (agenda_item_id or dining_option_id)
  event_type: EventType        // Type of event
  assignment_type: AssignmentType
  assigned_at: string
  notes?: string
  created_at: string
  updated_at: string
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

// Seating Configuration (Admin Tool)
export interface SeatingConfiguration {
  id: string
  name: string                 // e.g., "Grand Ballroom Layout"
  venue: string
  total_seats: number
  layout_data: LayoutData      // Grid configuration
  is_active: boolean
  created_at: string
  updated_at: string
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
