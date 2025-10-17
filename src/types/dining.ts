// TypeScript interfaces for Dining Options based on actual database schema
// Generated from real database data via authenticated Supabase API

export type DiningSeatingType = 
  | 'open'
  | 'assigned'

export interface TableConfig {
  name: string
  capacity: number
}

export interface DiningOption {
  // Primary fields (auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Event Details (Actual database fields)
  name: string                 // Event name (actual field name)
  date: string                 // Date in YYYY-MM-DD format
  time: string                 // Time in HH:MM:SS format
  location: string             // Location string
  address: string              // Venue address
  address_validated: boolean   // Whether address has been validated
  
  // Capacity and Seating
  capacity: number             // Maximum capacity
  tables: TableConfig[]        // Table configuration array
  layout_template_id: string | null // Layout template reference
  seating_notes: string        // Seating configuration notes
  seating_type: DiningSeatingType // Seating type (open/assigned)
  
  // Status and Display
  is_active: boolean           // Active status
  display_order: number        // Display order for UI
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
    value: 'open', 
    label: 'Open Seating',
    description: 'Guests can sit anywhere'
  },
  { 
    value: 'assigned', 
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
  return seatingType === 'assigned'
}

export const isDiningOptionActive = (diningOption: DiningOption): boolean => {
  return diningOption.is_active
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
    capacity_display: diningOption.capacity 
      ? `${diningOption.capacity} attendees`
      : 'No capacity limit'
  }
}
