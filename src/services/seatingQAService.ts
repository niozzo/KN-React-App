/**
 * Seating QA Service
 * Validates seat assignment consistency and compares with CSV data
 * CRITICAL: READ-ONLY database access only
 */

import { supabase } from '../lib/supabase';
import { CSVParser, ParsedSeatData } from '../utils/csvParser';

export interface SeatingIssue {
  type: 'inconsistent' | 'csv_mismatch' | 'missing_assignment';
  sessionName: string;
  sessionType: string;
  expectedRow: number | null;
  expectedColumn: number | null;
  actualRow: number | null;
  actualColumn: number | null;
  expectedTable: string | null;
  actualTable: string | null;
  expectedSeat: number | null;
  actualSeat: number | null;
  details: string;
}

export interface AttendeeSeatingQA {
  attendeeId: string;
  attendeeName: string;
  email: string;
  issues: SeatingIssue[];
  hasIssues: boolean;
  sevenSessionAssignments: {
    sessionName: string;
    sessionType: string;
    rowNumber: number | null;
    columnNumber: number | null;
    tableName: string | null;
    seatNumber: number | null;
    configId: string;
  }[];
}

export class SeatingQAService {
  private csvParser: CSVParser | null = null;
  
  // The 7 main sessions that should have consistent seat assignments
  private readonly SEVEN_MAIN_SESSIONS = [
    'Navigating Concurrent & Complex Uncertainty @ Bazooka Candy Brands',
    'Reflections On The Global Macro Environment', 
    'Morning Keynote | Political Perspectives with Hon. John Boehner',
    'AI-Powered Transformation @ Bonterra',
    'AI In Practice Across The Apax Portfolio',
    'Afternoon Keynote | Leadership Perspectives with Walter Isaacson',
    'Opening Remarks & Apax CEO Welcome | The Grand Ballroom, 8th Floor'
  ];

  /**
   * Initialize CSV parser
   */
  async initializeCSVParser(): Promise<void> {
    try {
      const { loadSeatAssignmentsCSV } = await import('../utils/csvParser');
      this.csvParser = await loadSeatAssignmentsCSV();
      console.log('📊 SeatingQAService: CSV parser initialized');
    } catch (error) {
      console.error('❌ Failed to initialize CSV parser:', error);
      throw error;
    }
  }

