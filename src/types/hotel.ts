// TypeScript interfaces for Hotels based on UI analysis
// Generated from admin interface screenshots

export interface Hotel {
  // Primary fields (auto-generated)
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

// Form data interface for creating/editing hotels
export interface HotelFormData {
  hotel_name: string
  phone_number: string
  address: string
  display_order: number
  website?: string
  active: boolean
}

// Validation rules based on UI form requirements
export interface HotelValidation {
  hotel_name: {
    required: boolean
    maxLength: number
    message: string
  }
  phone_number: {
    required: boolean
    format: string
    message: string
  }
  address: {
    required: boolean
    maxLength: number
    message: string
  }
  display_order: {
    required: boolean
    min: number
    message: string
  }
  website: {
    required: boolean
    format: 'url'
    message: string
  }
}

// Helper functions
export const formatPhoneNumber = (phone: string): string => {
  // Format phone number for display (e.g., (312) 280-8800)
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

export const validateWebsite = (website: string): boolean => {
  try {
    new URL(website)
    return true
  } catch {
    return false
  }
}

export const isHotelActive = (hotel: Hotel): boolean => {
  return hotel.active
}

export const sortHotelsByDisplayOrder = (hotels: Hotel[]): Hotel[] => {
  return [...hotels].sort((a, b) => a.display_order - b.display_order)
}

// API response types
export interface HotelResponse {
  data: Hotel[]
  error?: string
}

export interface CreateHotelRequest {
  hotel_name: string
  phone_number: string
  address: string
  display_order: number
  website?: string
  active: boolean
}

export interface UpdateHotelRequest extends CreateHotelRequest {
  id: string
}

// Utility types for display
export interface HotelDisplay extends Hotel {
  formatted_phone: string
  formatted_website: string
  is_active_display: string
  selection_count?: number
}

// Helper function to create display version
export const createHotelDisplay = (hotel: Hotel, selectionCount?: number): HotelDisplay => {
  return {
    ...hotel,
    formatted_phone: formatPhoneNumber(hotel.phone_number),
    formatted_website: hotel.website || 'No website',
    is_active_display: hotel.active ? 'Active' : 'Inactive',
    selection_count: selectionCount
  }
}

// Hotel selection types (for attendee integration)
export interface HotelSelection {
  hotel_id: string
  hotel_name: string
  check_in_date: string
  check_out_date: string
  room_type?: string
  custom_hotel?: string
}

// Hotel statistics for admin dashboard
export interface HotelStats {
  hotel: Hotel
  total_selections: number
  active_selections: number
  room_types: string[]
  average_stay_duration: number
}

// Query types for hotel management
export interface HotelQuery {
  active_only?: boolean
  search_term?: string
  sort_by?: 'display_order' | 'hotel_name' | 'selection_count'
  sort_order?: 'asc' | 'desc'
}

// Hotel selection analytics
export interface HotelSelectionAnalytics {
  hotel_id: string
  hotel_name: string
  selection_count: number
  percentage_of_total: number
  most_popular_room_type: string
  average_check_in_date: string
  average_check_out_date: string
}

// Helper function to get hotel selection analytics
export const getHotelSelectionAnalytics = async (
  hotelId: string, 
  attendees: any[]
): Promise<HotelSelectionAnalytics> => {
  const hotelSelections = attendees.filter(attendee => 
    attendee.hotel_selection === hotelId || 
    attendee.custom_hotel?.toLowerCase().includes(hotelId.toLowerCase())
  )
  
  const totalSelections = attendees.length
  const selectionCount = hotelSelections.length
  
  // Calculate room type popularity
  const roomTypes = hotelSelections.map(selection => selection.room_type).filter(Boolean)
  const roomTypeCounts = roomTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostPopularRoomType = Object.entries(roomTypeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown'
  
  // Calculate average dates
  const checkInDates = hotelSelections.map(selection => selection.check_in_date).filter(Boolean)
  const checkOutDates = hotelSelections.map(selection => selection.check_out_date).filter(Boolean)
  
  return {
    hotel_id: hotelId,
    hotel_name: hotelSelections[0]?.hotel_selection || 'Unknown',
    selection_count: selectionCount,
    percentage_of_total: totalSelections > 0 ? (selectionCount / totalSelections) * 100 : 0,
    most_popular_room_type: mostPopularRoomType,
    average_check_in_date: checkInDates[0] || 'N/A',
    average_check_out_date: checkOutDates[0] || 'N/A'
  }
}
