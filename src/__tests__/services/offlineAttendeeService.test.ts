/**
 * Unit Tests for OfflineAttendeeService
 * Tests the confirmed attendee filtering fix for company attendees
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineAttendeeService } from '../../services/offlineAttendeeService';
import { simplifiedDataService } from '../../services/simplifiedDataService';
import { attendeeService } from '../../services/attendeeService';
import type { Attendee } from '../../types/database';

// Mock dependencies
vi.mock('../../services/simplifiedDataService');
vi.mock('../../services/attendeeService');

const mockSimplifiedDataService = vi.mocked(simplifiedDataService);
const mockAttendeeService = vi.mocked(attendeeService);

describe('OfflineAttendeeService - Company Attendees Filtering', () => {
  let service: OfflineAttendeeService;

  beforeEach(() => {
    service = new OfflineAttendeeService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAttendeesByCompany', () => {
    it('should filter attendees by company AND confirmed registration status from cache', async () => {
      // Arrange
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
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
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // NOT confirmed
          email: 'bims@aws.com',
          title: 'Senior Solutions Architect',
          bio: '',
          photo: '',
          salutation: 'Ms',
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
          id: '3',
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Microsoft',
          registration_status: 'confirmed',
          email: 'jane@microsoft.com',
          title: 'Product Manager',
          bio: '',
          photo: '',
          salutation: 'Ms',
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

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockAttendees,
        fromCache: true
      });

      // Act
      const result = await service.getAttendeesByCompany('Amazon Web Services');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].first_name).toBe('John');
      expect(result.data[0].registration_status).toBe('confirmed');
      
      // Ensure Bims (pending status) is filtered out
      expect(result.data.find(attendee => attendee.first_name === 'Bims')).toBeUndefined();
      
      // Ensure Jane (different company) is filtered out
      expect(result.data.find(attendee => attendee.first_name === 'Jane')).toBeUndefined();
    });

    it('should filter attendees by company AND confirmed registration status from server when cache is empty', async () => {
      // Arrange
      const mockServerAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
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
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // NOT confirmed
          email: 'bims@aws.com',
          title: 'Senior Solutions Architect',
          bio: '',
          photo: '',
          salutation: 'Ms',
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

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: [],
        fromCache: false
      });
      mockAttendeeService.getAttendeesByCompany.mockResolvedValue({
        data: mockServerAttendees,
        count: mockServerAttendees.length,
        error: null,
        success: true
      });

      // Act
      const result = await service.getAttendeesByCompany('Amazon Web Services');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].first_name).toBe('John');
      expect(result.data[0].registration_status).toBe('confirmed');
      
      // Ensure Bims (pending status) is filtered out
      expect(result.data.find(attendee => attendee.first_name === 'Bims')).toBeUndefined();
      
      // Verify that filtered data was cached
      expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('attendees');
    });

    it('should handle case-insensitive company name matching', async () => {
      // Arrange
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
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

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockAttendees,
        fromCache: true
      });

      // Act - Test with different case
      const result = await service.getAttendeesByCompany('amazon web services');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('John');
    });

    it('should return empty array when no confirmed attendees found for company', async () => {
      // Arrange
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'pending', // NOT confirmed
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
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

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockAttendees,
        fromCache: true
      });

      // Act
      const result = await service.getAttendeesByCompany('Amazon Web Services');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockSimplifiedDataService.getData.mockRejectedValue(new Error('Cache error'));

      // Act
      const result = await service.getAttendeesByCompany('Amazon Web Services');

      // Assert
      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.error).toBe('Cache error');
    });
  });
});
