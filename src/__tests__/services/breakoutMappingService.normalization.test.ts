/**
 * Breakout Mapping Service Normalization Tests
 * Tests the normalization of track names to handle variations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BreakoutMappingService } from '../../services/breakoutMappingService';
import type { AgendaItem } from '../../types/agenda';

describe('BreakoutMappingService - Normalization Tests', () => {
  let mappingService: BreakoutMappingService;

  beforeEach(() => {
    mappingService = new BreakoutMappingService();
  });

  describe('Track Name Normalization', () => {
    it('should match Track A with various formats', () => {
      const attendeeSelections = [
        'track-a-revenue-growth',
        'track a revenue growth',
        'Track-A-Revenue-Growth',
        'Track A Revenue Growth',
        'TRACK-A-REVENUE-GROWTH'
      ];

      const sessionTitle = 'Track A: Driving Revenue Growth';

      attendeeSelections.forEach(attendeeSelection => {
        const session: AgendaItem = {
          id: 'test-session',
          title: sessionTitle,
          description: 'Test session',
          date: '2025-10-22',
          start_time: '09:00:00',
          end_time: '12:00:00',
          location: 'Test Room',
          session_type: 'breakout-session',
          speaker_name: 'Test Speaker',
          capacity: 50,
          registered_count: 0,
          attendee_selection: 'selected',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        };

        const result = mappingService.isAttendeeAssignedToBreakout(session, {
          id: 'test-attendee',
          selected_breakouts: [attendeeSelection]
        } as any);

        expect(result).toBe(true, `Should match attendee selection: "${attendeeSelection}" with session: "${sessionTitle}"`);
      });
    });

    it('should match Track B with various formats', () => {
      const attendeeSelections = [
        'track-b-operational-performance',
        'track b operational performance',
        'Track-B-Operational-Performance',
        'Track B Operational Performance',
        'TRACK-B-OPERATIONAL-PERFORMANCE'
      ];

      const sessionTitle = 'Track B: Driving Operational Performance In the Age of AI';

      attendeeSelections.forEach(attendeeSelection => {
        const session: AgendaItem = {
          id: 'test-session',
          title: sessionTitle,
          description: 'Test session',
          date: '2025-10-22',
          start_time: '09:00:00',
          end_time: '12:00:00',
          location: 'Test Room',
          session_type: 'breakout-session',
          speaker_name: 'Test Speaker',
          capacity: 50,
          registered_count: 0,
          attendee_selection: 'selected',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        };

        const result = mappingService.isAttendeeAssignedToBreakout(session, {
          id: 'test-attendee',
          selected_breakouts: [attendeeSelection]
        } as any);

        expect(result).toBe(true, `Should match attendee selection: "${attendeeSelection}" with session: "${sessionTitle}"`);
      });
    });

    it('should handle session title variations', () => {
      const attendeeSelection = 'track-b-operational-performance';
      
      const sessionTitleVariations = [
        'Track B: Driving Operational Performance',
        'Track-B: Driving Operational Performance',
        'Track B - Driving Operational Performance',
        'Track-B - Driving Operational Performance',
        'track b: driving operational performance',
        'track-b: driving operational performance'
      ];

      sessionTitleVariations.forEach(sessionTitle => {
        const session: AgendaItem = {
          id: 'test-session',
          title: sessionTitle,
          description: 'Test session',
          date: '2025-10-22',
          start_time: '09:00:00',
          end_time: '12:00:00',
          location: 'Test Room',
          session_type: 'breakout-session',
          speaker_name: 'Test Speaker',
          capacity: 50,
          registered_count: 0,
          attendee_selection: 'selected',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        };

        const result = mappingService.isAttendeeAssignedToBreakout(session, {
          id: 'test-attendee',
          selected_breakouts: [attendeeSelection]
        } as any);

        expect(result).toBe(true, `Should match attendee selection: "${attendeeSelection}" with session: "${sessionTitle}"`);
      });
    });

    it('should not match unrelated sessions', () => {
      const attendeeSelection = 'track-b-operational-performance';
      
      const unrelatedSessions = [
        'Track A: Driving Revenue Growth',
        'CEO Summit - Apax Software',
        'Networking Cocktails',
        'Welcome Dinner',
        'Coffee Break'
      ];

      unrelatedSessions.forEach(sessionTitle => {
        const session: AgendaItem = {
          id: 'test-session',
          title: sessionTitle,
          description: 'Test session',
          date: '2025-10-22',
          start_time: '09:00:00',
          end_time: '12:00:00',
          location: 'Test Room',
          session_type: 'breakout-session',
          speaker_name: 'Test Speaker',
          capacity: 50,
          registered_count: 0,
          attendee_selection: 'selected',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: '',
          seating_type: 'open',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        };

        const result = mappingService.isAttendeeAssignedToBreakout(session, {
          id: 'test-attendee',
          selected_breakouts: [attendeeSelection]
        } as any);

        expect(result).toBe(false, `Should NOT match attendee selection: "${attendeeSelection}" with session: "${sessionTitle}"`);
      });
    });
  });
});
