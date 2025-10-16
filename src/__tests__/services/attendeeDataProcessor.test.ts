/**
 * Unit Tests for AttendeeDataProcessor
 * 
 * Tests the centralized attendee data processing service to ensure
 * consistent filtering logic across all data sync paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendeeDataProcessor } from '../../services/attendeeDataProcessor';
import type { Attendee } from '../../types/database';

// Mock dependencies
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
    error: vi.fn()
  }
}));

describe('AttendeeDataProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('processAttendeeData', () => {
    it('should process attendee data with all filtering rules', async () => {
      // Arrange
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

      // Act
      const result = await AttendeeDataProcessor.processAttendeeData(mockAttendees);

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(2);
      expect(result.filteredCount).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('John');
      expect(result.data[0].last_name).toBe('Doe');
      expect(result.data.some(a => a.first_name === 'Bims')).toBe(false);
    });

    it('should filter out inactive attendees', async () => {
      // Arrange
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'Active',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'confirmed',
          is_active: true,
          email: 'active@test.com',
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
          first_name: 'Inactive',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'confirmed',
          is_active: false, // Should be filtered out
          email: 'inactive@test.com',
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
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(2);
      expect(result.filteredCount).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('Active');
      expect(result.data.some(a => a.first_name === 'Inactive')).toBe(false);
    });

    it('should handle empty data gracefully', async () => {
      // Act
      const result = await AttendeeDataProcessor.processAttendeeData([]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(0);
      expect(result.filteredCount).toBe(0);
      expect(result.data).toHaveLength(0);
    });

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

  describe('processSingleAttendee', () => {
    it('should process single attendee successfully', async () => {
      // Arrange
      const mockAttendee: Attendee = {
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
      };

      // Act
      const result = await AttendeeDataProcessor.processSingleAttendee(mockAttendee);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.first_name).toBe('John');
      expect(result?.last_name).toBe('Doe');
    });

    it('should return null for non-confirmed attendee', async () => {
      // Arrange
      const mockAttendee: Attendee = {
        id: '1',
        first_name: 'Bims',
        last_name: 'Daniells',
        company: 'Amazon Web Services',
        registration_status: 'pending', // Non-confirmed
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
      };

      // Act
      const result = await AttendeeDataProcessor.processSingleAttendee(mockAttendee);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateProcessedData', () => {
    it('should validate processed data successfully', () => {
      // Arrange
      const validData: Attendee[] = [
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
        }
      ];

      // Act
      const result = AttendeeDataProcessor.validateProcessedData(validData);

      // Assert
      expect(result.passed).toBe(true);
    });

    it('should detect non-confirmed attendees', () => {
      // Arrange
      const invalidData: Attendee[] = [
        {
          id: '1',
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // Non-confirmed
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

      // Act
      const result = AttendeeDataProcessor.validateProcessedData(invalidData);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('non-confirmed attendees');
      expect(result.reason).toContain('Bims Daniells');
    });
  });

  describe('getProcessingStats', () => {
    it('should generate correct processing statistics', () => {
      // Act
      const stats = AttendeeDataProcessor.getProcessingStats(100, 75);

      // Assert
      expect(stats).toContain('100 → 75 attendees');
      expect(stats).toContain('25 filtered out');
      expect(stats).toContain('25.0%');
    });

    it('should handle zero original count', () => {
      // Act
      const stats = AttendeeDataProcessor.getProcessingStats(0, 0);

      // Assert
      expect(stats).toContain('0 → 0 attendees');
      expect(stats).toContain('0 filtered out');
      expect(stats).toContain('0%');
    });
  });
});
