/**
 * Integration Test: Sponsor Standardized Company Integration
 * Tests the integration between sponsors and standardized companies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enhancedSponsorService } from '../../services/enhancedSponsorService';
import { companyNormalizationService } from '../../services/companyNormalizationService';

// Mock the dependencies
vi.mock('../../services/sponsorService', () => ({
  sponsorService: {
    getAllSponsors: vi.fn()
  }
}));

vi.mock('../../services/companyNormalizationService', () => ({
  companyNormalizationService: {
    isInitialized: true,
    normalizeCompanyName: vi.fn()
  }
}));

describe('Sponsor Standardized Company Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enhance sponsors with standardized company data', async () => {
    // Mock sponsor data
    const mockSponsors = [
      {
        id: '1',
        name: 'Apax Partners',
        logo: 'old-logo-url',
        website: 'old-website-url',
        is_active: true,
        display_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Unknown Company',
        logo: '',
        website: '',
        is_active: true,
        display_order: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Mock standardized company data
    const mockStandardizedCompany = {
      id: 'std-1',
      name: 'Apax Partners',
      logo: 'https://logo.clearbit.com/apax.com',
      website: 'https://apax.com',
      sector: 'Private Equity',
      geography: 'Global',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    // Mock service responses
    const { sponsorService } = await import('../../services/sponsorService');
    vi.mocked(sponsorService.getAllSponsors).mockResolvedValue({
      success: true,
      data: mockSponsors,
      count: 2,
      error: null
    });

    vi.mocked(companyNormalizationService.normalizeCompanyName)
      .mockReturnValueOnce(mockStandardizedCompany) // For Apax Partners
      .mockReturnValueOnce(null); // For Unknown Company

    // Test the integration
    const result = await enhancedSponsorService.getSponsorsWithStandardizedData();

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check Apax Partners (should use standardized data)
    const apaxSponsor = result.find(s => s.name === 'Apax Partners');
    expect(apaxSponsor).toBeDefined();
    expect(apaxSponsor?.logo).toBe('https://logo.clearbit.com/apax.com');
    expect(apaxSponsor?.website).toBe('https://apax.com');
    expect(apaxSponsor?.logoSource).toBe('standardized');
    expect(apaxSponsor?.websiteSource).toBe('standardized');
    expect(apaxSponsor?.standardizedCompany).toEqual(mockStandardizedCompany);

    // Check Unknown Company (should fallback to sponsor table data)
    const unknownSponsor = result.find(s => s.name === 'Unknown Company');
    expect(unknownSponsor).toBeDefined();
    expect(unknownSponsor?.logo).toBe('');
    expect(unknownSponsor?.website).toBe('');
    expect(unknownSponsor?.logoSource).toBe('fallback');
    expect(unknownSponsor?.websiteSource).toBe('fallback');
    expect(unknownSponsor?.standardizedCompany).toBeUndefined();
  });

  it('should handle company normalization service not initialized', async () => {
    // Mock sponsor data
    const mockSponsors = [
      {
        id: '1',
        name: 'Test Company',
        logo: 'test-logo',
        website: 'test-website',
        is_active: true,
        display_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Mock service responses
    const { sponsorService } = await import('../../services/sponsorService');
    vi.mocked(sponsorService.getAllSponsors).mockResolvedValue({
      success: true,
      data: mockSponsors,
      count: 1,
      error: null
    });

    // Mock company normalization service as not initialized
    vi.mocked(companyNormalizationService).isInitialized = false;
    vi.mocked(companyNormalizationService.normalizeCompanyName).mockReturnValue(null);

    // Test the integration
    const result = await enhancedSponsorService.getSponsorsWithStandardizedData();

    // Verify fallback behavior
    expect(result).toHaveLength(1);
    const sponsor = result[0];
    expect(sponsor.logo).toBe('test-logo');
    expect(sponsor.website).toBe('test-website');
    expect(sponsor.logoSource).toBe('sponsor_table');
    expect(sponsor.websiteSource).toBe('sponsor_table');
  });

  it('should provide accurate statistics', async () => {
    const mockSponsors = [
      { logoSource: 'standardized', websiteSource: 'standardized' },
      { logoSource: 'sponsor_table', websiteSource: 'standardized' },
      { logoSource: 'fallback', websiteSource: 'fallback' }
    ] as any[];

    const stats = enhancedSponsorService.getSponsorStats(mockSponsors);

    expect(stats.total).toBe(3);
    expect(stats.withStandardizedLogos).toBe(1);
    expect(stats.withStandardizedWebsites).toBe(2);
    expect(stats.fallbackLogos).toBe(1);
    expect(stats.fallbackWebsites).toBe(1);
  });
});
