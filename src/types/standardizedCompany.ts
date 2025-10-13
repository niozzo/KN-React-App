// TypeScript interface for Standardized Companies based on database schema
// Story 8.7: Company Name Normalization via Application-Side Transformation

/**
 * Standardized Company Interface
 * Master company reference table with canonical names and rich business metadata
 */
export interface StandardizedCompany {
  // Primary fields (auto-generated)
  /** Unique identifier for the company */
  id: string
  /** Record creation timestamp */
  created_at: string
  /** Record last update timestamp */
  updated_at: string
  
  // Company Core Information
  /** Canonical company name - single source of truth */
  name: string
  /** Company business sector (e.g., "Services", "Tech", "Vendors/Sponsors", "Healthcare", "Apax Digital", "Impact") */
  sector: string
  /** Geographic region (e.g., "US", "EU", "Global") */
  geography: string
  /** Company subsector for detailed categorization */
  subsector?: string
  
  // Branding & Contact
  /** Company logo URL (Clearbit logo service or custom) */
  logo?: string
  /** Company website URL */
  website?: string
  
  // Corporate Hierarchy
  /** Whether this company is a parent company */
  is_parent_company?: boolean
  /** Reference to parent company if this is a subsidiary */
  parent_company_id?: string | null
  
  // Event & Business Context
  /** Notes related to seating preferences or requirements */
  seating_notes?: string
  /** Flag indicating priority companies for networking events */
  priority_companies?: boolean
  /** Category for fund analytics and reporting */
  fund_analytics_category?: string
  /** Company description or additional notes */
  description?: string
  /** Array of attendee IDs marked as priority for networking */
  priority_networking_attendees?: string[]
}

