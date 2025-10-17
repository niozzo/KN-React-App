/**
 * Database Types - Generated from actual Supabase schema
 * Based on Story 1.2: Database Integration & Data Access Layer Setup
 */

// ============================================================================
// ATTENDEES TABLE (235 records)
// ============================================================================

export interface Attendee {
  id: string;
  // Personal Information
  salutation: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company: string;
  bio: string;
  photo: string;
  
  // Contact Information
  business_phone: string;
  mobile_phone: string;
  address1: string;
  address2: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  
  // Event Preferences
  check_in_date: string;
  check_out_date: string;
  hotel_selection: string;
  custom_hotel: string;
  registration_id: string;
  has_spouse: boolean;
  spouse_details: {
    email: string;
    lastName: string;
    firstName: string;
    salutation: string;
    mobilePhone: string;
    dietaryRequirements: string;
  };
  dining_selections: {
    [key: string]: {
      attending: boolean;
    };
  };
  selected_breakouts: string[];
  registration_status: string;
  access_code: string; // Used for authentication
  attributes: {
    ceo: boolean;
    apaxIP: boolean;
    spouse: boolean;
    apaxOEP: boolean;
    speaker: boolean;
    cLevelExec: boolean;
    sponsorAttendee: boolean;
    otherAttendeeType: boolean;
    portfolioCompanyExecutive: boolean;
  };
  dietary_requirements: string;
  
  // Assistant Information
  assistant_name: string;
  assistant_email: string;
  
  // System Fields
  idloom_id: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  is_cfo: boolean;
  is_apax_ep: boolean;
  primary_attendee_id: string | null;
  is_spouse: boolean;
  company_name_standardized: string;
}

// ============================================================================
// SPONSORS TABLE (27 records)
// ============================================================================

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEAT ASSIGNMENTS TABLE (48 records)
// ============================================================================

export interface SeatAssignment {
  id: string;
  seating_configuration_id: string;
  attendee_id: string;
  table_name: string;
  seat_number: number;
  seat_position: {
    x: number;
    y: number;
  };
  assignment_type: string;
  assigned_at: string;
  notes: string;
  column_number: number;
  row_number: number;
  attendee_first_name: string;
  attendee_last_name: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AGENDA ITEMS TABLE (0 records - empty, ready for data)
// ============================================================================

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  location: string;
  type: string; // executive-presentation, breakout-session, etc.
  speaker: string | null;
  capacity: number;
  registered_count: number;
  attendee_selection: string; // "everyone", "selected", etc.
  selected_attendees: string[]; // Array of attendee IDs
  is_active: boolean;
  seating_notes: string;
  seating_type: string; // "open", "assigned"
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AGENDA ITEM SPEAKERS TABLE (38 records - speaker assignments from main DB)
// ============================================================================

export interface AgendaItemSpeaker {
  id: string;
  agenda_item_id: string;
  attendee_id: string;
  speaker_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DINING OPTIONS TABLE (0 records - empty, ready for data)
// ============================================================================

export interface DiningOption {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  address: string;
  address_validated: boolean;
  capacity: number;
  has_table_assignments: boolean;
  tables: Array<{
    table_name: string;
    capacity: number;
    position: { x: number; y: number };
  }>;
  layout_template_id: string;
  seating_notes: string;
  seating_type: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// ============================================================================
// HOTELS TABLE (0 records - empty, ready for data)
// ============================================================================

export interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AccessCodeAuthRequest {
  access_code: string;
}

export interface AccessCodeAuthResponse {
  success: boolean;
  attendee?: Attendee;
  error?: string;
}

export interface AuthSession {
  attendee: Attendee;
  isAuthenticated: boolean;
  expiresAt: string;
}

// Sanitized attendee type for storage (excludes sensitive access_code)
export type SanitizedAttendee = Omit<Attendee, 'access_code'>

// Sanitized auth session for storage (excludes access_code from attendee)
export interface SanitizedAuthSession {
  attendee: SanitizedAttendee;
  isAuthenticated: boolean;
  expiresAt: string;
}

// ============================================================================
// DATABASE OPERATION TYPES
// ============================================================================

export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
  success: boolean;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface AttendeeService {
  getAllAttendees(): Promise<PaginatedResponse<Attendee>>;
  getAttendeeById(id: string): Promise<DatabaseResponse<Attendee>>;
  getAttendeeByAccessCode(accessCode: string): Promise<DatabaseResponse<Attendee>>;
  searchAttendees(query: string): Promise<PaginatedResponse<Attendee>>;
}

export interface SponsorService {
  getAllSponsors(): Promise<PaginatedResponse<Sponsor>>;
  getActiveSponsors(): Promise<PaginatedResponse<Sponsor>>;
  getSponsorById(id: string): Promise<DatabaseResponse<Sponsor>>;
}

export interface SeatAssignmentService {
  getSeatAssignmentsByAttendee(attendeeId: string): Promise<PaginatedResponse<SeatAssignment>>;
  getSeatAssignmentsByTable(tableName: string): Promise<PaginatedResponse<SeatAssignment>>;
  createSeatAssignment(assignment: Omit<SeatAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<SeatAssignment>>;
}

export interface AgendaService {
  getAllAgendaItems(): Promise<PaginatedResponse<AgendaItem>>;
  getAgendaItemById(id: string): Promise<DatabaseResponse<AgendaItem>>;
  getAgendaItemsByDate(date: string): Promise<PaginatedResponse<AgendaItem>>;
  createAgendaItem(item: Omit<AgendaItem, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResponse<AgendaItem>>;
}

export interface DiningService {
  getAllDiningOptions(): Promise<PaginatedResponse<DiningOption>>;
  getDiningOptionById(id: string): Promise<DatabaseResponse<DiningOption>>;
  getDiningOptionsByDate(date: string): Promise<PaginatedResponse<DiningOption>>;
  createDiningOption(option: Omit<DiningOption, 'id' | 'created_at'>): Promise<DatabaseResponse<DiningOption>>;
}

export interface HotelService {
  getAllHotels(): Promise<PaginatedResponse<Hotel>>;
  getActiveHotels(): Promise<PaginatedResponse<Hotel>>;
  getHotelById(id: string): Promise<DatabaseResponse<Hotel>>;
  createHotel(hotel: Omit<Hotel, 'id' | 'created_at'>): Promise<DatabaseResponse<Hotel>>;
}

export interface AccessCodeAuthService {
  authenticateWithAccessCode(accessCode: string): Promise<AccessCodeAuthResponse>;
  validateAccessCode(accessCode: string): Promise<boolean>;
  getCurrentSession(): Promise<AuthSession | null>;
  signOut(): Promise<boolean>;
}
