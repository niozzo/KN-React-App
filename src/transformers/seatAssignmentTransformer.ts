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
        id: assignment.id,
        sessionName,
        sessionType,
        sessionId,
        // Convert 0-indexed to 1-indexed for row/column
        row: assignment.row_number !== null ? assignment.row_number + 1 : null,
        column: assignment.column_number !== null ? assignment.column_number + 1 : null,
        // Table and seat are already 1-indexed
        table: assignment.table_name,
        seat: assignment.seat_number,
        assignedAt: assignment.assigned_at,
        assignmentType: assignment.assignment_type
      }

      result.push(transformed)

    } catch (error) {
      console.error(`❌ Error transforming assignment ${assignment.id}:`, error)
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
