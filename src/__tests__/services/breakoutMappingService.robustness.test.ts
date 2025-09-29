/**
 * Breakout Mapping Service Robustness Tests
 * Tests the robustness of the mapping system against title changes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BreakoutMappingService } from '../../services/breakoutMappingService';
import type { AgendaItem } from '../../types/agenda';

describe('BreakoutMappingService - Robustness Tests', () => {
  let mappingService: BreakoutMappingService;

  beforeEach(() => {
    mappingService = new BreakoutMappingService();
  });

  describe('Title Change Resilience', () => {
    it('should match CEO summit despite title variations', () => {
      const attendeeBreakout = 'apax-software-ceo-summit-by-invitation-only';
      
      // Test various title variations that might occur
      const titleVariations = [
        'Apax Software CEO Summit - by invitation only',
        'Apax Software CEO Summit (by invitation only)',
        'CEO Summit - Apax Software (Invitation Only)',
        'Apax Software CEO Summit: By Invitation Only',
        'CEO Summit - Apax Software',
        'Apax Software CEO Summit',
        'CEO Summit',
        'Apax CEO Summit - Invitation Only'
      ];

      titleVariations.forEach(title => {
        const session: AgendaItem = {
          id: 'test-session',
          title,
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
          selected_breakouts: [attendeeBreakout]
        } as any);

        expect(result).toBe(true, `Should match title: "${title}"`);
      });
    });

    it('should match Track B despite title variations', () => {
      const attendeeBreakout = 'track-b-operational-performance';
      
      const titleVariations = [
        'Track B: Driving Operational Performance In the Age of AI',
        'Track B - Driving Operational Performance in the Age of AI',
        'Track B: Operational Performance in the Age of AI',
        'Track B - Operational Performance & AI',
        'Track B: AI-Driven Operational Performance',
        'Track B - Driving Performance with AI',
        'Track B: Performance & AI',
        'Track B - AI & Operational Performance'
      ];

      titleVariations.forEach(title => {
        const session: AgendaItem = {
          id: 'test-session',
          title,
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
          selected_breakouts: [attendeeBreakout]
        } as any);

        expect(result).toBe(true, `Should match title: "${title}"`);
      });
    });

    it('should handle completely different title formats', () => {
      const attendeeBreakout = 'apax-software-ceo-summit-by-invitation-only';
      
      // Test with completely different title formats that DON'T contain "CEO"
      const differentFormats = [
        'Executive Leadership Summit - Apax Software',
        'C-Level Executive Session - Apax',
        'Senior Leadership Forum - Apax Software',
        'Executive Roundtable - Apax',
        'Leadership Summit - Apax Software',
        'C-Suite Session - Apax Software',
        'Executive Forum - Apax Software'
      ];

      differentFormats.forEach(title => {
        const session: AgendaItem = {
          id: 'test-session',
          title,
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
          selected_breakouts: [attendeeBreakout]
        } as any);

        // These should NOT match because they don't contain "CEO"
        expect(result).toBe(false, `Should NOT match title: "${title}"`);
      });
    });

    it('should not match unrelated sessions', () => {
      const attendeeBreakout = 'apax-software-ceo-summit-by-invitation-only';
      
      const unrelatedSessions = [
        'Track A: Driving Revenue Growth',
        'Track B: Driving Operational Performance In the Age of AI',
        'Networking Cocktails',
        'Welcome Dinner',
        'Coffee Break',
        'Lunch Break',
        'Keynote Presentation',
        'Panel Discussion'
      ];

      unrelatedSessions.forEach(title => {
        const session: AgendaItem = {
          id: 'test-session',
          title,
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
          selected_breakouts: [attendeeBreakout]
        } as any);

        expect(result).toBe(false, `Should NOT match title: "${title}"`);
      });
    });
  });

  describe('Fuzzy Matching Robustness', () => {
    it('should handle typos and variations', () => {
      const attendeeBreakout = 'apax-software-ceo-summit-by-invitation-only';
      
      const typoVariations = [
        'Apax Software CEO Sumit - by invitation only', // Missing 'm'
        'Apax Software CEO Summit - by inviation only', // Missing 't'
        'Apax Software CEO Summit - by invitation ony', // Missing 'l'
        'Apax Software CEO Summit - by invitation only', // Correct
        'Apax Software CEO Summit - by invitation only', // Correct
        'Apax Software CEO Summit - by invitation only'  // Correct
      ];

      typoVariations.forEach(title => {
        const session: AgendaItem = {
          id: 'test-session',
          title,
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
          selected_breakouts: [attendeeBreakout]
        } as any);

        expect(result).toBe(true, `Should match title with typos: "${title}"`);
      });
    });
  });
});
