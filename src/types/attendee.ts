// TypeScript interfaces for Attendees based on actual database schema
// Generated from real database data via authenticated Supabase API

export interface AttendeeAttributes {
  ceo: boolean
  apaxIP: boolean
  spouse: boolean
  apaxOEP: boolean
  speaker: boolean
  cLevelExec: boolean
  sponsorAttendee: boolean
  otherAttendeeType: boolean
  portfolioCompanyExecutive: boolean
}

export interface SpouseDetails {
  email: string
  lastName: string
  firstName: string
  salutation: string
  mobilePhone: string
  dietaryRequirements: string
}

export interface DiningSelections {
  [key: string]: {
    attending: boolean
  }
}

export interface Attendee {
  // Primary fields (auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Personal Information
  salutation: string           // Dr, Mr, Ms, etc.
  first_name: string          // First name
  last_name: string           // Last name
  email: string               // Email address
  title: string               // Job title
  company: string             // Company name
  bio: string                 // Biography (can be empty)
  photo: string               // Photo URL (Clearbit logo service)
  
  // Contact Information
  business_phone: string      // Business phone number
  mobile_phone: string        // Mobile phone number
  
  // Address Information
  address1: string            // Address line 1
  address2: string            // Address line 2
  postal_code: string         // Postal/ZIP code
  city: string                // City
  state: string               // State/Province
  country: string             // Country name
  country_code: string        // Country code (US, CA, etc.)
  
  // Hotel Information
  check_in_date: string       // Check-in date (YYYY-MM-DD)
  check_out_date: string      // Check-out date (YYYY-MM-DD)
  hotel_selection: string     // Selected hotel ID
  custom_hotel: string        // Custom hotel name (if applicable)
  room_type: string           // Room type preference
  
  // Registration Information
  registration_id: string     // Registration ID
  registration_status: string // Registration status (confirmed, etc.)
  access_code: string         // Access code for event
  
  // Spouse Information
  has_spouse: boolean         // Whether attendee has spouse
  spouse_details: SpouseDetails // Spouse information object
  
  // Event Preferences
  dining_selections: DiningSelections // Dining event selections
  selected_breakouts: string[]        // Selected breakout sessions
  dietary_requirements: string        // Dietary requirements
  
  // Role Attributes
  attributes: AttendeeAttributes // Role-based attributes object
  is_cfo: boolean              // CFO flag
  is_apax_ep: boolean          // Apax EP flag
  
  // Assistant Information
  assistant_name: string       // Assistant name
  assistant_email: string      // Assistant email
  
  // External System Integration
  idloom_id: string           // IDloom system ID
  last_synced_at: string      // Last sync timestamp
}

// Sanitized attendee type for storage (excludes sensitive access_code)
export type SanitizedAttendee = Omit<Attendee, 'access_code'>

// Utility function to sanitize attendee data for storage
export const sanitizeAttendeeForStorage = (attendee: Attendee): SanitizedAttendee => {
  const { access_code, ...sanitizedAttendee } = attendee
  return sanitizedAttendee
}

// Form data interface for creating/editing attendees
export interface AttendeeFormData {
  salutation: string
  first_name: string
  last_name: string
  email: string
  title: string
  company: string
  business_phone: string
  mobile_phone: string
  address1: string
  address2?: string
  postal_code: string
  city: string
  state: string
  country: string
  country_code: string
  check_in_date: string
  check_out_date: string
  hotel_selection: string
  custom_hotel?: string
  room_type: string
  has_spouse: boolean
  spouse_details?: SpouseDetails
  dining_selections: DiningSelections
  selected_breakouts: string[]
  dietary_requirements?: string
  attributes: AttendeeAttributes
  is_cfo: boolean
  is_apax_ep: boolean
  assistant_name?: string
  assistant_email?: string
}

// API response types
export interface AttendeeResponse {
  data: Attendee[]
  error?: string
}

export interface CreateAttendeeRequest {
  salutation: string
  first_name: string
  last_name: string
  email: string
  title: string
  company: string
  business_phone: string
  mobile_phone: string
  address1: string
  address2?: string
  postal_code: string
  city: string
  state: string
  country: string
  country_code: string
  check_in_date: string
  check_out_date: string
  hotel_selection: string
  custom_hotel?: string
  room_type: string
  has_spouse: boolean
  spouse_details?: SpouseDetails
  dining_selections: DiningSelections
  selected_breakouts: string[]
  dietary_requirements?: string
  attributes: AttendeeAttributes
  is_cfo: boolean
  is_apax_ep: boolean
  assistant_name?: string
  assistant_email?: string
}

export interface UpdateAttendeeRequest extends CreateAttendeeRequest {
  id: string
}

// Helper functions
export const getFullName = (attendee: Attendee): string => {
  return `${attendee.salutation} ${attendee.first_name} ${attendee.last_name}`.trim()
}

export const getDisplayName = (attendee: Attendee): string => {
  return `${attendee.first_name} ${attendee.last_name}`
}

export const isCFO = (attendee: Attendee): boolean => {
  return attendee.is_cfo || attendee.attributes.cfo
}

export const isCEO = (attendee: Attendee): boolean => {
  return attendee.attributes.ceo
}

export const isApaxEP = (attendee: Attendee): boolean => {
  return attendee.is_apax_ep || attendee.attributes.apaxOEP
}

export const isSponsorAttendee = (attendee: Attendee): boolean => {
  return attendee.attributes.sponsorAttendee
}

export const hasSpouse = (attendee: Attendee): boolean => {
  return attendee.has_spouse && attendee.spouse_details.firstName !== ''
}

export const getSpouseName = (attendee: Attendee): string => {
  if (!hasSpouse(attendee)) return ''
  return `${attendee.spouse_details.salutation} ${attendee.spouse_details.firstName} ${attendee.spouse_details.lastName}`.trim()
}

// Constants for dropdown options
export const SALUTATIONS = [
  { value: 'Dr', label: 'Dr.' },
  { value: 'Mr', label: 'Mr.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Prof', label: 'Prof.' }
]

export const REGISTRATION_STATUSES = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' }
]

export const ROOM_TYPES = [
  { value: 'City or Lake-view King', label: 'City or Lake-view King' },
  { value: 'City or Lake-view Double', label: 'City or Lake-view Double' },
  { value: 'Standard King', label: 'Standard King' },
  { value: 'Standard Double', label: 'Standard Double' }
]
