// TypeScript interfaces for Sponsors based on actual database schema
// Generated from real database data via authenticated Supabase API
//
// ⚠️ DEPRECATED: Use StandardizedCompany from standardizedCompany.ts instead
// The sponsors table is deprecated. Use standardized_companies table.

export interface Sponsor {
  // Primary fields (auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // Sponsor Details (Actual database fields)
  name: string               // Company name (actual field name)
  logo: string              // Logo URL (actual field name)
  website: string           // Website URL (can be empty)
  
  // Status and Display
  is_active: boolean        // Active status (actual field name)
  display_order: number     // Display order for UI
}

// Form data interface for creating/editing sponsors
export interface SponsorFormData {
  company_name: string
  logo_url: string
  display_order: number
  website?: string
  active: boolean
}

// Logo management interfaces
export interface LogoFetchRequest {
  website: string
  company_name?: string
}

export interface LogoFetchResponse {
  logo_url: string
  source: LogoSource
  success: boolean
  error?: string
}

export type LogoSource = 
  | 'clearbit'
  | 'logo-dev'
  | 'favicon'
  | 'manual'

// Logo preview interface
export interface LogoPreview {
  url: string
  source: LogoSource
  isLoaded: boolean
  error?: string
}

// Validation rules based on UI form requirements
export interface SponsorValidation {
  company_name: {
    required: boolean
    maxLength: number
    message: string
  }
  logo_url: {
    required: boolean
    format: 'url'
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

// Constants for logo sources
export const LOGO_SOURCES: { 
  value: LogoSource; 
  label: string; 
  description: string 
}[] = [
  { 
    value: 'clearbit', 
    label: 'Clearbit',
    description: 'Professional logo service'
  },
  { 
    value: 'logo-dev', 
    label: 'Logo.dev',
    description: 'Logo API service'
  },
  { 
    value: 'favicon', 
    label: 'Company Favicon',
    description: 'Website favicon'
  },
  { 
    value: 'manual', 
    label: 'Manual Upload',
    description: 'User uploaded logo'
  }
]

// Helper functions
export const validateLogoUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const extractDomainFromWebsite = (website: string): string => {
  try {
    const url = new URL(website)
    return url.hostname
  } catch {
    return website
  }
}

export const generateClearbitLogoUrl = (website: string): string => {
  const domain = extractDomainFromWebsite(website)
  return `https://logo.clearbit.com/${domain}`
}

export const isSponsorActive = (sponsor: Sponsor): boolean => {
  return sponsor.active
}

export const sortSponsorsByDisplayOrder = (sponsors: Sponsor[]): Sponsor[] => {
  return [...sponsors].sort((a, b) => a.display_order - b.display_order)
}

// API response types
export interface SponsorResponse {
  data: Sponsor[]
  error?: string
}

export interface CreateSponsorRequest {
  company_name: string
  logo_url: string
  display_order: number
  website?: string
  active: boolean
}

export interface UpdateSponsorRequest extends CreateSponsorRequest {
  id: string
}

// Logo fetching API types
export interface FetchLogoRequest {
  website: string
  company_name?: string
}

export interface FetchLogoResponse {
  logo_url: string
  source: LogoSource
  success: boolean
  error?: string
}

// Utility types for display
export interface SponsorDisplay extends Sponsor {
  formatted_website: string
  logo_preview: LogoPreview
  is_active_display: string
}

// Helper function to create display version
export const createSponsorDisplay = (sponsor: Sponsor): SponsorDisplay => {
  return {
    ...sponsor,
    formatted_website: sponsor.website || 'No website',
    logo_preview: {
      url: sponsor.logo_url,
      source: 'manual', // Default, could be enhanced to track actual source
      isLoaded: true
    },
    is_active_display: sponsor.active ? 'Active' : 'Inactive'
  }
}

// Carousel-specific types
export interface SponsorCarouselItem {
  sponsor: Sponsor
  logo_url: string
  company_name: string
  website?: string
  display_order: number
}

export const createCarouselItems = (sponsors: Sponsor[]): SponsorCarouselItem[] => {
  return sponsors
    .filter(sponsor => sponsor.active)
    .sort((a, b) => a.display_order - b.display_order)
    .map(sponsor => ({
      sponsor,
      logo_url: sponsor.logo_url,
      company_name: sponsor.company_name,
      website: sponsor.website,
      display_order: sponsor.display_order
    }))
}
