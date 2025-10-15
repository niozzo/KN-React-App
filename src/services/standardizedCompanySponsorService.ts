/**
 * Standardized Company Sponsor Service
 * Uses standardized_companies table as the single source of truth for sponsors
 * Sponsors are identified by fund_analytics_category === "Sponsors & Vendors"
 */

import { StandardizedCompany } from '../types/standardizedCompany';

export class StandardizedCompanySponsorService {
  /**
   * Get all sponsors from standardized_companies table
   * Filters by fund_analytics_category === "Sponsors & Vendors"
   * Returns companies sorted alphabetically by name
   */
  async getSponsors(): Promise<StandardizedCompany[]> {
    try {
      // Get all standardized companies from cache
      const companies = await this.getAllStandardizedCompanies();
      
      // Filter for sponsors
      const sponsors = companies.filter(c => 
        c.fund_analytics_category === "Sponsors & Vendors"
      );
      
      // CRITICAL: Handle case where no sponsors found
      if (sponsors.length === 0) {
        console.warn('⚠️ No companies found with category "Sponsors & Vendors"');
        // Return empty array rather than error - allows graceful degradation
        return [];
      }
      
      // Sort alphabetically by company name
      return sponsors.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('❌ Error fetching sponsors from standardized companies:', error);
      throw error;
    }
  }

  /**
   * Get all standardized companies from localStorage cache
   * Falls back to empty array if cache is not available
   */
  private async getAllStandardizedCompanies(): Promise<StandardizedCompany[]> {
    try {
      // Try localStorage cache first (populated during login sync)
      const cachedData = localStorage.getItem('kn_cache_standardized_companies');
      
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData);
        const companies = cacheObj.data || cacheObj;
        
        if (Array.isArray(companies) && companies.length > 0) {
          console.log('✅ Using cached standardized companies from localStorage');
          return companies;
        }
      }
      
      // If no cache, log warning and return empty array
      console.warn('⚠️ No cached standardized companies found');
      return [];
      
    } catch (error) {
      console.error('❌ Error reading standardized companies cache:', error);
      return [];
    }
  }

  /**
   * Get sponsor by name
   * @param name - Company name to search for
   */
  async getSponsorByName(name: string): Promise<StandardizedCompany | null> {
    const sponsors = await this.getSponsors();
    return sponsors.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Get count of sponsors
   */
  async getSponsorsCount(): Promise<number> {
    const sponsors = await this.getSponsors();
    return sponsors.length;
  }
}

// Export singleton instance
export const standardizedCompanySponsorService = new StandardizedCompanySponsorService();

