/**
 * Tests for Seat Assignment Normalization Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seatAssignmentNormalizationService } from '../../services/seatAssignmentNormalizationService';
import type { SeatAssignment } from '../../types/seating';
import type { SeatingConfiguration } from '../../types/seating';
import type { AgendaItem } from '../../types/agenda';

describe('SeatAssignmentNormalizationService', () => {
  let mockSeatAssignments: SeatAssignment[];
  let mockSeatingConfigurations: SeatingConfiguration[];
  let mockAgendaItems: AgendaItem[];

  beforeEach(() => {
    // Mock data for October 21st
    mockAgendaItems = [
      {
        id: 'agenda-1',
        title: 'Opening Remarks',
        date: '2025-10-21',
        start_time: '09:00:00',
        end_time: '09:30:00',
        session_type: 'executive-presentation',
        has_seating: false,
        seating_type: 'assigned',
        location: 'Main Hall',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        isActive: true,
        description: '',
        speaker_name: null,
        seating_notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'agenda-2',
        title: 'Keynote Presentation',
        date: '2025-10-21',
        start_time: '09:30:00',
        end_time: '10:15:00',
        session_type: 'keynote',
        has_seating: false,
        seating_type: 'assigned',
        location: 'Main Hall',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        isActive: true,
        description: '',
        speaker_name: null,
        seating_notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'agenda-3',
        title: 'Lunch',
        date: '2025-10-21',
        start_time: '12:00:00',
        end_time: '13:00:00',
        session_type: 'dining',
        has_seating: true,
        seating_type: 'assigned',
        location: 'Dining Room',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        isActive: true,
        description: '',
        speaker_name: null,
        seating_notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'agenda-4',
        title: 'Other Day Event',
        date: '2025-10-22',
        start_time: '09:00:00',
        end_time: '10:00:00',
        session_type: 'executive-presentation',
        has_seating: true,
        seating_type: 'assigned',
        location: 'Main Hall',
        capacity: 100,
        registered_count: 0,
        attendee_selection: 'everyone',
        selected_attendees: [],
        isActive: true,
        description: '',
        speaker_name: null,
        seating_notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    mockSeatingConfigurations = [
      {
        id: 'config-1',
        agenda_item_id: 'agenda-1',
        dining_option_id: null,
        layout_template_id: null,
        has_seating: true,
        seating_type: 'assigned',
        auto_assignment_rules: {},
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        layout_type: 'table',
        layout_config: { tables: [] },
        configuration_status: 'configured',
        weightings: {},
        algorithm_status: 'idle',
        algorithm_job_id: null,
        algorithm_results: {},
        parent_configuration_id: null,
        copy_type: null,
        is_master: false,
        last_synced_at: null
      },
      {
        id: 'config-2',
        agenda_item_id: 'agenda-2',
        dining_option_id: null,
        layout_template_id: null,
        has_seating: true,
        seating_type: 'assigned',
        auto_assignment_rules: {},
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        layout_type: 'table',
        layout_config: { tables: [] },
        configuration_status: 'configured',
        weightings: {},
        algorithm_status: 'idle',
        algorithm_job_id: null,
        algorithm_results: {},
        parent_configuration_id: null,
        copy_type: null,
        is_master: false,
        last_synced_at: null
      },
      {
        id: 'config-3',
        agenda_item_id: 'agenda-3',
        dining_option_id: null,
        layout_template_id: null,
        has_seating: true,
        seating_type: 'assigned',
        auto_assignment_rules: {},
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        layout_type: 'table',
        layout_config: { tables: [] },
        configuration_status: 'configured',
        weightings: {},
        algorithm_status: 'idle',
        algorithm_job_id: null,
        algorithm_results: {},
        parent_configuration_id: null,
        copy_type: null,
        is_master: false,
        last_synced_at: null
      }
    ];

    mockSeatAssignments = [
      {
        id: 'seat-1',
        seating_configuration_id: 'config-1',
        attendee_id: 'attendee-1',
        table_name: 'Table 1',
        seat_number: 1,
        seat_position: { x: 100, y: 200 },
        assignment_type: 'manual',
        assigned_at: '2025-01-01T00:00:00Z',
        notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        column_number: 1,
        row_number: 1,
        attendee_first_name: 'John',
        attendee_last_name: 'Doe',
        is_blocked: false,
        is_pending_review: false
      },
      {
        id: 'seat-2',
        seating_configuration_id: 'config-1',
        attendee_id: 'attendee-2',
        table_name: 'Table 1',
        seat_number: 2,
        seat_position: { x: 150, y: 200 },
        assignment_type: 'manual',
        assigned_at: '2025-01-01T00:00:00Z',
        notes: '',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        column_number: 2,
        row_number: 1,
        attendee_first_name: 'Jane',
        attendee_last_name: 'Smith',
        is_blocked: false,
        is_pending_review: false
      }
    ];
  });

  describe('normalizeSeatAssignmentsForDate', () => {
    it('should normalize missing seat assignments for Oct 21', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // Should have original assignments plus new ones for config-2
      expect(result.length).toBeGreaterThan(mockSeatAssignments.length);
      
      // Check that attendee-1 now has assignment for config-2
      const attendee1Config2 = result.find(assignment => 
        assignment.attendee_id === 'attendee-1' && 
        assignment.seating_configuration_id === 'config-2'
      );
      expect(attendee1Config2).toBeDefined();
      expect(attendee1Config2?.table_name).toBe('Table 1');
      expect(attendee1Config2?.seat_number).toBe(1);

      // Check that attendee-2 now has assignment for config-2
      const attendee2Config2 = result.find(assignment => 
        assignment.attendee_id === 'attendee-2' && 
        assignment.seating_configuration_id === 'config-2'
      );
      expect(attendee2Config2).toBeDefined();
      expect(attendee2Config2?.table_name).toBe('Table 1');
      expect(attendee2Config2?.seat_number).toBe(2);
    });

    it('should leave other dates unchanged', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-22'
      );

      // Should return original assignments unchanged
      expect(result).toEqual(mockSeatAssignments);
    });

    it('should exclude dining events from normalization', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // Should not create assignments for dining event (agenda-3)
      const diningAssignments = result.filter(assignment => 
        assignment.seating_configuration_id === 'config-3'
      );
      expect(diningAssignments.length).toBe(0);
    });

    it('should handle edge case with inconsistent configurations', () => {
      // Create inconsistent assignments - same attendee with different seats
      const inconsistentAssignments = [
        ...mockSeatAssignments,
        {
          id: 'seat-3',
          seating_configuration_id: 'config-2',
          attendee_id: 'attendee-1',
          table_name: 'Table 2', // Different table
          seat_number: 5, // Different seat
          seat_position: { x: 200, y: 300 },
          assignment_type: 'manual',
          assigned_at: '2025-01-01T00:00:00Z',
          notes: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          column_number: 5,
          row_number: 2,
          attendee_first_name: 'John',
          attendee_last_name: 'Doe',
          is_blocked: false,
          is_pending_review: false
        }
      ];

      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        inconsistentAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // Should return original assignments unchanged due to inconsistency
      expect(result).toEqual(inconsistentAssignments);
    });

    it('should preserve existing seat assignments', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // Original assignments should still be present
      expect(result).toContainEqual(mockSeatAssignments[0]);
      expect(result).toContainEqual(mockSeatAssignments[1]);
    });

    it('should handle empty data gracefully', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        [],
        [],
        [],
        '2025-10-21'
      );

      expect(result).toEqual([]);
    });

    it('should handle no agenda items for target date', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        [], // No agenda items
        '2025-10-21'
      );

      expect(result).toEqual(mockSeatAssignments);
    });

    it('should handle no seating configurations for target date', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        [], // No seating configurations
        mockAgendaItems,
        '2025-10-21'
      );

      expect(result).toEqual(mockSeatAssignments);
    });

    it('should generate unique IDs for replicated assignments', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // All IDs should be unique
      const ids = result.map(assignment => assignment.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should update timestamps for replicated assignments', () => {
      const result = seatAssignmentNormalizationService.normalizeSeatAssignmentsForDate(
        mockSeatAssignments,
        mockSeatingConfigurations,
        mockAgendaItems,
        '2025-10-21'
      );

      // Find a replicated assignment
      const replicatedAssignment = result.find(assignment => 
        assignment.attendee_id === 'attendee-1' && 
        assignment.seating_configuration_id === 'config-2'
      );

      expect(replicatedAssignment).toBeDefined();
      expect(replicatedAssignment?.assigned_at).toBeDefined();
      expect(replicatedAssignment?.created_at).toBeDefined();
      expect(replicatedAssignment?.updated_at).toBeDefined();
    });
  });
});
