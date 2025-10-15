/**
 * Standardized Company Transformer
 * Centralizes filtering and transformation logic for standardized_companies data
 * Used by both serverDataSyncService and pwaDataSyncService to ensure consistency
 */

import { StandardizedCompany } from '../types/standardizedCompany';

export class StandardizedCompanyTransformer {
  /**
   * Filter confidential fields before caching
   * Removes internal planning data that should not be cached on client devices
   * 
   * @param companies - Raw company records from database
   * @returns Filtered company records safe for client-side caching
   */
  filterForCache(companies: any[]): StandardizedCompany[] {
    return companies.map(company => {
      // Remove confidential fields
      const { 
        seating_notes,              // Internal seating planning notes
        priority_companies,          // Internal priority flags
        priority_networking_attendees, // Internal networking priorities
        ...filteredCompany 
      } = company;
      
      // Fix website URLs - add www. if missing for .com domains
      // This ensures consistent URL formatting across all companies
      if (filteredCompany.website && 
          filteredCompany.website.startsWith('https://') && 
          !filteredCompany.website.includes('www.') &&
          filteredCompany.website.endsWith('.com')) {
        filteredCompany.website = filteredCompany.website.replace('https://', 'https://www.');
      }
      
      return filteredCompany as StandardizedCompany;
    });
  }

  /**
   * Sort companies alphabetically by name
   * 
   * @param companies - Company records to sort
   * @returns Sorted company records
   */
  sortCompanies(companies: StandardizedCompany[]): StandardizedCompany[] {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filter companies by category
   * 
   * @param companies - Company records to filter
   * @param category - fund_analytics_category to filter by
   * @returns Filtered company records
   */
  filterByCategory(companies: StandardizedCompany[], category: string): StandardizedCompany[] {
    return companies.filter(c => c.fund_analytics_category === category);
  }

  /**
   * Complete transformation pipeline for database records
   * Filters confidential data and sorts alphabetically
   * 
   * @param companies - Raw company records from database
   * @returns Fully transformed company records
   */
  transformArrayFromDatabase(companies: any[]): StandardizedCompany[] {
    const filtered = this.filterForCache(companies);
    return this.sortCompanies(filtered);
  }
}

// Export singleton instance for convenience
export const standardizedCompanyTransformer = new StandardizedCompanyTransformer();

