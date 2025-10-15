/**
 * Integration Test: Sponsor Standardized Company Integration
 * Tests the new standardizedCompanySponsorService that uses standardized_companies table
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { standardizedCompanySponsorService } from '../../services/standardizedCompanySponsorService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Sponsor Standardized Company Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should fetch sponsors from standardized_companies table filtered by fund_analytics_category', async () => {
    // Mock cached standardized companies
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Apax Partners',
        logo: 'https://example.com/apax-logo.png',
        website: 'https://apaxpartners.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Non-Sponsor Company',
        logo: 'https://example.com/other-logo.png',
        website: 'https://other.com',
        fund_analytics_category: 'Portfolio',
        sector: 'Healthcare',
        geography: 'EU',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '3',
        name: 'Zoom Communications',
        logo: 'https://example.com/zoom-logo.png',
        website: 'https://zoom.us',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Fetch sponsors
    const sponsors = await standardizedCompanySponsorService.getSponsors();

    // Should only return companies with "Sponsors & Vendors" category
    expect(sponsors).toHaveLength(2);
    expect(sponsors[0].name).toBe('Apax Partners');
    expect(sponsors[1].name).toBe('Zoom Communications');
    expect(sponsors.every(s => s.fund_analytics_category === 'Sponsors & Vendors')).toBe(true);
  });

  it('should sort sponsors alphabetically by name', async () => {
    // Mock cached standardized companies (not in alphabetical order)
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Zoom Communications',
        logo: 'https://example.com/zoom-logo.png',
        website: 'https://zoom.us',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Apax Partners',
        logo: 'https://example.com/apax-logo.png',
        website: 'https://apaxpartners.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '3',
        name: 'Microsoft',
        logo: 'https://example.com/ms-logo.png',
        website: 'https://microsoft.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Fetch sponsors
    const sponsors = await standardizedCompanySponsorService.getSponsors();

    // Should be sorted alphabetically
    expect(sponsors).toHaveLength(3);
    expect(sponsors[0].name).toBe('Apax Partners');
    expect(sponsors[1].name).toBe('Microsoft');
    expect(sponsors[2].name).toBe('Zoom Communications');
  });

  it('should return empty array when no sponsors found', async () => {
    // Mock cached standardized companies with no sponsors
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Portfolio Company',
        logo: 'https://example.com/logo.png',
        website: 'https://example.com',
        fund_analytics_category: 'Portfolio',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Fetch sponsors
    const sponsors = await standardizedCompanySponsorService.getSponsors();

    // Should return empty array
    expect(sponsors).toHaveLength(0);
  });

  it('should handle empty cache gracefully', async () => {
    // No cached data - empty localStorage

    // Fetch sponsors
    const sponsors = await standardizedCompanySponsorService.getSponsors();

    // Should return empty array without error
    expect(sponsors).toHaveLength(0);
  });

  it('should get sponsor by name', async () => {
    // Mock cached standardized companies
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Apax Partners',
        logo: 'https://example.com/apax-logo.png',
        website: 'https://apaxpartners.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Microsoft',
        logo: 'https://example.com/ms-logo.png',
        website: 'https://microsoft.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Get sponsor by name
    const sponsor = await standardizedCompanySponsorService.getSponsorByName('Microsoft');

    expect(sponsor).not.toBeNull();
    expect(sponsor?.name).toBe('Microsoft');
    expect(sponsor?.website).toBe('https://microsoft.com');
  });

  it('should return null when sponsor not found by name', async () => {
    // Mock cached standardized companies
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Apax Partners',
        logo: 'https://example.com/apax-logo.png',
        website: 'https://apaxpartners.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Get sponsor by name
    const sponsor = await standardizedCompanySponsorService.getSponsorByName('NonExistent Company');

    expect(sponsor).toBeNull();
  });

  it('should get sponsors count', async () => {
    // Mock cached standardized companies
    const mockStandardizedCompanies = [
      {
        id: '1',
        name: 'Apax Partners',
        logo: 'https://example.com/apax-logo.png',
        website: 'https://apaxpartners.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '2',
        name: 'Microsoft',
        logo: 'https://example.com/ms-logo.png',
        website: 'https://microsoft.com',
        fund_analytics_category: 'Sponsors & Vendors',
        sector: 'Technology',
        geography: 'US',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        id: '3',
        name: 'Portfolio Company',
        logo: 'https://example.com/logo.png',
        website: 'https://example.com',
        fund_analytics_category: 'Portfolio',
        sector: 'Healthcare',
        geography: 'EU',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    // Cache the standardized companies data
    localStorageMock.setItem('kn_cache_standardized_companies', JSON.stringify({
      data: mockStandardizedCompanies,
      timestamp: Date.now()
    }));

    // Get sponsors count
    const count = await standardizedCompanySponsorService.getSponsorsCount();

    // Should count only sponsors, not other companies
    expect(count).toBe(2);
  });
});
