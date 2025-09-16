/**
 * Hotel Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { BaseTransformer } from './baseTransformer'
import { FieldMapping, ComputedField, ValidationRule } from '../types/transformation'
import type { Hotel } from '../types/hotel'

export class HotelTransformer extends BaseTransformer<Hotel> {
  constructor() {
    const fieldMappings: FieldMapping[] = [
      { source: 'id', target: 'id', type: 'string', required: true },
      { source: 'name', target: 'name', type: 'string', required: true },
      { source: 'address', target: 'address', type: 'string', defaultValue: '' },
      { source: 'city', target: 'city', type: 'string', defaultValue: '' },
      { source: 'state', target: 'state', type: 'string', defaultValue: '' },
      { source: 'zip_code', target: 'zip_code', type: 'string', defaultValue: '' },
      { source: 'phone', target: 'phone', type: 'string', defaultValue: '' },
      { source: 'website_url', target: 'website_url', type: 'string', defaultValue: '' },
      { source: 'description', target: 'description', type: 'string', defaultValue: '' },
      { source: 'amenities', target: 'amenities', type: 'array', defaultValue: [] },
      { source: 'room_rate', target: 'room_rate', type: 'number', defaultValue: 0 },
      { source: 'distance_from_venue', target: 'distance_from_venue', type: 'number', defaultValue: 0 },
      { source: 'display_order', target: 'display_order', type: 'number', defaultValue: 0 },
      { source: 'is_active', target: 'isActive', type: 'boolean', defaultValue: true },
      { source: 'created_at', target: 'created_at', type: 'date' },
      { source: 'updated_at', target: 'updated_at', type: 'date' }
    ]

    const computedFields: ComputedField[] = [
      {
        name: 'fullAddress',
        sourceFields: ['address', 'city', 'state', 'zip_code'],
        computation: (data: any) => {
          const address = data.address || ''
          const city = data.city || ''
          const state = data.state || ''
          const zip = data.zip_code || ''
          
          const parts = [address, city, state, zip].filter(part => part.trim())
          return parts.join(', ')
        },
        type: 'string'
      },
      {
        name: 'hasWebsite',
        sourceFields: ['website_url'],
        computation: (data: any) => {
          return !!(data.website_url && data.website_url.trim())
        },
        type: 'boolean'
      },
      {
        name: 'hasAmenities',
        sourceFields: ['amenities'],
        computation: (data: any) => {
          const amenities = data.amenities || []
          return Array.isArray(amenities) && amenities.length > 0
        },
        type: 'boolean'
      },
      {
        name: 'amenitiesList',
        sourceFields: ['amenities'],
        computation: (data: any) => {
          const amenities = data.amenities || []
          return Array.isArray(amenities) ? amenities.join(', ') : ''
        },
        type: 'string'
      },
      {
        name: 'displayName',
        sourceFields: ['name', 'city'],
        computation: (data: any) => {
          const name = data.name || ''
          const city = data.city || ''
          return city ? `${name} - ${city}` : name
        },
        type: 'string'
      }
    ]

    const validationRules: ValidationRule[] = [
      {
        field: 'website_url',
        rule: (value: any) => {
          if (!value) return true // Optional field
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
        message: 'Invalid website URL format'
      },
      {
        field: 'phone',
        rule: (value: any) => {
          if (!value) return true // Optional field
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))
        },
        message: 'Invalid phone number format'
      },
      {
        field: 'room_rate',
        rule: (value: any) => {
          if (value === null || value === undefined) return true
          return typeof value === 'number' && value >= 0
        },
        message: 'Room rate must be a non-negative number'
      },
      {
        field: 'distance_from_venue',
        rule: (value: any) => {
          if (value === null || value === undefined) return true
          return typeof value === 'number' && value >= 0
        },
        message: 'Distance must be a non-negative number'
      }
    ]

    super(fieldMappings, 'hotels', 'Hotel', '1.0.0', computedFields, validationRules)
  }

  /**
   * Transform hotel data with schema evolution support
   */
  transformFromDatabase(dbData: any): Hotel {
    const evolvedData = this.handleSchemaEvolution(dbData)
    return super.transformFromDatabase(evolvedData)
  }

  /**
   * Handle database schema evolution for hotels
   */
  private handleSchemaEvolution(dbData: any): any {
    const evolved = { ...dbData }

    // Example: Handle field rename from website to website_url
    if (evolved.website && !evolved.website_url) {
      evolved.website_url = evolved.website
    }

    // Example: Handle field rename from zip to zip_code
    if (evolved.zip && !evolved.zip_code) {
      evolved.zip_code = evolved.zip
    }

    // Example: Handle field rename from rate to room_rate
    if (evolved.rate !== undefined && evolved.room_rate === undefined) {
      evolved.room_rate = evolved.rate
    }

    // Example: Handle field rename from distance to distance_from_venue
    if (evolved.distance !== undefined && evolved.distance_from_venue === undefined) {
      evolved.distance_from_venue = evolved.distance
    }

    // Example: Handle field rename from order to display_order
    if (evolved.order !== undefined && evolved.display_order === undefined) {
      evolved.display_order = evolved.order
    }

    // Example: Handle type changes
    if (typeof evolved.is_active === 'string') {
      evolved.is_active = evolved.is_active === 'true' || evolved.is_active === '1'
    }

    if (typeof evolved.room_rate === 'string') {
      const rate = parseFloat(evolved.room_rate)
      evolved.room_rate = isNaN(rate) ? 0 : rate
    }

    if (typeof evolved.distance_from_venue === 'string') {
      const distance = parseFloat(evolved.distance_from_venue)
      evolved.distance_from_venue = isNaN(distance) ? 0 : distance
    }

    if (typeof evolved.display_order === 'string') {
      const order = parseInt(evolved.display_order)
      evolved.display_order = isNaN(order) ? 0 : order
    }

    return evolved
  }

  /**
   * Get field mapping for schema evolution documentation
   */
  getSchemaEvolutionMapping(): Record<string, string> {
    return {
      'website': 'website_url',       // Database field -> UI field
      'zip': 'zip_code',
      'rate': 'room_rate',
      'distance': 'distance_from_venue',
      'order': 'display_order',
      'active': 'isActive'
    }
  }

  /**
   * Validate hotel-specific business rules
   */
  validateHotel(hotel: Hotel): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!hotel.name?.trim()) {
      errors.push('Hotel name is required')
    }

    if (hotel.website_url && !this.isValidUrl(hotel.website_url)) {
      errors.push('Invalid website URL format')
    }

    if (hotel.phone && !this.isValidPhone(hotel.phone)) {
      errors.push('Invalid phone number format')
    }

    if (hotel.room_rate !== undefined && hotel.room_rate < 0) {
      errors.push('Room rate cannot be negative')
    }

    if (hotel.distance_from_venue !== undefined && hotel.distance_from_venue < 0) {
      errors.push('Distance cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  /**
   * Sort hotels by display order and name
   */
  sortHotels(hotels: Hotel[]): Hotel[] {
    return [...hotels].sort((a, b) => {
      // First sort by display order
      const orderA = a.display_order || 0
      const orderB = b.display_order || 0
      if (orderA !== orderB) return orderA - orderB
      
      // Then sort by name
      return (a.name || '').localeCompare(b.name || '')
    })
  }

  /**
   * Filter active hotels
   */
  filterActiveHotels(hotels: Hotel[]): Hotel[] {
    return hotels.filter(hotel => hotel.isActive !== false)
  }

  /**
   * Sort hotels by distance from venue
   */
  sortHotelsByDistance(hotels: Hotel[]): Hotel[] {
    return [...hotels].sort((a, b) => {
      const distanceA = a.distance_from_venue || 0
      const distanceB = b.distance_from_venue || 0
      return distanceA - distanceB
    })
  }
}
