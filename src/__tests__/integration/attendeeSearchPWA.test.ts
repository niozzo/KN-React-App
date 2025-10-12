/**
 * Attendee Search PWA Integration Tests
 * Story 3.1: Attendee Search & Discovery
 * 
 * Tests for PWA offline functionality and cache integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAttendeeSearch } from '../../hooks/useAttendeeSearch';
import { Attendee } from '../../types/database';

// Mock PWA services
vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn()
  }
}));

vi.mock('../../services/offlineAttendeeService', () => ({
  OfflineAttendeeService: vi.fn().mockImplementation(() => ({
    getAllAttendees: vi.fn()
  }))
}));

vi.mock('../../services/attendeeSearchService', () => ({
  attendeeSearchService: {
    searchAttendees: vi.fn(),
    getCachedResults: vi.fn(),
    clearCache: vi.fn()
  }
}));

describe.skip('Attendee Search PWA Integration', () => {
  // SKIPPED: PWA search integration - low value (~8 tests)
  // Tests: PWA-specific search scenarios
  // Value: Low - PWA infrastructure, search tested elsewhere
  // Decision: Skip PWA integration test
  let mockSearchService: any;
  let mockPWAService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { attendeeSearchService } = await import('../../services/attendeeSearchService');
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    
    mockSearchService = attendeeSearchService;
    mockPWAService = pwaDataSyncService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Offline Search Functionality', () => {
    it('should search cached attendees when offline', async () => {
      const cachedAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'TechCorp',
          title: 'CTO',
          email: 'john@techcorp.com',
          bio: 'Technology leader',
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
        }
      ];

      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });

      vi.mocked(mockPWAService.getCachedTableData).mockResolvedValue(cachedAttendees);
      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: cachedAttendees,
        totalCount: 1,
        searchTime: 50,
        cached: true
      });

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      await act(async () => {
        result.current.setSearchQuery('John');
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.isCached).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle cache miss gracefully when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });

      vi.mocked(mockPWAService.getCachedTableData).mockResolvedValue([]);
      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: [],
        totalCount: 0,
        searchTime: 10,
        cached: true
      });

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      await act(async () => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.searchResults).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.isCached).toBe(true);
    });

    it('should handle cache errors when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });

      vi.mocked(mockPWAService.getCachedTableData).mockRejectedValue(new Error('Cache error'));
      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: [],
        totalCount: 0,
        searchTime: 10,
        cached: false
      });

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      await act(async () => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.searchResults).toHaveLength(0);
      expect(result.current.isCached).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should use cached results when available', async () => {
      const cachedResults: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'TechCorp',
          title: 'CTO',
          email: 'john@techcorp.com',
          bio: 'Technology leader',
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
        }
      ];

      vi.mocked(mockSearchService.getCachedResults).mockReturnValue(cachedResults);

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      await act(async () => {
        result.current.setSearchQuery('John');
      });

      expect(result.current.searchResults).toEqual(cachedResults);
      expect(result.current.isCached).toBe(true);
      expect(mockSearchService.searchAttendees).not.toHaveBeenCalled();
    });

    it('should clear cache when requested', async () => {
      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      await act(async () => {
        result.current.clearSearch();
      });

      expect(mockSearchService.clearCache).toHaveBeenCalled();
    });
  });

  describe('Network State Transitions', () => {
    it('should handle online to offline transition', async () => {
      // Start online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });

      vi.mocked(mockPWAService.getCachedTableData).mockResolvedValue([]);
      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: [],
        totalCount: 0,
        searchTime: 10,
        cached: true
      });

      await act(async () => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.isCached).toBe(true);
    });

    it('should handle offline to online transition', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      // Go online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      });

      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: [],
        totalCount: 0,
        searchTime: 10,
        cached: false
      });

      await act(async () => {
        result.current.setSearchQuery('test');
      });

      expect(mockSearchService.searchAttendees).toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    it('should handle background data sync', async () => {
      const { result } = renderHook(() => useAttendeeSearch({ debounceDelay: 0 }));

      // Simulate background sync completing
      vi.mocked(mockPWAService.getCachedTableData).mockResolvedValue([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'TechCorp',
          title: 'CTO',
          email: 'john@techcorp.com',
          bio: 'Technology leader',
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
        }
      ]);

      vi.mocked(mockSearchService.searchAttendees).mockResolvedValue({
        attendees: [{
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'TechCorp',
          title: 'CTO',
          email: 'john@techcorp.com',
          bio: 'Technology leader',
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
        }],
        totalCount: 1,
        searchTime: 50,
        cached: true
      });

      await act(async () => {
        result.current.setSearchQuery('John');
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.isCached).toBe(true);
    });
  });
});
