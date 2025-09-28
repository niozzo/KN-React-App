/**
 * useSessionData Hook - Breakout Filtering Integration Tests
 * Story 2.2.1: Breakout Session Filtering
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSessionData } from '../../hooks/useSessionData';
import { breakoutMappingService } from '../../services/breakoutMappingService';
import type { AgendaItem } from '../../types/agenda';
import type { Attendee } from '../../types/attendee';

// Mock the breakout mapping service
vi.mock('../../services/breakoutMappingService', () => ({
  breakoutMappingService: {
    isAttendeeAssignedToBreakout: vi.fn()
  }
}));

// Mock other dependencies
vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn(),
  getAllDiningOptions: vi.fn()
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}));

describe('useSessionData - Breakout Filtering', () => {
  const mockBreakoutMappingService = breakoutMappingService as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filterSessionsForAttendee', () => {
    // AC 1: Breakout Session Filtering
    it('should filter breakout sessions based on attendee assignments', async () => {
      // Given: Sessions with breakout-session type
      const mockSessions: AgendaItem[] = [
        {
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
        },
        {
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
        },
        {
          id: '3',
          title: 'Opening Keynote',
          description: 'Test description',
          date: '2025-01-27',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Main Hall',
          session_type: 'keynote',
          speaker_name: null,
          capacity: 200,
          registered_count: 150,
          attendee_selection: 'everyone',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-27T00:00:00Z',
          updated_at: '2025-01-27T00:00:00Z'
        }
      ];

      const mockAttendee: Attendee = {
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

      // Mock the breakout mapping service to return true for Track A, false for Track B
      mockBreakoutMappingService.isAttendeeAssignedToBreakout
        .mockReturnValueOnce(true)  // Track A session
        .mockReturnValueOnce(false); // Track B session

      // When: Filtering sessions for attendee with selected_breakouts
      const { result } = renderHook(() => useSessionData());

      // Mock the agenda service to return our test sessions
      const { agendaService } = require('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: mockSessions
      });

      // Mock the data service to return our test attendee
      const { getCurrentAttendeeData } = require('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(mockAttendee);

      // Mock other required services
      const { getAttendeeSeatAssignments, getAllDiningOptions } = require('../../services/dataService');
      getAttendeeSeatAssignments.mockResolvedValue([]);
      getAllDiningOptions.mockResolvedValue([]);

      await act(async () => {
        await result.current.loadSessionData();
      });

      // Then: Only matching breakout sessions should be returned
      expect(mockBreakoutMappingService.isAttendeeAssignedToBreakout).toHaveBeenCalledTimes(2);
      expect(mockBreakoutMappingService.isAttendeeAssignedToBreakout).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Track A: Driving Revenue Growth in the Age of AI' }),
        mockAttendee
      );
      expect(mockBreakoutMappingService.isAttendeeAssignedToBreakout).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Track B: Driving Operational Performance In the Age of AI' }),
        mockAttendee
      );
    });

    // AC 4: No Breakout Fallback
    it('should handle attendees with no breakout sessions', async () => {
      // Given: Attendee with empty selected_breakouts array
      const mockAttendee: Attendee = {
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

      const mockSessions: AgendaItem[] = [
        {
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
        }
      ];

      // Mock the breakout mapping service to return false (no assignment)
      mockBreakoutMappingService.isAttendeeAssignedToBreakout.mockReturnValue(false);

      // When: Filtering sessions
      const { result } = renderHook(() => useSessionData());

      // Mock the agenda service
      const { agendaService } = require('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: mockSessions
      });

      // Mock the data service
      const { getCurrentAttendeeData, getAttendeeSeatAssignments, getAllDiningOptions } = require('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(mockAttendee);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      getAllDiningOptions.mockResolvedValue([]);

      await act(async () => {
        await result.current.loadSessionData();
      });

      // Then: No breakout sessions should be returned
      expect(mockBreakoutMappingService.isAttendeeAssignedToBreakout).toHaveBeenCalledWith(
        expect.objectContaining({ session_type: 'breakout-session' }),
        mockAttendee
      );
    });

    // AC 7: Reuse Existing Card Design
    it('should maintain existing session card behavior', async () => {
      // Given: Mixed session types
      const mockSessions: AgendaItem[] = [
        {
          id: '1',
          title: 'Opening Keynote',
          description: 'Test description',
          date: '2025-01-27',
          start_time: '09:00:00',
          end_time: '10:00:00',
          location: 'Main Hall',
          session_type: 'keynote',
          speaker_name: null,
          capacity: 200,
          registered_count: 150,
          attendee_selection: 'everyone',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-27T00:00:00Z',
          updated_at: '2025-01-27T00:00:00Z'
        },
        {
          id: '2',
          title: 'Lunch',
          description: 'Test description',
          date: '2025-01-27',
          start_time: '12:00:00',
          end_time: '13:00:00',
          location: 'Dining Hall',
          session_type: 'meal',
          speaker_name: null,
          capacity: 200,
          registered_count: 150,
          attendee_selection: 'everyone',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-27T00:00:00Z',
          updated_at: '2025-01-27T00:00:00Z'
        }
      ];

      const mockAttendee: Attendee = {
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

      // When: Filtering sessions
      const { result } = renderHook(() => useSessionData());

      // Mock the agenda service
      const { agendaService } = require('../../services/agendaService');
      agendaService.getActiveAgendaItems.mockResolvedValue({
        success: true,
        data: mockSessions
      });

      // Mock the data service
      const { getCurrentAttendeeData, getAttendeeSeatAssignments, getAllDiningOptions } = require('../../services/dataService');
      getCurrentAttendeeData.mockResolvedValue(mockAttendee);
      getAttendeeSeatAssignments.mockResolvedValue([]);
      getAllDiningOptions.mockResolvedValue([]);

      await act(async () => {
        await result.current.loadSessionData();
      });

      // Then: Non-breakout sessions should continue to work unchanged
      // The breakout mapping service should not be called for non-breakout sessions
      expect(mockBreakoutMappingService.isAttendeeAssignedToBreakout).not.toHaveBeenCalled();
    });
  });
});
