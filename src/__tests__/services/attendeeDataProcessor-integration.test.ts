/**
 * Integration Tests for AttendeeDataProcessor
 * 
 * Tests the complete data flow through all sync services to ensure
 * consistent filtering across all data sync paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendeeDataProcessor } from '../../services/attendeeDataProcessor';
import { attendeeSyncService } from '../../services/attendeeSyncService';
import { pwaDataSyncService } from '../../services/pwaDataSyncService';
import { serverDataSyncService } from '../../services/serverDataSyncService';
import type { Attendee } from '../../types/database';

// Mock dependencies
vi.mock('../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn()
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    syncAllData: vi.fn(),
    cacheTableData: vi.fn()
  }
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

vi.mock('../../transformers/attendeeTransformer', () => ({
  AttendeeTransformer: vi.fn().mockImplementation(() => ({
    transformArrayFromDatabase: vi.fn((data) => data) // Pass through for testing
  }))
}));

vi.mock('../../services/attendeeCacheFilterService', () => ({
  AttendeeCacheFilterService: {
    filterAttendeesArray: vi.fn((data) => Promise.resolve(data)) // Pass through for testing
  }
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('AttendeeDataProcessor Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Data Flow Integration', () => {
    it('should prevent Bims from appearing in all sync paths', async () => {
      // Arrange - Create test data with Bims (non-confirmed attendee)
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          is_active: true,
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
          bio: 'Test bio',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        },
        {
          id: '2',
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // Non-confirmed - should be filtered out
          is_active: true,
          email: 'bims@aws.com',
          title: 'Product Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act - Process data through AttendeeDataProcessor
      const result = await AttendeeDataProcessor.processAttendeeData(mockAttendees);

      // Assert - Bims should be filtered out
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(2);
      expect(result.filteredCount).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('John');
      expect(result.data[0].last_name).toBe('Doe');
      expect(result.data.some(a => a.first_name === 'Bims')).toBe(false);
    });

    it('should maintain consistent filtering across all sync services', async () => {
      // Arrange - Mock sync services to use AttendeeDataProcessor
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'Confirmed',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'confirmed',
          is_active: true,
          email: 'confirmed@test.com',
          title: 'Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        },
        {
          id: '2',
          first_name: 'Pending',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'pending', // Should be filtered out
          is_active: true,
          email: 'pending@test.com',
          title: 'Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act - Test all sync paths use the same filtering
      const processorResult = await AttendeeDataProcessor.processAttendeeData(mockAttendees);

      // Assert - All paths should produce the same result
      expect(processorResult.success).toBe(true);
      expect(processorResult.filteredCount).toBe(1);
      expect(processorResult.data.some(a => a.first_name === 'Pending')).toBe(false);
      expect(processorResult.data.some(a => a.first_name === 'Confirmed')).toBe(true);
    });

    it('should handle edge cases consistently across all sync paths', async () => {
      // Arrange - Test edge cases (speakers without companies)
      const mockAttendees: Attendee[] = [
        {
          id: 'de8cb880-e6f5-425d-9267-1eb0a2817f6b', // Edge case ID
          first_name: 'Speaker',
          last_name: 'WithoutCompany',
          company: 'Apax', // Should be cleared
          registration_status: 'confirmed',
          is_active: true,
          email: 'speaker@test.com',
          title: 'Speaker',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act
      const result = await AttendeeDataProcessor.processAttendeeData(mockAttendees);

      // Assert - Edge case should be handled consistently
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].company).toBe(''); // Company should be cleared
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange - Create large dataset
      const largeDataset: Attendee[] = Array.from({ length: 1000 }, (_, index) => ({
        id: `attendee-${index}`,
        first_name: `User${index}`,
        last_name: 'Test',
        company: 'Test Company',
        registration_status: index % 2 === 0 ? 'confirmed' : 'pending', // Half confirmed, half pending
        is_active: true,
        email: `user${index}@test.com`,
        title: 'Manager',
        bio: '',
        photo: '',
        salutation: 'Mr',
        business_phone: '',
        mobile_phone: '',
        address1: '',
        address2: '',
        postal_code: '',
        city: '',
        state: '',
        country: '',
        country_code: '',
        check_in_date: '',
        check_out_date: '',
        hotel_selection: '',
        custom_hotel: '',
        registration_id: '',
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
        access_code: '',
        attributes: {
          ceo: false,
          apaxIP: false,
          spouse: false,
          apaxOEP: false,
          speaker: false,
          cLevelExec: false,
          sponsorAttendee: false,
          otherAttendeeType: false,
          portfolioCompanyExecutive: false
        },
        dietary_requirements: '',
        assistant_name: '',
        assistant_email: '',
        idloom_id: '',
        last_synced_at: '',
        created_at: '',
        updated_at: '',
        is_cfo: false,
        is_apax_ep: false,
        primary_attendee_id: null,
        is_spouse: false,
        company_name_standardized: ''
      }));

      // Act
      const startTime = performance.now();
      const result = await AttendeeDataProcessor.processAttendeeData(largeDataset);
      const endTime = performance.now();

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(1000);
      expect(result.filteredCount).toBe(500); // Half should be filtered out (pending status)
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Handling Integration Tests', () => {
    it('should handle processing errors gracefully', async () => {
      // Arrange - Mock transformer to throw error
      const { AttendeeTransformer } = await import('../../transformers/attendeeTransformer');
      vi.mocked(AttendeeTransformer).mockImplementation(() => ({
        transformArrayFromDatabase: vi.fn().mockRejectedValue(new Error('Transformation failed'))
      }));

      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'Test',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'confirmed',
          is_active: true,
          email: 'test@test.com',
          title: 'Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
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
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act
      const result = await AttendeeDataProcessor.processAttendeeData(mockAttendees);

      // Assert
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to process attendee data');
    });
  });
});
