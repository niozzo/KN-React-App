/**
 * Attendee Search Service Tests
 * Story 3.1: Attendee Search & Discovery
 * 
 * Comprehensive tests for the enhanced search functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    getCachedTableData: vi.fn().mockResolvedValue([])
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

describe('AttendeeSearchService', () => {
  let searchService: AttendeeSearchService;
  let mockAttendees: Attendee[];

  beforeEach(() => {
    searchService = new AttendeeSearchService();
    
    // Mock attendee data
    mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        company: 'TechCorp',
        title: 'CTO',
        email: 'john.doe@techcorp.com',
        bio: 'Technology leader with 10 years experience',
        salutation: 'Mr.',
        business_phone: '+1-555-0123',
        mobile_phone: '+1-555-0124',
        address1: '123 Main St',
        address2: '',
        postal_code: '12345',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        country_code: 'US',
        check_in_date: '2024-10-20',
        check_out_date: '2024-10-22',
        hotel_selection: 'hotel-1',
        custom_hotel: '',
        registration_id: 'REG001',
        has_spouse: false,
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
        access_code: 'ACCESS001',
        attributes: {
          ceo: false,
          apaxIP: false,
          spouse: false,
          apaxOEP: false,
          speaker: true,
          cLevelExec: true,
          sponsorAttendee: false,
          otherAttendeeType: false,
          portfolioCompanyExecutive: false
        },
        dietary_requirements: '',
        assistant_name: '',
        assistant_email: '',
        idloom_id: 'IDLOOM001',
        last_synced_at: '2024-10-19T10:00:00Z',
        created_at: '2024-10-19T10:00:00Z',
        updated_at: '2024-10-19T10:00:00Z',
        is_cfo: false,
        is_apax_ep: false,
        primary_attendee_id: null,
        is_spouse: false,
        company_name_standardized: 'TechCorp',
        photo: ''
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        company: 'FinanceCorp',
        title: 'CFO',
        email: 'jane.smith@financecorp.com',
        bio: 'Financial expert with investment background',
        salutation: 'Ms.',
        business_phone: '+1-555-0125',
        mobile_phone: '+1-555-0126',
        address1: '456 Oak Ave',
        address2: '',
        postal_code: '67890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        country_code: 'US',
        check_in_date: '2024-10-20',
        check_out_date: '2024-10-22',
        hotel_selection: 'hotel-2',
        custom_hotel: '',
        registration_id: 'REG002',
        has_spouse: false,
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
        access_code: 'ACCESS002',
        attributes: {
          ceo: false,
          apaxIP: false,
          spouse: false,
          apaxOEP: false,
          speaker: false,
          cLevelExec: true,
          sponsorAttendee: false,
          otherAttendeeType: false,
          portfolioCompanyExecutive: false
        },
        dietary_requirements: '',
        assistant_name: '',
        assistant_email: '',
        idloom_id: 'IDLOOM002',
        last_synced_at: '2024-10-19T10:00:00Z',
        created_at: '2024-10-19T10:00:00Z',
        updated_at: '2024-10-19T10:00:00Z',
        is_cfo: true,
        is_apax_ep: false,
        primary_attendee_id: null,
        is_spouse: false,
        company_name_standardized: 'FinanceCorp',
        photo: ''
      }
    ];
  });

  afterEach(() => {
    searchService.clearCache();
    vi.clearAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should search attendees by name', async () => {
      // Mock the cache data
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        query: 'John'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(1);
      expect(result.attendees[0].first_name).toBe('John');
      expect(result.totalCount).toBe(1);
      expect(result.cached).toBe(true);
    });

    it('should search attendees by company', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        query: 'TechCorp'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(1);
      expect(result.attendees[0].company).toBe('TechCorp');
    });

    it('should search attendees by title', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        query: 'CTO'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(1);
      expect(result.attendees[0].title).toBe('CTO');
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by company', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        company: 'TechCorp'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(1);
      expect(result.attendees[0].company).toBe('TechCorp');
    });

    it('should filter by role', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        role: 'CFO'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(1);
      expect(result.attendees[0].title).toBe('CFO');
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by last name ascending', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        sortBy: 'last_name',
        sortOrder: 'asc'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees[0].last_name).toBe('Doe');
      expect(result.attendees[1].last_name).toBe('Smith');
    });

    it('should sort by last name descending', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        sortBy: 'last_name',
        sortOrder: 'desc'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees[0].last_name).toBe('Smith');
      expect(result.attendees[1].last_name).toBe('Doe');
    });

    it('should sort by company name', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        sortBy: 'company',
        sortOrder: 'asc'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees[0].company).toBe('FinanceCorp');
      expect(result.attendees[1].company).toBe('TechCorp');
    });
  });

  describe('Caching Functionality', () => {
    it('should cache search results', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAttendees);

      const filters: SearchFilters = {
        query: 'John'
      };

      // First search
      await searchService.searchAttendees(filters);
      
      // Check cache
      const cachedResults = searchService.getCachedResults(filters);
      expect(cachedResults).toHaveLength(1);
      expect(cachedResults![0].first_name).toBe('John');
    });

    it('should clear cache', () => {
      searchService.clearCache();
      const cachedResults = searchService.getCachedResults({ query: 'test' });
      expect(cachedResults).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAttendees[0],
        id: `attendee-${i}`,
        first_name: `User${i}`,
        last_name: `LastName${i}`,
        company: `Company${i}`
      }));

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
    });
  });

  describe('Error Handling', () => {
    it('should handle empty cache gracefully', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue([]);

      const filters: SearchFilters = {
        query: 'test'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.cached).toBe(true); // Should be true since we got data from cache (even if empty)
    });

    it('should handle cache errors gracefully', async () => {
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      vi.mocked(pwaDataSyncService.getCachedTableData).mockRejectedValue(new Error('Cache error'));

      const filters: SearchFilters = {
        query: 'test'
      };

      const result = await searchService.searchAttendees(filters);

      expect(result.attendees).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.cached).toBe(false);
    });
  });
});
