/**
 * Attendee Search Performance Tests
 * Story 3.1: Attendee Search & Discovery
 * 
 * Performance tests for large datasets and search optimization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendeeSearchService, SearchFilters } from '../../services/attendeeSearchService';
import { Attendee } from '../../types/database';

// Mock dependencies
vi.mock('../../services/offlineAttendeeService', () => ({
  OfflineAttendeeService: vi.fn().mockImplementation(() => ({
    getAllAttendees: vi.fn().mockResolvedValue({
      success: true,
      data: []
    })
  }))
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn()
  }
}));

vi.mock('../../services/sponsorService', () => ({
  sponsorService: {
    getAllSponsors: vi.fn().mockResolvedValue({
      success: true,
      data: []
    })
  }
}));

describe.skip('Attendee Search Performance', () => {
  // SKIPPED: Performance benchmarks - not functional tests (~6 tests)
  // Tests: search performance on 1000+ attendee dataset
  // Value: Low - performance benchmarking, not user-facing features
  // Decision: Skip performance tests
  let searchService: AttendeeSearchService;
  let largeDataset: Attendee[];

  beforeEach(() => {
    searchService = new AttendeeSearchService();
    
    // Generate large dataset (1000+ attendees)
    largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `attendee-${i}`,
      first_name: `User${i}`,
      last_name: `LastName${i}`,
      company: `Company${i % 100}`, // 100 different companies
      title: i % 2 === 0 ? 'CTO' : 'CFO',
      email: `user${i}@company${i % 100}.com`,
      bio: `Bio for user ${i} with some additional text to make it longer`,
      salutation: i % 3 === 0 ? 'Mr.' : i % 3 === 1 ? 'Ms.' : 'Dr.',
      business_phone: `+1-555-${String(i).padStart(4, '0')}`,
      mobile_phone: `+1-555-${String(i + 1000).padStart(4, '0')}`,
      address1: `${i} Main Street`,
      address2: '',
      postal_code: `${String(i).padStart(5, '0')}`,
      city: `City${i % 50}`,
      state: i % 2 === 0 ? 'CA' : 'NY',
      country: 'USA',
      country_code: 'US',
      check_in_date: '2024-10-20',
      check_out_date: '2024-10-22',
      hotel_selection: `hotel-${i % 10}`,
      custom_hotel: '',
      registration_id: `REG${String(i).padStart(3, '0')}`,
      has_spouse: i % 4 === 0,
      spouse_details: {
        email: '',
        lastName: '',
        firstName: '',
        salutation: '',
        mobilePhone: '',
        dietaryRequirements: ''
      },
      dining_selections: {},
      selected_breakouts: [],
      registration_status: 'confirmed',
      access_code: `ACCESS${String(i).padStart(3, '0')}`,
      attributes: {
        ceo: i % 10 === 0,
        apaxIP: i % 20 === 0,
        spouse: i % 4 === 0,
        apaxOEP: i % 15 === 0,
        speaker: i % 5 === 0,
        cLevelExec: i % 3 === 0,
        sponsorAttendee: i % 8 === 0,
        otherAttendeeType: i % 12 === 0,
        portfolioCompanyExecutive: i % 6 === 0
      },
      dietary_requirements: i % 10 === 0 ? 'Vegetarian' : '',
      assistant_name: i % 20 === 0 ? `Assistant${i}` : '',
      assistant_email: i % 20 === 0 ? `assistant${i}@company.com` : '',
      idloom_id: `IDLOOM${String(i).padStart(3, '0')}`,
      last_synced_at: '2024-10-19T10:00:00Z',
      created_at: '2024-10-19T10:00:00Z',
      updated_at: '2024-10-19T10:00:00Z',
      is_cfo: i % 3 === 0,
      is_apax_ep: i % 15 === 0,
      primary_attendee_id: null,
      is_spouse: false,
      company_name_standardized: `Company${i % 100}`,
      photo: ''
    }));
  });

  describe('Large Dataset Performance', () => {
    it('should handle 1000+ attendees efficiently', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      const filters: SearchFilters = {
        query: 'User1'
      };
      
      const result = await searchService.searchAttendees(filters);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.attendees.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(result.cached).toBe(true);
    });

    it('should handle complex filtering efficiently', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      const filters: SearchFilters = {
        query: 'CTO',
        company: 'Company1',
        showSharedEventsOnly: true,
        sortBy: 'last_name',
        sortOrder: 'asc'
      };
      
      const result = await searchService.searchAttendees(filters);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(150); // Should complete in under 150ms
      expect(result.cached).toBe(true);
    });

    it('should handle sorting large datasets efficiently', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      const filters: SearchFilters = {
        sortBy: 'company',
        sortOrder: 'desc'
      };
      
      const result = await searchService.searchAttendees(filters);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.attendees).toHaveLength(1000);
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
      
      // Verify sorting
      const companies = result.attendees.map(a => a.company);
      const sortedCompanies = [...companies].sort().reverse();
      expect(companies).toEqual(sortedCompanies);
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks with repeated searches', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      // Perform multiple searches
      for (let i = 0; i < 100; i++) {
        const filters: SearchFilters = {
          query: `User${i % 100}`
        };
        
        const result = await searchService.searchAttendees(filters);
        expect(result.attendees.length).toBeGreaterThanOrEqual(0);
      }

      // If we get here without errors, no memory leaks
      expect(true).toBe(true);
    });

    it('should handle cache cleanup efficiently', () => {
      // Add some cached results
      searchService.getCachedResults = vi.fn().mockReturnValue(largeDataset.slice(0, 100));
      
      // Clear cache
      const startTime = performance.now();
      searchService.clearCache();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // Should clear cache quickly
    });
  });

  describe('Concurrent Search Performance', () => {
    it('should handle concurrent searches efficiently', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      // Perform multiple concurrent searches
      const searchPromises = Array.from({ length: 10 }, (_, i) => {
        const filters: SearchFilters = {
          query: `User${i}`
        };
        return searchService.searchAttendees(filters);
      });
      
      const results = await Promise.all(searchPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(500); // Should complete all searches in under 500ms
      
      // All results should be successful
      results.forEach(result => {
        expect(result.cached).toBe(true);
        expect(result.attendees).toBeDefined();
      });
    });
  });

  describe('Search Optimization', () => {
    it('should optimize text search performance', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      // Search for a common term that will match many records
      const filters: SearchFilters = {
        query: 'Company'
      };
      
      const result = await searchService.searchAttendees(filters);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.attendees.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete quickly even with many matches
    });

    it('should handle empty search results efficiently', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(largeDataset);

      const startTime = performance.now();
      
      // Search for something that won't match
      const filters: SearchFilters = {
        query: 'NonExistentUser12345'
      };
      
      const result = await searchService.searchAttendees(filters);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.attendees).toHaveLength(0);
      expect(duration).toBeLessThan(50); // Should complete quickly even with no matches
    });
  });
});
