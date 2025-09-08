// TypeScript interfaces for Dining Options based on UI analysis
// Generated from admin interface screenshots

export type DiningSeatingType = 
  | 'open-seating'
  | 'assigned-seating'

export interface DiningOption {
  // Primary fields (auto-generated)
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

// Form data interface for creating/editing dining options
export interface DiningOptionFormData {
  event_name: string
  date: string
  time: string
  location: string
  venue_address: string
  display_order: number
  maximum_capacity?: number
  active: boolean
  seating_type: DiningSeatingType
}

// Validation rules based on UI form requirements
export interface DiningOptionValidation {
  event_name: {
    required: boolean
    maxLength: number
    message: string
  }
  date: {
    required: boolean
    format: string
    message: string
  }
  time: {
    required: boolean
    format: string
    message: string
  }
  location: {
    required: boolean
    maxLength: number
    message: string
  }
  venue_address: {
    required: boolean
    maxLength: number
    message: string
  }
  display_order: {
    required: boolean
    min: number
    message: string
  }
  seating_type: {
    required: boolean
    enum: DiningSeatingType[]
    message: string
  }
}

// Constants for radio button options
export const DINING_SEATING_TYPES: { 
  value: DiningSeatingType; 
  label: string; 
  description: string 
}[] = [
  { 
    value: 'open-seating', 
    label: 'Open Seating',
    description: 'Guests can sit anywhere'
  },
  { 
    value: 'assigned-seating', 
    label: 'Assigned Seating',
    description: 'Specific seat assignments managed in Seating Management'
  }
]

// Helper functions
export const formatDiningTimeForDisplay = (time: string): string => {
  // Convert 24-hour format to 12-hour format for display
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export const formatDiningDateForDisplay = (date: string): string => {
  // Convert ISO date to MM/DD/YYYY format
  const d = new Date(date)
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`
}

export const isDiningAssignedSeating = (seatingType: DiningSeatingType): boolean => {
  return seatingType === 'assigned-seating'
}

export const isDiningOptionActive = (diningOption: DiningOption): boolean => {
  return diningOption.active
}

// API response types
export interface DiningOptionResponse {
  data: DiningOption[]
  error?: string
}

export interface CreateDiningOptionRequest {
  event_name: string
  date: string
  time: string
  location: string
  venue_address: string
  display_order: number
  maximum_capacity?: number
  active: boolean
  seating_type: DiningSeatingType
}

export interface UpdateDiningOptionRequest extends CreateDiningOptionRequest {
  id: string
}

// Utility types for display
export interface DiningOptionDisplay extends DiningOption {
  formatted_date: string
  formatted_time: string
  seating_description: string
  capacity_display: string
}

// Helper function to create display version
export const createDiningOptionDisplay = (diningOption: DiningOption): DiningOptionDisplay => {
  const seatingType = DINING_SEATING_TYPES.find(type => type.value === diningOption.seating_type)
  
  return {
    ...diningOption,
    formatted_date: formatDiningDateForDisplay(diningOption.date),
    formatted_time: formatDiningTimeForDisplay(diningOption.time),
    seating_description: seatingType?.description || '',
    capacity_display: diningOption.maximum_capacity 
      ? `${diningOption.maximum_capacity} attendees`
      : 'No capacity limit'
  }
}