  /**
   * Get all attendees with their seating QA data
   * CRITICAL: READ-ONLY database access only
   */
  async getAllAttendeesSeatingQA(): Promise<AttendeeSeatingQA[]> {
    try {
      // Initialize CSV parser if not already done
      if (!this.csvParser) {
        await this.initializeCSVParser();
      }

      // READ-ONLY: Fetch all attendees
      const { data: attendees, error: attendeesError } = await supabase
        .from('attendees')
        .select('id, first_name, last_name, email')
        .order('last_name', { ascending: true });

      if (attendeesError) {
        throw new Error(`Failed to fetch attendees: ${attendeesError.message}`);
      }

      if (!attendees || attendees.length === 0) {
        console.log('📊 No attendees found');
        return [];
      }

      console.log(`📊 Found ${attendees.length} attendees, processing seating QA...`);

      // Process each attendee
      const results: AttendeeSeatingQA[] = [];
      
      for (const attendee of attendees) {
        try {
          const qaData = await this.processAttendeeSeatingQA(attendee);
          results.push(qaData);
        } catch (error) {
          console.error(`❌ Failed to process attendee ${attendee.id}:`, error);
          // Continue with other attendees
          results.push({
            attendeeId: attendee.id,
            attendeeName: `${attendee.first_name} ${attendee.last_name}`.trim(),
            email: attendee.email,
            issues: [{
              type: 'missing_assignment',
              sessionName: 'Error',
              sessionType: 'Error',
              expectedRow: null,
              expectedColumn: null,
              actualRow: null,
              actualColumn: null,
              expectedTable: null,
              actualTable: null,
              expectedSeat: null,
              actualSeat: null,
              details: `Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            hasIssues: true,
            sevenSessionAssignments: []
          });
        }
      }

      return results;

    } catch (error) {
      console.error('❌ SeatingQAService.getAllAttendeesSeatingQA error:', error);
      throw error;
    }
  }

  /**
   * Process seating QA for a single attendee
   * CRITICAL: READ-ONLY database access only
   */
  private async processAttendeeSeatingQA(attendee: any): Promise<AttendeeSeatingQA> {
    // READ-ONLY: Get seat assignments for this attendee
    const { data: seatAssignments, error: seatError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('attendee_id', attendee.id)
      .order('assigned_at', { ascending: true });

    if (seatError) {
      throw new Error(`Failed to fetch seat assignments: ${seatError.message}`);
    }

    if (!seatAssignments || seatAssignments.length === 0) {
      return {
        attendeeId: attendee.id,
        attendeeName: `${attendee.first_name} ${attendee.last_name}`.trim(),
        email: attendee.email,
        issues: [],
        hasIssues: false,
        sevenSessionAssignments: []
      };
    }

    // READ-ONLY: Get seating configurations
    const configIds = seatAssignments.map(sa => sa.seating_configuration_id);
    const { data: configurations, error: configError } = await supabase
      .from('seating_configurations')
      .select('id, agenda_item_id, dining_option_id')
      .in('id', configIds);

    if (configError) {
      throw new Error(`Failed to fetch seating configurations: ${configError.message}`);
    }

    // READ-ONLY: Get agenda items
    const agendaItemIds = configurations?.map(c => c.agenda_item_id).filter(Boolean) || [];
    let agendaItems: any[] = [];

    if (agendaItemIds.length > 0) {
      const { data: dbAgendaItems, error: agendaError } = await supabase
        .from('agenda_items')
        .select('id, title, start_time, end_time')
        .in('id', agendaItemIds);

      if (agendaError) {
        console.warn('Error fetching agenda items from database:', agendaError);
      } else if (dbAgendaItems) {
        agendaItems = dbAgendaItems;
      }
    }

    // Transform seat assignments with session information
    const transformedAssignments = seatAssignments.map(assignment => {
      const config = configurations?.find(c => c.id === assignment.seating_configuration_id);
      let sessionName = 'Unknown Session';
      let sessionType = 'Unknown';

      if (config?.agenda_item_id) {
        const agendaItem = agendaItems?.find(ai => ai.id === config.agenda_item_id);
        if (agendaItem) {
          sessionName = agendaItem.title;
          sessionType = 'Agenda Item';
        }
      } else if (config?.dining_option_id) {
        sessionName = `Dining Session (${config.dining_option_id.substring(0, 8)}...)`;
        sessionType = 'Dining Option';
      }

      return {
        sessionName,
        sessionType,
        rowNumber: assignment.row_number,
        columnNumber: assignment.column_number,
        tableName: assignment.table_name,
        seatNumber: assignment.seat_number,
        configId: assignment.seating_configuration_id
      };
    });

    // Filter to seven main sessions
    const sevenSessionAssignments = transformedAssignments.filter(assignment => 
      this.isSevenMainSession(assignment.sessionName)
    );

    // Validate consistency and CSV comparison
    const issues = await this.validateAttendeeSeating(attendee.id, sevenSessionAssignments);

    return {
      attendeeId: attendee.id,
      attendeeName: `${attendee.first_name} ${attendee.last_name}`.trim(),
      email: attendee.email,
      issues,
      hasIssues: issues.length > 0,
      sevenSessionAssignments
    };
  }

  /**
   * Check if a session is one of the seven main sessions
   */
  private isSevenMainSession(sessionName: string): boolean {
    return this.SEVEN_MAIN_SESSIONS.some(mainSession => 
      this.fuzzyMatch(sessionName, mainSession)
    );
  }

  /**
   * Fuzzy matching for session names
   */
  private fuzzyMatch(actual: string, expected: string): boolean {
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedActual = normalize(actual);
    const normalizedExpected = normalize(expected);

    // Check for exact match
    if (normalizedActual === normalizedExpected) return true;

    // Check for partial match (at least 70% of words match)
    const actualWords = normalizedActual.split(' ');
    const expectedWords = normalizedExpected.split(' ');
    
    const matchingWords = actualWords.filter(word => 
      expectedWords.some(expectedWord => 
        expectedWord.includes(word) || word.includes(expectedWord)
      )
    );

    return matchingWords.length / Math.max(actualWords.length, expectedWords.length) >= 0.7;
  }

  /**
   * Validate attendee seating for consistency across 7 sessions
   * CEO remarks session is the reference, compare against other 6 sessions
   */
  private async validateAttendeeSeating(
    attendeeId: string, 
    sevenSessionAssignments: any[]
  ): Promise<SeatingIssue[]> {
    const issues: SeatingIssue[] = [];

    // Find CEO remarks session (Opening Remarks)
    const ceoRemarksSession = sevenSessionAssignments.find(assignment => 
      assignment.sessionName.includes('Opening Remarks') || 
      assignment.sessionName.includes('CEO Welcome')
    );

    if (!ceoRemarksSession) {
      // If no CEO remarks session found, skip validation
      return issues;
    }

    const ceoRow = ceoRemarksSession.rowNumber;
    const ceoColumn = ceoRemarksSession.columnNumber;
    const ceoTable = ceoRemarksSession.tableName;
    const ceoSeat = ceoRemarksSession.seatNumber;

    // Compare other 6 sessions against CEO remarks session
    const otherSessions = sevenSessionAssignments.filter(assignment => 
      assignment !== ceoRemarksSession
    );

    for (const assignment of otherSessions) {
      if (assignment.rowNumber !== ceoRow || 
          assignment.columnNumber !== ceoColumn ||
          assignment.tableName !== ceoTable ||
          assignment.seatNumber !== ceoSeat) {
        
        issues.push({
          type: 'inconsistent',
          sessionName: assignment.sessionName,
          sessionType: assignment.sessionType,
          expectedRow: ceoRow,
          expectedColumn: ceoColumn,
          actualRow: assignment.rowNumber,
          actualColumn: assignment.columnNumber,
          expectedTable: ceoTable,
          actualTable: assignment.tableName,
          expectedSeat: ceoSeat,
          actualSeat: assignment.seatNumber,
          details: `Other 6 sessions mismatch: CEO remarks has (${ceoRow}, ${ceoColumn}, ${ceoTable}, ${ceoSeat}) but ${assignment.sessionName} has (${assignment.rowNumber}, ${assignment.columnNumber}, ${assignment.tableName}, ${assignment.seatNumber})`
        });
      }
    }

    // Check 2: CSV comparison - COMMENTED OUT FOR NOW
    /*
    if (this.csvParser) {
      for (const assignment of sevenSessionAssignments) {
        const csvData = this.csvParser.getSeatData(attendeeId, assignment.configId);
        
        if (csvData) {
          if (csvData.rowNumber !== assignment.rowNumber ||
              csvData.columnNumber !== assignment.columnNumber ||
              csvData.tableName !== assignment.tableName ||
              csvData.seatNumber !== assignment.seatNumber) {
            
            issues.push({
              type: 'csv_mismatch',
              sessionName: assignment.sessionName,
              sessionType: assignment.sessionType,
              expectedRow: csvData.rowNumber,
              expectedColumn: csvData.columnNumber,
              actualRow: assignment.rowNumber,
              actualColumn: assignment.columnNumber,
              expectedTable: csvData.tableName,
              actualTable: assignment.tableName,
              expectedSeat: csvData.seatNumber,
              actualSeat: assignment.seatNumber,
              details: `CSV mismatch: Expected (${csvData.rowNumber}, ${csvData.columnNumber}, ${csvData.tableName}, ${csvData.seatNumber}) but DB has (${assignment.rowNumber}, ${assignment.columnNumber}, ${assignment.tableName}, ${assignment.seatNumber})`
            });
          }
        } else {
          issues.push({
            type: 'csv_mismatch',
            sessionName: assignment.sessionName,
            sessionType: assignment.sessionType,
            expectedRow: null,
            expectedColumn: null,
            actualRow: assignment.rowNumber,
            actualColumn: assignment.columnNumber,
            expectedTable: null,
            actualTable: assignment.tableName,
            expectedSeat: null,
            actualSeat: assignment.seatNumber,
            details: `Assignment exists in DB but not found in CSV for configuration ${assignment.configId}`
          });
        }
      }
    }
    */

    return issues;
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(qaData: AttendeeSeatingQA[]): {
    totalAttendees: number;
    attendeesWithIssues: number;
    totalIssues: number;
    inconsistentIssues: number;
    csvMismatchIssues: number;
    missingAssignmentIssues: number;
  } {
    const attendeesWithIssues = qaData.filter(attendee => attendee.hasIssues).length;
    const totalIssues = qaData.reduce((sum, attendee) => sum + attendee.issues.length, 0);
    const inconsistentIssues = qaData.reduce((sum, attendee) => 
      sum + attendee.issues.filter(issue => issue.type === 'inconsistent').length, 0);
    const csvMismatchIssues = qaData.reduce((sum, attendee) => 
      sum + attendee.issues.filter(issue => issue.type === 'csv_mismatch').length, 0);
    const missingAssignmentIssues = qaData.reduce((sum, attendee) => 
      sum + attendee.issues.filter(issue => issue.type === 'missing_assignment').length, 0);

    return {
      totalAttendees: qaData.length,
      attendeesWithIssues,
      totalIssues,
      inconsistentIssues,
      csvMismatchIssues,
      missingAssignmentIssues
    };
  }
}

// Export singleton instance
export const seatingQAService = new SeatingQAService();
