/**
 * Centralized table mappings configuration
 * Single source of truth for all table name mappings across the application
 */

export const TABLE_MAPPINGS = {
  application: {
    speaker_assignments: 'speaker_assignments',
    agenda_item_metadata: 'agenda_item_metadata',
    attendee_metadata: 'attendee_metadata',
    dining_item_metadata: 'dining_item_metadata'
  },
  main: {
    attendees: 'attendees',
    sponsors: 'sponsors', // DEPRECATED: Will be removed after migration
    standardized_companies: 'standardized_companies',
    company_aliases: 'company_aliases',
    seat_assignments: 'seat_assignments',
    agenda_items: 'agenda_items',
    dining_options: 'dining_options',
    hotels: 'hotels',
    seating_configurations: 'seating_configurations',
    user_profiles: 'user_profiles'
  }
} as const;

// Type definitions for type safety
export type ApplicationTableName = keyof typeof TABLE_MAPPINGS.application;
export type MainTableName = keyof typeof TABLE_MAPPINGS.main;
export type AllTableName = ApplicationTableName | MainTableName;

// Helper functions for type-safe table lookups
export function getApplicationTableName(tableName: ApplicationTableName): string {
  return TABLE_MAPPINGS.application[tableName];
}

export function getMainTableName(tableName: MainTableName): string {
  return TABLE_MAPPINGS.main[tableName];
}

export function getAllApplicationTables(): ApplicationTableName[] {
  return Object.keys(TABLE_MAPPINGS.application) as ApplicationTableName[];
}

export function getAllMainTables(): MainTableName[] {
  return Object.keys(TABLE_MAPPINGS.main) as MainTableName[];
}

// Validation function to ensure table exists in mappings
export function isValidApplicationTable(tableName: string): tableName is ApplicationTableName {
  return tableName in TABLE_MAPPINGS.application;
}

export function isValidMainTable(tableName: string): tableName is MainTableName {
  return tableName in TABLE_MAPPINGS.main;
}
