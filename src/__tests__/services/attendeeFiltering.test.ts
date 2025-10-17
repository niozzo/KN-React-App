/**
 * Integration Test for Attendee Filtering Fix
 * Tests that the confirmed attendee filtering works end-to-end
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

describe('Attendee Filtering Integration Test', () => {
  let service: OfflineAttendeeService;

  beforeEach(() => {
    service = new OfflineAttendeeService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should prevent Bims (non-confirmed attendee) from appearing in company attendees list', async () => {
    // Arrange - Simulate the exact scenario from the RCA
    const mockAttendees: Attendee[] = [
      {
        id: 'john-doe',
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
        id: 'bims-daniells',
        first_name: 'Adebimpe',
        last_name: 'Daniells',
        company: 'Amazon Web Services',
        registration_status: 'pending', // NOT confirmed - this is the bug
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
      data: mockAttendees,
      fromCache: true
    });

    // Act - This is what BioPage calls when showing company attendees
    const result = await service.getAttendeesByCompany('Amazon Web Services');

    // Assert - Bims should NOT appear in the results
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('john-doe');
    expect(result.data[0].first_name).toBe('John');
    expect(result.data[0].registration_status).toBe('confirmed');
    
    // CRITICAL: Bims should be filtered out
    expect(result.data.find(attendee => attendee.first_name === 'Adebimpe')).toBeUndefined();
    expect(result.data.find(attendee => attendee.id === 'bims-daniells')).toBeUndefined();
    
    // Verify the filtering logic is working
    expect(result.data.every(attendee => attendee.registration_status === 'confirmed')).toBe(true);
  });

  it('should handle server fallback with confirmed attendee filtering', async () => {
    // Arrange
    const mockServerAttendees: Attendee[] = [
      {
        id: 'john-doe',
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
        id: 'bims-daniells',
        first_name: 'Adebimpe',
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

    // Assert - Bims should still be filtered out even from server data
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('john-doe');
    expect(result.data[0].first_name).toBe('John');
    expect(result.data[0].registration_status).toBe('confirmed');
    
    // CRITICAL: Bims should be filtered out from server data too
    expect(result.data.find(attendee => attendee.first_name === 'Adebimpe')).toBeUndefined();
    expect(result.data.find(attendee => attendee.id === 'bims-daniells')).toBeUndefined();
    
    // Verify simplified data service was called
    expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('attendees');
  });
});
