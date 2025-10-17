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
   * Normalize seat assignments for a specific date for the current user only
   * @param seatAssignments - Current seat assignments
   * @param seatingConfigurations - All seating configurations
   * @param agendaItems - All agenda items
   * @param targetDate - Date to normalize (YYYY-MM-DD format)
   * @param currentUserId - ID of the current user
   * @returns Normalized seat assignments
   */
  normalizeSeatAssignmentsForDate(
    seatAssignments: SeatAssignment[],
    seatingConfigurations: SeatingConfiguration[],
    agendaItems: AgendaItem[],
    targetDate: string,
    currentUserId: string
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
        
        // ✅ FIX: Check for data inconsistencies
        const allConfigs = seatingConfigurations.filter(config => 
          targetAgendaItems.some(item => item.id === config.agenda_item_id)
        );
        const openConfigs = allConfigs.filter(config => config.seating_type === 'open');
        
        if (openConfigs.length > 0) {
          console.warn(`⚠️ Data inconsistency detected: ${openConfigs.length} seating configurations have seating_type='open' but agenda items have seating_type='assigned'`);
          console.warn(`⚠️ This suggests the cache is out of sync with the database. Consider forcing a cache refresh.`);
          console.warn(`⚠️ Normalization will proceed using agenda item's seating_type as source of truth.`);
        }
        
        return seatAssignments;
      }

      console.log(`🪑 Found ${targetConfigIds.length} seating configurations for ${targetDate}`);

      // Step 3: Create missing seat assignments for current user only
      const normalizedAssignments = this.createMissingSeatAssignments(
        seatAssignments,
        targetConfigIds,
        currentUserId
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
      item.session_type !== 'meal' &&
      item.seating_type === 'assigned'
    );
  }

  /**
   * Find seating configurations associated with target agenda items
   * Include all configurations for agenda items with seating_type === 'assigned'
   */
  private findAssociatedSeatingConfigurations(
    seatingConfigurations: SeatingConfiguration[],
    targetAgendaItems: AgendaItem[]
  ): string[] {
    return seatingConfigurations
      .filter(config => 
        targetAgendaItems.some(item => item.id === config.agenda_item_id)
        // ✅ FIX: Don't filter by config.seating_type - use agenda item's seating_type as source of truth
      )
      .map(config => config.id);
  }


  /**
   * Create missing seat assignments by replicating existing ones for current user only
   */
  private createMissingSeatAssignments(
    seatAssignments: SeatAssignment[],
    targetConfigIds: string[],
    currentUserId: string
  ): SeatAssignment[] {
    const normalizedAssignments = [...seatAssignments];
    
    // Get current user's existing assignments for target configurations
    const userAssignments = seatAssignments.filter(assignment => 
      assignment.attendee_id === currentUserId && 
      targetConfigIds.includes(assignment.seating_configuration_id)
    );

    console.log(`👤 Found ${userAssignments.length} existing seat assignments for current user`);

    if (userAssignments.length === 0) {
      console.log(`👤 No existing assignments for current user, skipping normalization`);
      return normalizedAssignments;
    }

    // Check if current user has inconsistent assignments
    if (this.hasInconsistentAssignmentsForAttendee(userAssignments)) {
      console.warn(`⚠️ Skipping normalization for current user - inconsistent assignments`);
      return normalizedAssignments;
    }

    // Get the first assignment as template for replication
    const templateAssignment = userAssignments[0];
    
    // Ensure current user has assignments in ALL target configurations
    for (const configId of targetConfigIds) {
      // Check if current user already has an assignment for this configuration
      const hasAssignment = seatAssignments.some(assignment => 
        assignment.attendee_id === currentUserId && 
        assignment.seating_configuration_id === configId
      );

      if (!hasAssignment) {
        // Create a replicated assignment
        const replicatedAssignment = this.createReplicatedAssignment(templateAssignment, configId);
        normalizedAssignments.push(replicatedAssignment);
        console.log(`➕ Created seat assignment for current user in configuration ${configId}`);
      }
    }

    return normalizedAssignments;
  }

  /**
   * Check if an attendee has inconsistent seat assignments
   * Returns true if attendee has different completed seat positions across agenda items
   */
  private hasInconsistentAssignmentsForAttendee(assignments: SeatAssignment[]): boolean {
    if (assignments.length <= 1) {
      return false; // No inconsistency possible with 0 or 1 assignment
    }

    // Check if all assignments are pending (all null values)
    const allPending = assignments.every(assignment => 
      assignment.table_name === null && 
      assignment.seat_number === null &&
      assignment.row_number === null &&
      assignment.column_number === null
    );

    if (allPending) {
      return false; // No inconsistency with all pending assignments
    }

    // Check if any assignment has different completed seat position
    const firstAssignment = assignments[0];
    const hasDifferentPositions = assignments.some(assignment => 
      assignment.table_name !== firstAssignment.table_name ||
      assignment.seat_number !== firstAssignment.seat_number ||
      assignment.row_number !== firstAssignment.row_number ||
      assignment.column_number !== firstAssignment.column_number
    );

    return hasDifferentPositions;
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
