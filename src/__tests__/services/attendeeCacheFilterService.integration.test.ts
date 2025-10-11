/**
 * Integration Tests for AttendeeCacheFilterService
 * Story 2.2.4: Remove Confidential Attendee Information from Local Cache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AttendeeCacheFilterService } from '../../services/attendeeCacheFilterService';
import type { Attendee } from '../../types/attendee';

describe('AttendeeCacheFilterService Integration', () => {
  let sampleAttendee: Attendee;

  beforeEach(() => {
    // Create a complete attendee object with all fields
    sampleAttendee = {
      id: 'test-123',
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
      
      // Confidential fields that should be removed
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

  describe('Confidential Field Removal', () => {
    it('should remove ALL confidential fields from attendee data', () => {
      const filtered = AttendeeCacheFilterService.filterConfidentialFields(sampleAttendee);

      // Verify ALL confidential fields are removed
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
        expect(filtered).not.toHaveProperty(field);
        expect(filtered[field]).toBeUndefined();
      });
    });

    it('should preserve ALL safe fields', () => {
      const filtered = AttendeeCacheFilterService.filterConfidentialFields(sampleAttendee);

      // Verify safe fields are preserved
      expect(filtered.id).toBe(sampleAttendee.id);
      expect(filtered.first_name).toBe(sampleAttendee.first_name);
      expect(filtered.last_name).toBe(sampleAttendee.last_name);
      expect(filtered.email).toBeUndefined(); // Email is confidential and correctly filtered
      expect(filtered.title).toBe(sampleAttendee.title);
      expect(filtered.company).toBe(sampleAttendee.company);
      expect(filtered.bio).toBe(sampleAttendee.bio);
      expect(filtered.photo).toBe(sampleAttendee.photo);
      expect(filtered.salutation).toBe(sampleAttendee.salutation);
      expect(filtered.registration_status).toBe(sampleAttendee.registration_status);
      expect(filtered.registration_id).toBe(sampleAttendee.registration_id);
      expect(filtered.dining_selections).toEqual(sampleAttendee.dining_selections);
      expect(filtered.selected_breakouts).toEqual(sampleAttendee.selected_breakouts);
      expect(filtered.attributes).toEqual(sampleAttendee.attributes);
      expect(filtered.is_cfo).toBe(sampleAttendee.is_cfo);
      expect(filtered.is_apax_ep).toBe(sampleAttendee.is_apax_ep);
      expect(filtered.primary_attendee_id).toBe(sampleAttendee.primary_attendee_id);
      expect(filtered.company_name_standardized).toBe(sampleAttendee.company_name_standardized);
      expect(filtered.last_synced_at).toBe(sampleAttendee.last_synced_at);
      expect(filtered.created_at).toBe(sampleAttendee.created_at);
      expect(filtered.updated_at).toBe(sampleAttendee.updated_at);
    });

    it('should handle array of attendees', () => {
      const attendees = [sampleAttendee, { ...sampleAttendee, id: 'test-456' }];
      const filtered = AttendeeCacheFilterService.filterAttendeesArray(attendees);

      expect(filtered).toHaveLength(2);
      
      // Verify all confidential fields are removed from all attendees
      filtered.forEach(attendee => {
        expect(attendee).not.toHaveProperty('business_phone');
        expect(attendee).not.toHaveProperty('spouse_details');
        expect(attendee).not.toHaveProperty('access_code');
      });

      // Verify safe fields are preserved
      expect(filtered[0].id).toBe('test-123');
      expect(filtered[1].id).toBe('test-456');
    });
  });

  describe('Data Validation', () => {
    it('should validate filtered data contains no confidential information', () => {
      const filtered = AttendeeCacheFilterService.filterConfidentialFields(sampleAttendee);
      
      const validation = AttendeeCacheFilterService.validateNoConfidentialData(filtered);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect confidential data in unfiltered data', () => {
      const validation = AttendeeCacheFilterService.validateNoConfidentialData(sampleAttendee);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContain("Confidential field 'business_phone' found in cached data");
      expect(validation.issues).toContain("Confidential field 'spouse_details' found in cached data");
    });

    it('should detect nested confidential data', () => {
      const dataWithNestedConfidential = {
        id: 'test-123',
        first_name: 'John',
        spouse_details: {
          email: 'spouse@example.com',
          mobilePhone: '+1-555-111-2222'
        }
      };

      const validation = AttendeeCacheFilterService.validateNoConfidentialData(dataWithNestedConfidential);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain("Confidential field 'spouse_details' found in cached data");
    });
  });

  describe('Edge Cases', () => {
    it('should handle attendee with null confidential fields', () => {
      const attendeeWithNulls = {
        ...sampleAttendee,
        business_phone: null,
        mobile_phone: null,
        spouse_details: null
      };

      const filtered = AttendeeCacheFilterService.filterConfidentialFields(attendeeWithNulls);

      // Verify null fields are still removed
      expect(filtered).not.toHaveProperty('business_phone');
      expect(filtered).not.toHaveProperty('mobile_phone');
      expect(filtered).not.toHaveProperty('spouse_details');
    });

    it('should handle attendee with undefined confidential fields', () => {
      const attendeeWithUndefined = {
        ...sampleAttendee,
        business_phone: undefined,
        mobile_phone: undefined,
        spouse_details: undefined
      };

      const filtered = AttendeeCacheFilterService.filterConfidentialFields(attendeeWithUndefined);

      // Verify undefined fields are still removed
      expect(filtered).not.toHaveProperty('business_phone');
      expect(filtered).not.toHaveProperty('mobile_phone');
      expect(filtered).not.toHaveProperty('spouse_details');
    });

    it('should handle empty attendee array', () => {
      const filtered = AttendeeCacheFilterService.filterAttendeesArray([]);
      expect(filtered).toEqual([]);
    });

    it('should handle attendee with missing safe fields', () => {
      const minimalAttendee = {
        id: 'test-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        business_phone: '+1-555-123-4567' // This should be removed
      } as Attendee;

      const filtered = AttendeeCacheFilterService.filterConfidentialFields(minimalAttendee);
      
      expect(filtered.id).toBe('test-123');
      expect(filtered.first_name).toBe('John');
      expect(filtered.last_name).toBe('Doe');
      expect(filtered.email).toBe('john@example.com');
      expect(filtered).not.toHaveProperty('business_phone');
    });
  });

  describe('Performance', () => {
    it('should handle large attendee arrays efficiently', () => {
      const largeAttendeeArray = Array(1000).fill(null).map((_, index) => ({
        ...sampleAttendee,
        id: `test-${index}`,
        first_name: `User${index}`,
        business_phone: `+1-555-${index.toString().padStart(3, '0')}-0000`
      }));

      const startTime = performance.now();
      const filtered = AttendeeCacheFilterService.filterAttendeesArray(largeAttendeeArray);
      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second

      // Verify all records were filtered
      expect(filtered).toHaveLength(1000);
      filtered.forEach(attendee => {
        expect(attendee).not.toHaveProperty('business_phone');
        expect(attendee).not.toHaveProperty('spouse_details');
      });
    });
  });

  describe('Utility Methods', () => {
    it('should correctly identify confidential fields', () => {
      expect(AttendeeCacheFilterService.isConfidentialField('business_phone')).toBe(true);
      expect(AttendeeCacheFilterService.isConfidentialField('spouse_details')).toBe(true);
      expect(AttendeeCacheFilterService.isConfidentialField('access_code')).toBe(true);
      expect(AttendeeCacheFilterService.isConfidentialField('first_name')).toBe(false);
      expect(AttendeeCacheFilterService.isConfidentialField('email')).toBe(false);
    });

    it('should correctly identify safe fields', () => {
      expect(AttendeeCacheFilterService.isSafeField('first_name')).toBe(true);
      expect(AttendeeCacheFilterService.isSafeField('email')).toBe(true);
      expect(AttendeeCacheFilterService.isSafeField('company')).toBe(true);
      expect(AttendeeCacheFilterService.isSafeField('business_phone')).toBe(false);
      expect(AttendeeCacheFilterService.isSafeField('spouse_details')).toBe(false);
    });

    it('should return lists of fields', () => {
      const confidentialFields = AttendeeCacheFilterService.getConfidentialFields();
      const safeFields = AttendeeCacheFilterService.getSafeFields();

      expect(confidentialFields).toContain('business_phone');
      expect(confidentialFields).toContain('spouse_details');
      expect(confidentialFields).toContain('access_code');
      
      expect(safeFields).toContain('first_name');
      expect(safeFields).toContain('email');
      expect(safeFields).toContain('company');
    });
  });
});
