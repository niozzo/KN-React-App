/**
 * BreakoutMappingService Unit Tests
 * Story 2.2.1: Breakout Session Filtering
 */

import { BreakoutMappingService } from '../../services/breakoutMappingService';
import type { AgendaItem } from '../../types/agenda';
import type { Attendee } from '../../types/attendee';

describe('BreakoutMappingService', () => {
  let service: BreakoutMappingService;

  beforeEach(() => {
    service = new BreakoutMappingService();
  });

  describe('isAttendeeAssignedToBreakout', () => {
    // AC 1: Breakout Session Filtering
    it('should return true when attendee has matching breakout', () => {
      // Given: Attendee with "track b operational performance" and session with "Track B"
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['track b operational performance'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track B: Driving Operational Performance In the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      // When: Checking assignment
      const result = service.isAttendeeAssignedToBreakout(session, attendee);

      // Then: Should return true
      expect(result).toBe(true);
    });

    // AC 2: Mapping Configuration - Track A
    it('should match Track A sessions correctly', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['track a revenue growth'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(true);
    });

    // AC 2: Mapping Configuration - Track B
    it('should match Track B sessions correctly', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['track b operational performance'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track B: Driving Operational Performance In the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(true);
    });

    // AC 2: Mapping Configuration - CEO
    it('should match CEO sessions correctly', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['ceo summit'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Apax Software CEO Summit - by invitation only',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(true);
    });

    // AC 3: Multiple Breakout Handling
    it('should use first breakout when multiple are present', () => {
      // Given: Attendee with ["track a", "track b"]
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['track a revenue growth', 'track b operational performance'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const trackASession: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const trackBSession: AgendaItem = {
        id: '2',
        title: 'Track B: Driving Operational Performance In the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room B',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      // When: Checking assignment
      const trackAResult = service.isAttendeeAssignedToBreakout(trackASession, attendee);
      const trackBResult = service.isAttendeeAssignedToBreakout(trackBSession, attendee);

      // Then: Should use "track-a" (first in array) - only Track A should match
      expect(trackAResult).toBe(true);
      expect(trackBResult).toBe(false);
    });

    // AC 5: Case-Insensitive Matching
    it('should match regardless of case', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['track a revenue growth'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(true);
    });

    // AC 6: Mismatch Handling
    it('should return false when no match found', () => {
      // Given: Attendee with "unknown-session" and session with "Track A"
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: ['unknown-session'],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      // When: Checking assignment
      const result = service.isAttendeeAssignedToBreakout(session, attendee);

      // Then: Should return false
      expect(result).toBe(false);
    });

    // Edge case: No selected breakouts
    it('should return false when attendee has no selected breakouts', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: [],
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(false);
    });

    // Edge case: Null/undefined selected_breakouts
    it('should return false when selected_breakouts is null', () => {
      const attendee: Attendee = {
        id: '1',
        selected_breakouts: null as any,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Test Corp',
        bio: '',
        photo: '',
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
        registration_status: '',
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

      const session: AgendaItem = {
        id: '1',
        title: 'Track A: Driving Revenue Growth in the Age of AI',
        description: 'Test description',
        date: '2025-01-27',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Room A',
        session_type: 'breakout-session',
        speaker_name: null,
        capacity: 50,
        registered_count: 25,
        attendee_selection: 'selected',
        selected_attendees: [],
        isActive: true,
        has_seating: false,
        seating_notes: '',
        seating_type: 'open',
        created_at: '2025-01-27T00:00:00Z',
        updated_at: '2025-01-27T00:00:00Z'
      };

      const result = service.isAttendeeAssignedToBreakout(session, attendee);
      expect(result).toBe(false);
    });
  });

  describe('getMappingConfig', () => {
    it('should return the mapping configuration', () => {
      const config = service.getMappingConfig();
      expect(config).toEqual({
        keyPhrases: ['Track A', 'Track B', 'CEO'],
        caseInsensitive: true
      });
    });
  });
});
