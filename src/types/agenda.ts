// TypeScript interfaces for Agenda Items based on UI analysis
// Generated from admin interface screenshots

export type SessionType = 
  | 'keynote'
  | 'breakout-session'
  | 'executive-presentation'
  | 'panel-discussion'
  | 'meal'
  | 'reception'
  | 'networking'

export type SeatingType = 
  | 'open-seating'
  | 'assigned-seating'

export interface AgendaItem {
  // Primary fields (auto-generated)
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

export const SEATING_TYPES: { value: SeatingType; label: string }[] = [
  { value: 'open-seating', label: 'Open Seating' },
  { value: 'assigned-seating', label: 'Assigned Seating' }
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

export const isAssignedSeating = (seatingType: SeatingType): boolean => {
  return seatingType === 'assigned-seating'
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
