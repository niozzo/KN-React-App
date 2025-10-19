import type { SeatAssignment, SeatingConfiguration } from '../types/seating'
import type { AgendaItem } from '../types/agenda'
import type { DiningOption } from '../types/dining'

export interface TransformedSeatAssignment {
  id: string
  sessionName: string
  sessionType: 'agenda' | 'dining'
  sessionId: string
  row: number | null        // 1-indexed, ready for display
  column: number | null     // 1-indexed, ready for display  
  table: string | null      // Already 1-indexed
  seat: number | null       // Already 1-indexed
  assignedAt: string
  assignmentType: string
}

/**
 * Transforms raw seat assignments into display-ready format
 * - Converts row/column from 0-indexed to 1-indexed
 * - Adds session information from cache
 * - Handles missing data gracefully
 */
export function transformSeatAssignments(
  rawAssignments: SeatAssignment[],
  seatingConfigs: SeatingConfiguration[],
  agendaItems: AgendaItem[],
  diningOptions: DiningOption[]
): TransformedSeatAssignment[] {
  console.log('🔄 Seat Assignment Transformation:', {
    rawCount: rawAssignments.length,
    seatingConfigsCount: seatingConfigs.length,
    agendaItemsCount: agendaItems.length,
    diningOptionsCount: diningOptions.length
  })

  if (!rawAssignments || rawAssignments.length === 0) {
    console.log('⚠️ No raw seat assignments to transform')
    return []
  }

  const result: TransformedSeatAssignment[] = []
  let skippedCount = 0

  for (const assignment of rawAssignments) {
    try {
      // Find seating configuration
      const config = seatingConfigs.find(c => c.id === assignment.seating_configuration_id)
      
      if (!config) {
        console.warn(`⚠️ Missing seating config for assignment ${assignment.id}, config ID: ${assignment.seating_configuration_id}`)
        skippedCount++
        continue
      }

      // NEW: If this is a child config, use parent's seat assignment instead
      // TODO 2026: Generalize this to work for any parent-child relationship using
      // config.parent_configuration_id and config.copy_type === 'layout_and_assignments'
      // instead of hardcoded Opening Remarks ID
      const OPENING_REMARKS_CONFIG_ID = 'b890ef94-3cdd-4c30-982d-884a1cec4bd5';

      let finalAssignment = assignment;
      if (config.parent_configuration_id === OPENING_REMARKS_CONFIG_ID) {
        const parentAssignment = rawAssignments.find(
          a => a.attendee_id === assignment.attendee_id && 
               a.seating_configuration_id === OPENING_REMARKS_CONFIG_ID
        );
        
        if (parentAssignment) {
          // Use parent's row/column for display
          finalAssignment = {
            ...assignment,
            row_number: parentAssignment.row_number,
            column_number: parentAssignment.column_number,
            table_name: parentAssignment.table_name,
            seat_number: parentAssignment.seat_number
          };
        }
      }

      // Determine session type and get session data
      let sessionName = 'Unknown Session'
      let sessionType: 'agenda' | 'dining' = 'agenda'
      let sessionId = ''

      if (config.agenda_item_id) {
        // Agenda item session
        const agendaItem = agendaItems.find(ai => ai.id === config.agenda_item_id)
        if (agendaItem) {
          sessionName = agendaItem.title
          sessionType = 'agenda'
          sessionId = agendaItem.id
        } else {
          console.warn(`⚠️ Missing agenda item for config ${config.id}, agenda item ID: ${config.agenda_item_id}`)
          sessionName = `Unknown Agenda Item (${config.agenda_item_id.substring(0, 8)}...)`
        }
      } else if (config.dining_option_id) {
        // Dining option session
        const diningOption = diningOptions.find(dining => dining.id === config.dining_option_id)
        if (diningOption) {
          sessionName = diningOption.name
          sessionType = 'dining'
          sessionId = diningOption.id
        } else {
          console.warn(`⚠️ Missing dining option for config ${config.id}, dining option ID: ${config.dining_option_id}`)
          sessionName = `Unknown Dining Option (${config.dining_option_id.substring(0, 8)}...)`
        }
      } else {
        console.warn(`⚠️ Seating config ${config.id} has no agenda_item_id or dining_option_id`)
        sessionName = 'Unknown Session Type'
      }

      // Transform seat data
      const transformed: TransformedSeatAssignment = {
        id: finalAssignment.id,
        sessionName,
        sessionType,
        sessionId,
        // Convert 0-indexed to 1-indexed for row/column
        row: finalAssignment.row_number !== null ? finalAssignment.row_number + 1 : null,
        column: finalAssignment.column_number !== null ? finalAssignment.column_number + 1 : null,
        // Table and seat are already 1-indexed
        table: finalAssignment.table_name,
        seat: finalAssignment.seat_number,
        assignedAt: finalAssignment.assigned_at,
        assignmentType: finalAssignment.assignment_type
      }

      result.push(transformed)

    } catch (error) {
      console.error(`❌ Error transforming assignment ${finalAssignment.id}:`, error)
      skippedCount++
    }
  }

  console.log('🔄 Seat Assignment Transformation Complete:', {
    rawCount: rawAssignments.length,
    transformedCount: result.length,
    skipped: skippedCount
  })

  return result
}

/**
 * Helper function to get session name from cache
 * Used by other parts of the app that need session names
 */
export function getSessionName(
  configId: string,
  seatingConfigs: SeatingConfiguration[],
  agendaItems: AgendaItem[],
  diningOptions: DiningOption[]
): string {
  const config = seatingConfigs.find(c => c.id === configId)
  if (!config) return 'Unknown Session'

  if (config.agenda_item_id) {
    const agendaItem = agendaItems.find(ai => ai.id === config.agenda_item_id)
    return agendaItem?.title || 'Unknown Agenda Item'
  } else if (config.dining_option_id) {
    const diningOption = diningOptions.find(dining => dining.id === config.dining_option_id)
    return diningOption?.name || 'Unknown Dining Option'
  }

  return 'Unknown Session'
}
