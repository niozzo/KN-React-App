/**
 * Fallback utilities for sponsor logo/website resolution
 * Provides Clearbit logo service integration and fallback strategies
 */

/**
 * Generate Clearbit logo URL for a company
 * @param companyName - Company name to generate logo for
 * @returns Clearbit logo URL
 */
export const generateClearbitLogoUrl = (companyName: string): string => {
  if (!companyName || typeof companyName !== 'string') {
    return '';
  }
  
  // Clean company name for URL
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Extract domain-like part (first word or common patterns)
  const domainPart = cleanName.split(' ')[0];
  
  return `https://logo.clearbit.com/${domainPart}.com`;
};

/**
 * Get sponsor logo with fallback strategy
 * Priority: standardized company logo > sponsor table logo > Clearbit fallback
 * @param sponsor - Sponsor object with logo and logoSource
 * @returns Logo URL with fallback
 */
export const getSponsorLogoWithFallback = (sponsor: any): string => {
  // Priority 1: Use existing logo if available
  if (sponsor.logo && sponsor.logo.trim()) {
    return sponsor.logo;
  }
  
  // Priority 2: Generate Clearbit fallback
  return generateClearbitLogoUrl(sponsor.name);
};

/**
 * Get sponsor website with fallback strategy
 * Priority: standardized company website > sponsor table website > empty string
 * @param sponsor - Sponsor object with website and websiteSource
 * @returns Website URL with fallback
 */
export const getSponsorWebsiteWithFallback = (sponsor: any): string => {
  // Return website if available, otherwise empty string
  return sponsor.website || '';
};

/**
 * Check if a logo URL is from Clearbit service
 * @param logoUrl - Logo URL to check
 * @returns True if URL is from Clearbit
 */
export const isClearbitLogo = (logoUrl: string): boolean => {
  return logoUrl.includes('logo.clearbit.com');
};

/**
 * Get logo source description for debugging
 * @param sponsor - Sponsor object with logoSource
 * @returns Human-readable source description
 */
export const getLogoSourceDescription = (sponsor: any): string => {
  switch (sponsor.logoSource) {
    case 'standardized':
      return 'Standardized Company Database';
    case 'sponsor_table':
      return 'Sponsor Table';
    case 'fallback':
      return 'Clearbit Fallback';
    default:
      return 'Unknown';
  }
};

/**
 * Get website source description for debugging
 * @param sponsor - Sponsor object with websiteSource
 * @returns Human-readable source description
 */
export const getWebsiteSourceDescription = (sponsor: any): string => {
  switch (sponsor.websiteSource) {
    case 'standardized':
      return 'Standardized Company Database';
    case 'sponsor_table':
      return 'Sponsor Table';
    case 'fallback':
      return 'No Website Available';
    default:
      return 'Unknown';
  }
};
