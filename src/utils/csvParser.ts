/**
 * CSV Parser Utility for Seat Assignments
 * Parses the seat_assignments_rows.csv file and creates lookup maps
 */

export interface SeatData {
  id: string;
  seating_configuration_id: string;
  attendee_id: string;
  table_name: string | null;
  seat_number: number | null;
  seat_position: string | null;
  assignment_type: string;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  column_number: number | null;
  row_number: number | null;
  attendee_first_name: string;
  attendee_last_name: string;
  is_blocked: boolean;
  is_pending_review: boolean;
}

export interface ParsedSeatData {
  attendeeId: string;
  configId: string;
  rowNumber: number | null;
  columnNumber: number | null;
  tableName: string | null;
  seatNumber: number | null;
  attendeeName: string;
}

export class CSVParser {
  private csvData: Map<string, Map<string, ParsedSeatData>> = new Map();

  /**
   * Parse CSV content and create lookup maps
   * @param csvContent - Raw CSV content as string
   */
  parseCSV(csvContent: string): void {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Find column indices
    const getColumnIndex = (name: string): number => {
      const index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (index === -1) {
        throw new Error(`Column not found: ${name}`);
      }
      return index;
    };

    const attendeeIdIndex = getColumnIndex('attendee_id');
    const configIdIndex = getColumnIndex('seating_configuration_id');
    const rowIndex = getColumnIndex('row_number');
    const columnIndex = getColumnIndex('column_number');
    const tableIndex = getColumnIndex('table_name');
    const seatIndex = getColumnIndex('seat_number');
    const firstNameIndex = getColumnIndex('attendee_first_name');
    const lastNameIndex = getColumnIndex('attendee_last_name');

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const columns = this.parseCSVLine(line);
        
        const attendeeId = columns[attendeeIdIndex]?.trim();
        const configId = columns[configIdIndex]?.trim();
        
        if (!attendeeId || !configId) continue;

        const rowNumber = this.parseNumber(columns[rowIndex]);
        const columnNumber = this.parseNumber(columns[columnIndex]);
        const seatNumber = this.parseNumber(columns[seatIndex]);
        const tableName = columns[tableIndex]?.trim() || null;
        const firstName = columns[firstNameIndex]?.trim() || '';
        const lastName = columns[lastNameIndex]?.trim() || '';

        const seatData: ParsedSeatData = {
          attendeeId,
          configId,
          rowNumber,
          columnNumber,
          tableName,
          seatNumber,
          attendeeName: `${firstName} ${lastName}`.trim()
        };

        // Create nested map structure: attendeeId -> configId -> seatData
        if (!this.csvData.has(attendeeId)) {
          this.csvData.set(attendeeId, new Map());
        }
        this.csvData.get(attendeeId)!.set(configId, seatData);

      } catch (error) {
        console.warn(`Failed to parse CSV line ${i + 1}:`, error);
        continue;
      }
    }

    console.log(`📊 CSV Parser: Parsed ${this.csvData.size} attendees with seat assignments`);
  }

  /**
   * Parse a single CSV line handling quoted fields and commas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Parse number from string, return null if invalid
   */
  private parseNumber(value: string | undefined): number | null {
    if (!value || value.trim() === '' || value.toLowerCase() === 'null') {
      return null;
    }
    const num = parseFloat(value.trim());
    return isNaN(num) ? null : num;
  }

  /**
   * Get seat data for a specific attendee and configuration
   */
  getSeatData(attendeeId: string, configId: string): ParsedSeatData | null {
    const attendeeData = this.csvData.get(attendeeId);
    if (!attendeeData) return null;
    return attendeeData.get(configId) || null;
  }

  /**
   * Get all seat data for a specific attendee
   */
  getAttendeeSeatData(attendeeId: string): Map<string, ParsedSeatData> {
    return this.csvData.get(attendeeId) || new Map();
  }

  /**
   * Get all attendees with their seat data
   */
  getAllAttendeeData(): Map<string, Map<string, ParsedSeatData>> {
    return this.csvData;
  }

  /**
   * Check if attendee exists in CSV data
   */
  hasAttendee(attendeeId: string): boolean {
    return this.csvData.has(attendeeId);
  }

  /**
   * Get total number of attendees in CSV
   */
  getAttendeeCount(): number {
    return this.csvData.size;
  }

  /**
   * Get total number of seat assignments in CSV
   */
  getTotalAssignments(): number {
    let total = 0;
    for (const attendeeData of this.csvData.values()) {
      total += attendeeData.size;
    }
    return total;
  }
}

/**
 * Load and parse CSV file from public directory
 */
export async function loadSeatAssignmentsCSV(): Promise<CSVParser> {
  try {
    const response = await fetch('/seat_assignments_rows.csv');
    if (!response.ok) {
      throw new Error(`Failed to load CSV file: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    const parser = new CSVParser();
    parser.parseCSV(csvContent);
    
    return parser;
  } catch (error) {
    console.error('❌ Failed to load seat assignments CSV:', error);
    throw error;
  }
}
