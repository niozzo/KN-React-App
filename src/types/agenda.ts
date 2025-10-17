// TypeScript interfaces for Agenda Items based on actual database schema
// Generated from real database data via authenticated Supabase API

export type SessionType = 
  | 'keynote'
  | 'breakout-session'
  | 'executive-presentation'
  | 'panel-discussion'
  | 'meal'
  | 'reception'
  | 'networking'

export type SeatingType = 
  | 'open'
  | 'assigned'

export interface AgendaItem {
  // Primary fields (auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Session Details (Actual database fields)
  title: string                // Actual field name from database
  description: string          // Actual field name from database
  date: string                 // Date in YYYY-MM-DD format
  start_time: string           // Time in HH:MM:SS format
  end_time: string             // Time in HH:MM:SS format
  location: string             // Location string
  session_type: SessionType    // Session type (executive-presentation, etc.)
  speaker_name: string | null  // Speaker name (nullable)
  
  // Capacity and Registration
  capacity: number             // Maximum capacity
  registered_count: number     // Current registered count
  
  // Attendee Selection
  attendee_selection: string   // Selection type (e.g., "everyone")
  selected_attendees: any[]    // Array of selected attendee IDs
  
  // Status and Configuration
  isActive: boolean            // Active status (transformed from is_active)
  seating_notes: string        // Seating configuration notes
  seating_type: SeatingType    // Seating type (open/assigned)
  
  // Computed fields
  duration?: number            // Computed from start_time and end_time
  timeRange?: string           // Computed from start_time and end_time
  speakerInfo?: string         // Computed from speaker_name
}

// Form data interface for creating/editing agenda items
export interface AgendaItemFormData {
  session_title: string
  date: string
  session_type: SessionType
  start_time: string
  end_time: string
  location: string
  capacity?: number
  description?: string
  seating_type: SeatingType
  seating_capacity?: number
}

// Validation rules based on UI form requirements
export interface AgendaItemValidation {
  session_title: {
    required: boolean
    maxLength: number
    message: string
  }
  date: {
    required: boolean
    format: string
    message: string
  }
  session_type: {
    required: boolean
    enum: SessionType[]
    message: string
  }
  start_time: {
    required: boolean
    format: string
    message: string
  }
  end_time: {
    required: boolean
    format: string
    message: string
  }
  location: {
    required: boolean
    maxLength: number
    message: string
  }
  seating_type: {
    required: boolean
    enum: SeatingType[]
    message: string
  }
}

// Constants for dropdown options
export const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'breakout-session', label: 'Breakout Session' },
  { value: 'executive-presentation', label: 'Executive Presentation' },
  { value: 'panel-discussion', label: 'Panel Discussion' },
  { value: 'meal', label: 'Meal' },
  { value: 'reception', label: 'Reception' },
  { value: 'networking', label: 'Networking' }
]


// Helper functions
export const formatTimeForDisplay = (time: string): string => {
  // Convert 24-hour format to 12-hour format for display
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export const formatDateForDisplay = (date: string): string => {
  // Convert ISO date to MM/DD/YYYY format
  const d = new Date(date)
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`
}

export const calculateDuration = (startTime: string, endTime: string): number => {
  // Calculate duration in minutes
  const start = new Date(`2000-01-01 ${startTime}`)
  const end = new Date(`2000-01-01 ${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60)
}


// API response types
export interface AgendaItemResponse {
  data: AgendaItem[]
  error?: string
}

export interface CreateAgendaItemRequest {
  session_title: string
  date: string
  session_type: SessionType
  start_time: string
  end_time: string
  location: string
  capacity?: number
  description?: string
  seating_type: SeatingType
  seating_capacity?: number
}

export interface UpdateAgendaItemRequest extends CreateAgendaItemRequest {
  id: string
}
