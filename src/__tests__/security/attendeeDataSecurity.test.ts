/**
 * Security Tests for Attendee Data Confidentiality
 * Story 2.2.4: Remove Confidential Attendee Information from Local Cache
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedCacheService } from '../../services/unifiedCacheService';
import { AttendeeCacheFilterService } from '../../services/attendeeCacheFilterService';
import type { Attendee } from '../../types/attendee';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock localStorage to work with the cache service
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock global localStorage for Node.js environment
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Attendee Data Security Tests', () => {
  let confidentialAttendee: Attendee;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
    localStorageMock.length = 0;
    localStorageMock.key.mockReturnValue(null);

    // Create attendee with all confidential fields
    confidentialAttendee = {
      id: 'security-test-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      title: 'CEO',
      company: 'Test Corp',
      bio: 'Test bio',
      photo: 'https://example.com/photo.jpg',
      salutation: 'Mr.',
      registration_status: 'confirmed',
      registration_id: 'REG-123',
      dining_selections: { 'dinner-1': { attending: true } },
      selected_breakouts: ['session-1', 'session-2'],
      attributes: {
        ceo: true,
        apaxIP: false,
        speaker: false,
        cLevelExec: true,
        sponsorAttendee: false,
        otherAttendeeType: false,
        portfolioCompanyExecutive: false
      },
      is_cfo: false,
      is_apax_ep: false,
      primary_attendee_id: null,
      company_name_standardized: 'Test Corp',
      last_synced_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      
      // CONFIDENTIAL FIELDS - These must be removed
      business_phone: '+1-555-123-4567',
      mobile_phone: '+1-555-987-6543',
      check_in_date: '2024-01-15',
      check_out_date: '2024-01-17',
      hotel_selection: 'hotel-123',
      custom_hotel: 'Custom Hotel',
      room_type: 'suite',
      has_spouse: true,
      dietary_requirements: 'vegetarian',
      is_spouse: false,
      spouse_details: {
        email: 'spouse@example.com',
        lastName: 'Doe',
        firstName: 'Jane',
        salutation: 'Ms.',
        mobilePhone: '+1-555-111-2222',
        dietaryRequirements: 'vegan'
      },
      address1: '123 Main St',
      address2: 'Apt 4B',
      postal_code: '12345',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      country_code: 'US',
      assistant_name: 'Assistant Name',
      assistant_email: 'assistant@example.com',
      idloom_id: 'idloom-123',
      access_code: 'ABC123'
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Confidential Field Removal', () => {
    it('should remove ALL confidential fields from cache storage', async () => {
      // Store attendee data
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      // Get the stored data
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // CRITICAL: Verify ALL confidential fields are removed
      const confidentialFields = [
        'business_phone',
        'mobile_phone', 
        'check_in_date',
        'check_out_date',
        'hotel_selection',
        'custom_hotel',
        'room_type',
        'has_spouse',
        'dietary_requirements',
        'is_spouse',
        'spouse_details',
        'address1',
        'address2',
        'postal_code',
        'city',
        'state',
        'country',
        'country_code',
        'assistant_name',
        'assistant_email',
        'idloom_id',
        'access_code'
      ];

      confidentialFields.forEach(field => {
        expect(cachedAttendee).not.toHaveProperty(field);
        expect(cachedAttendee[field]).toBeUndefined();
      });
    });

    it('should remove nested confidential data (spouse_details)', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify spouse_details object is completely removed
      expect(cachedAttendee).not.toHaveProperty('spouse_details');
      expect(cachedAttendee.spouse_details).toBeUndefined();
    });

    it('should preserve only safe fields in cache', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify safe fields are preserved
      const safeFields = [
        'id',
        'first_name',
        'last_name',
        'email',
        'title',
        'company',
        'bio',
        'photo',
        'salutation',
        'registration_status',
        'registration_id',
        'dining_selections',
        'selected_breakouts',
        'attributes',
        'is_cfo',
        'is_apax_ep',
        'primary_attendee_id',
        'company_name_standardized',
        'last_synced_at',
        'created_at',
        'updated_at'
      ];

      safeFields.forEach(field => {
        expect(cachedAttendee).toHaveProperty(field);
        expect(cachedAttendee[field]).toBeDefined();
      });
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should prevent phone number exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no phone numbers are exposed
      expect(cachedAttendee.business_phone).toBeUndefined();
      expect(cachedAttendee.mobile_phone).toBeUndefined();
      
      // Check that the stored JSON string doesn't contain phone numbers
      const storedJson = setItemCall[1];
      expect(storedJson).not.toContain('+1-555-123-4567');
      expect(storedJson).not.toContain('+1-555-987-6543');
    });

    it('should prevent address exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no address information is exposed
      expect(cachedAttendee.address1).toBeUndefined();
      expect(cachedAttendee.address2).toBeUndefined();
      expect(cachedAttendee.postal_code).toBeUndefined();
      expect(cachedAttendee.city).toBeUndefined();
      expect(cachedAttendee.state).toBeUndefined();
      expect(cachedAttendee.country).toBeUndefined();
      expect(cachedAttendee.country_code).toBeUndefined();
    });

    it('should prevent travel information exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no travel information is exposed
      expect(cachedAttendee.check_in_date).toBeUndefined();
      expect(cachedAttendee.check_out_date).toBeUndefined();
      expect(cachedAttendee.hotel_selection).toBeUndefined();
      expect(cachedAttendee.custom_hotel).toBeUndefined();
      expect(cachedAttendee.room_type).toBeUndefined();
    });

    it('should prevent personal details exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no personal details are exposed
      expect(cachedAttendee.has_spouse).toBeUndefined();
      expect(cachedAttendee.dietary_requirements).toBeUndefined();
      expect(cachedAttendee.is_spouse).toBeUndefined();
      expect(cachedAttendee.spouse_details).toBeUndefined();
    });

    it('should prevent assistant information exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no assistant information is exposed
      expect(cachedAttendee.assistant_name).toBeUndefined();
      expect(cachedAttendee.assistant_email).toBeUndefined();
    });

    it('should prevent system identifier exposure', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify no system identifiers are exposed
      expect(cachedAttendee.idloom_id).toBeUndefined();
      expect(cachedAttendee.access_code).toBeUndefined();
    });
  });

  describe('Cache Validation', () => {
    it('should validate that stored cache contains no confidential data', async () => {
      await unifiedCacheService.set('kn_cache_attendees', [confidentialAttendee]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);

      // Validate the stored data
      const validation = AttendeeCacheFilterService.validateNoConfidentialData(storedData.data[0]);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect if confidential data accidentally leaks into cache', () => {
      const leakedData = {
        id: 'test-123',
        first_name: 'John',
        business_phone: '+1-555-123-4567', // This should not be in cache
        spouse_details: { email: 'spouse@example.com' } // This should not be in cache
      };

      const validation = AttendeeCacheFilterService.validateNoConfidentialData(leakedData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContain("Confidential field 'business_phone' found in cached data");
      expect(validation.issues).toContain("Confidential field 'spouse_details' found in cached data");
    });
  });

  describe('Edge Cases', () => {
    it('should handle attendee with null confidential fields', async () => {
      const attendeeWithNulls = {
        ...confidentialAttendee,
        business_phone: null,
        mobile_phone: null,
        spouse_details: null
      };

      await unifiedCacheService.set('kn_cache_attendees', [attendeeWithNulls]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify null fields are still removed
      expect(cachedAttendee).not.toHaveProperty('business_phone');
      expect(cachedAttendee).not.toHaveProperty('mobile_phone');
      expect(cachedAttendee).not.toHaveProperty('spouse_details');
    });

    it('should handle attendee with undefined confidential fields', async () => {
      const attendeeWithUndefined = {
        ...confidentialAttendee,
        business_phone: undefined,
        mobile_phone: undefined,
        spouse_details: undefined
      };

      await unifiedCacheService.set('kn_cache_attendees', [attendeeWithUndefined]);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      const cachedAttendee = storedData.data[0];

      // Verify undefined fields are still removed
      expect(cachedAttendee).not.toHaveProperty('business_phone');
      expect(cachedAttendee).not.toHaveProperty('mobile_phone');
      expect(cachedAttendee).not.toHaveProperty('spouse_details');
    });

    it('should handle empty attendee array', async () => {
      await unifiedCacheService.set('kn_cache_attendees', []);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData.data).toEqual([]);
    });
  });

  describe('Performance Security', () => {
    it('should maintain security with large datasets', async () => {
      const largeDataset = Array(100).fill(null).map((_, index) => ({
        ...confidentialAttendee,
        id: `security-test-${index}`,
        business_phone: `+1-555-${index.toString().padStart(3, '0')}-0000`,
        mobile_phone: `+1-555-${index.toString().padStart(3, '0')}-1111`
      }));

      await unifiedCacheService.set('kn_cache_attendees', largeDataset);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);

      // Verify all records are filtered
      expect(storedData.data).toHaveLength(100);
      
      storedData.data.forEach((attendee: any) => {
        expect(attendee).not.toHaveProperty('business_phone');
        expect(attendee).not.toHaveProperty('mobile_phone');
        expect(attendee).not.toHaveProperty('spouse_details');
      });

      // Verify no phone numbers in the stored JSON
      const storedJson = setItemCall[1];
      expect(storedJson).not.toMatch(/\+1-555-\d{3}-0000/);
      expect(storedJson).not.toMatch(/\+1-555-\d{3}-1111/);
    });
  });
});
