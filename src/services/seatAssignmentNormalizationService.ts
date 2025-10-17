/**
 * Seat Assignment Normalization Service
 * 
 * Handles normalization of seat assignments for specific dates to ensure consistency.
 * For October 21st, ensures all agenda items (excluding dining) have consistent seat assignments.
 */

import { BaseService } from './baseService';
import type { SeatAssignment } from '../types/seating';
import type { SeatingConfiguration } from '../types/seating';
import type { AgendaItem } from '../types/agenda';

export class SeatAssignmentNormalizationService extends BaseService {
  private static instance: SeatAssignmentNormalizationService;

  public static getInstance(): SeatAssignmentNormalizationService {
    if (!SeatAssignmentNormalizationService.instance) {
      SeatAssignmentNormalizationService.instance = new SeatAssignmentNormalizationService();
    }
    return SeatAssignmentNormalizationService.instance;
  }

  /**
   * Normalize seat assignments for a specific date
   * @param seatAssignments - Current seat assignments
   * @param seatingConfigurations - All seating configurations
   * @param agendaItems - All agenda items
   * @param targetDate - Date to normalize (YYYY-MM-DD format)
   * @returns Normalized seat assignments
   */
  normalizeSeatAssignmentsForDate(
    seatAssignments: SeatAssignment[],
    seatingConfigurations: SeatingConfiguration[],
    agendaItems: AgendaItem[],
    targetDate: string
  ): SeatAssignment[] {
    console.log(`🔄 SeatAssignmentNormalization: Starting normalization for ${targetDate}`);

    try {
      // Step 1: Identify target agenda items (excluding dining events)
      const targetAgendaItems = this.identifyTargetAgendaItems(agendaItems, targetDate);
      
      if (targetAgendaItems.length === 0) {
        console.log(`📅 No agenda items found for ${targetDate}, skipping normalization`);
        return seatAssignments;
      }

      console.log(`📋 Found ${targetAgendaItems.length} agenda items for ${targetDate}`);

      // Step 2: Find associated seating configurations
      const targetConfigIds = this.findAssociatedSeatingConfigurations(
        seatingConfigurations, 
        targetAgendaItems
      );

      if (targetConfigIds.length === 0) {
        console.log(`🪑 No seating configurations found for ${targetDate}, skipping normalization`);
        return seatAssignments;
      }

      console.log(`🪑 Found ${targetConfigIds.length} seating configurations for ${targetDate}`);

      // Step 3: Check for configuration consistency
      const hasInconsistentAssignments = this.detectInconsistentAssignments(
        seatAssignments, 
        targetConfigIds
      );

      if (hasInconsistentAssignments) {
        console.warn(`⚠️ Inconsistent seat assignments detected for ${targetDate}, skipping normalization`);
        return seatAssignments;
      }

      // Step 4: Create missing seat assignments
      const normalizedAssignments = this.createMissingSeatAssignments(
        seatAssignments,
        targetConfigIds
      );

      console.log(`✅ SeatAssignmentNormalization: Normalization completed for ${targetDate}`);
      return normalizedAssignments;

    } catch (error) {
      console.error(`❌ SeatAssignmentNormalization: Error during normalization for ${targetDate}:`, error);
      return seatAssignments; // Return original data on error
    }
  }

  /**
   * Identify target agenda items for the specified date (excluding dining events)
   */
  private identifyTargetAgendaItems(agendaItems: AgendaItem[], targetDate: string): AgendaItem[] {
    return agendaItems.filter(item => 
      item.date === targetDate && 
      item.session_type !== 'dining' &&
      item.has_seating === true
    );
  }

  /**
   * Find seating configurations associated with target agenda items
   */
  private findAssociatedSeatingConfigurations(
    seatingConfigurations: SeatingConfiguration[],
    targetAgendaItems: AgendaItem[]
  ): string[] {
    return seatingConfigurations
      .filter(config => 
        targetAgendaItems.some(item => item.id === config.agenda_item_id)
      )
      .map(config => config.id);
  }

  /**
   * Detect if there are inconsistent seat assignments across configurations
   */
  private detectInconsistentAssignments(
    seatAssignments: SeatAssignment[],
    targetConfigIds: string[]
  ): boolean {
    // Group seat assignments by attendee for each configuration
    const attendeeConfigurations = new Map<string, Map<string, SeatAssignment>>();

    for (const assignment of seatAssignments) {
      if (targetConfigIds.includes(assignment.seating_configuration_id)) {
        if (!attendeeConfigurations.has(assignment.attendee_id)) {
          attendeeConfigurations.set(assignment.attendee_id, new Map());
        }
        
        const attendeeConfigs = attendeeConfigurations.get(assignment.attendee_id)!;
        attendeeConfigs.set(assignment.seating_configuration_id, assignment);
      }
    }

    // Check for inconsistencies
    for (const [attendeeId, configs] of attendeeConfigurations) {
      if (configs.size > 1) {
        // This attendee has assignments in multiple configurations
        const assignments = Array.from(configs.values());
        const firstAssignment = assignments[0];
        
        // Check if all assignments have the same seat position
        const hasInconsistentPositions = assignments.some(assignment => 
          assignment.table_name !== firstAssignment.table_name ||
          assignment.seat_number !== firstAssignment.seat_number ||
          assignment.row_number !== firstAssignment.row_number ||
          assignment.column_number !== firstAssignment.column_number
        );

        if (hasInconsistentPositions) {
          console.warn(`⚠️ Inconsistent seat positions for attendee ${attendeeId} across configurations`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Create missing seat assignments by replicating existing ones
   */
  private createMissingSeatAssignments(
    seatAssignments: SeatAssignment[],
    targetConfigIds: string[]
  ): SeatAssignment[] {
    const normalizedAssignments = [...seatAssignments];
    
    // Find all attendees who have ANY seat assignment in target configurations
    const attendeesWithSeats = new Set<string>();
    const existingAssignments = new Map<string, SeatAssignment>();

    for (const assignment of seatAssignments) {
      if (targetConfigIds.includes(assignment.seating_configuration_id)) {
        attendeesWithSeats.add(assignment.attendee_id);
        if (!existingAssignments.has(assignment.attendee_id)) {
          existingAssignments.set(assignment.attendee_id, assignment);
        }
      }
    }

    console.log(`👥 Found ${attendeesWithSeats.size} attendees with existing seat assignments`);

    // For each attendee, ensure they have assignments in ALL target configurations
    for (const attendeeId of attendeesWithSeats) {
      const existingAssignment = existingAssignments.get(attendeeId)!;
      
      for (const configId of targetConfigIds) {
        // Check if this attendee already has an assignment for this configuration
        const hasAssignment = seatAssignments.some(assignment => 
          assignment.attendee_id === attendeeId && 
          assignment.seating_configuration_id === configId
        );

        if (!hasAssignment) {
          // Create a replicated assignment
          const replicatedAssignment = this.createReplicatedAssignment(existingAssignment, configId);
          normalizedAssignments.push(replicatedAssignment);
          console.log(`➕ Created seat assignment for attendee ${attendeeId} in configuration ${configId}`);
        }
      }
    }

    return normalizedAssignments;
  }

  /**
   * Create a replicated seat assignment for a different configuration
   */
  private createReplicatedAssignment(
    originalAssignment: SeatAssignment,
    newConfigurationId: string
  ): SeatAssignment {
    return {
      ...originalAssignment,
      id: this.generateNewId(), // Generate new ID
      seating_configuration_id: newConfigurationId,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate a new UUID for replicated assignments
   */
  private generateNewId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const seatAssignmentNormalizationService = new SeatAssignmentNormalizationService();
