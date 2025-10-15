/**
 * Enhanced Sponsor Service with Standardized Company Integration
 * Uses standardized_companies table as source of truth for logos and URLs
 * Story: Standardized Company Integration for Sponsors Page
 */

import { Sponsor } from '../types/sponsor';
import { StandardizedCompany } from '../types/standardizedCompany';
import { companyNormalizationService } from './companyNormalizationService';
import { sponsorService } from './sponsorService';

export interface EnhancedSponsor extends Sponsor {
  // Override logo and website with standardized company data
  logo: string;
  website: string;
  // Add standardized company metadata
  standardizedCompany?: StandardizedCompany;
  // Track data source
  logoSource: 'standardized' | 'sponsor_table' | 'fallback';
  websiteSource: 'standardized' | 'sponsor_table' | 'fallback';
}

export class EnhancedSponsorService {
  /**
   * Get sponsors with standardized company data as source of truth
   */
  async getSponsorsWithStandardizedData(): Promise<EnhancedSponsor[]> {
    // 1. Get base sponsor data
    const sponsorsResponse = await sponsorService.getAllSponsors();
    if (!sponsorsResponse.success) {
      throw new Error(`Failed to fetch sponsors: ${sponsorsResponse.error}`);
    }

    // 2. Ensure company normalization service is initialized
    if (!companyNormalizationService.isInitialized) {
      await companyNormalizationService.initialize();
    }

    // 3. Enhance each sponsor with standardized company data
    const enhancedSponsors: EnhancedSponsor[] = sponsorsResponse.data.map(sponsor => {
      const standardizedCompany = companyNormalizationService.normalizeCompanyName(sponsor.name);
      
      return {
        ...sponsor,
        // Use standardized company data as primary source
        logo: standardizedCompany?.logo || sponsor.logo || '',
        website: standardizedCompany?.website || sponsor.website || '',
        standardizedCompany,
        logoSource: standardizedCompany?.logo ? 'standardized' : 
                   sponsor.logo ? 'sponsor_table' : 'fallback',
        websiteSource: standardizedCompany?.website ? 'standardized' : 
                      sponsor.website ? 'sponsor_table' : 'fallback'
      };
    });

    return enhancedSponsors;
  }

  /**
   * Get active sponsors with standardized company data
   */
  async getActiveSponsorsWithStandardizedData(): Promise<EnhancedSponsor[]> {
    const allSponsors = await this.getSponsorsWithStandardizedData();
    return allSponsors.filter(sponsor => sponsor.is_active);
  }

  /**
   * Get sponsor statistics for monitoring
   */
  getSponsorStats(sponsors: EnhancedSponsor[]): {
    total: number;
    withStandardizedLogos: number;
    withStandardizedWebsites: number;
    fallbackLogos: number;
    fallbackWebsites: number;
  } {
    return {
      total: sponsors.length,
      withStandardizedLogos: sponsors.filter(s => s.logoSource === 'standardized').length,
      withStandardizedWebsites: sponsors.filter(s => s.websiteSource === 'standardized').length,
      fallbackLogos: sponsors.filter(s => s.logoSource === 'fallback').length,
      fallbackWebsites: sponsors.filter(s => s.websiteSource === 'fallback').length
    };
  }
}

// Export singleton instance
export const enhancedSponsorService = new EnhancedSponsorService();
