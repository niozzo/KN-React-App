/**
 * AttendeeService - Data access layer for attendees table
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

// Reads must go through server-side authenticated endpoints
import { 
  Attendee, 
  DatabaseResponse, 
  PaginatedResponse, 
  AttendeeService as IAttendeeService 
} from '../types/database';

export class AttendeeService implements IAttendeeService {
  private readonly tableName = 'attendees';
  private readonly basePath = '/api/attendees';

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    return (json?.data ?? json) as T;
  }

  /**
   * Get all attendees with pagination
   */
  async getAllAttendees(): Promise<PaginatedResponse<Attendee>> {
    try {
      const all = await this.apiGet<Attendee[]>(this.basePath);
      const data = [...all].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      return {
        data,
        count: data.length,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ AttendeeService.getAllAttendees error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendee by ID
   */
  async getAttendeeById(id: string): Promise<DatabaseResponse<Attendee>> {
    try {
      const data = await this.apiGet<Attendee>(`${this.basePath}/${id}`);
      return {
        data: data as Attendee,
        error: null,
        success: true
      };
    } catch (err) {
      console.error('❌ AttendeeService.getAttendeeById error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendee by access code (for authentication)
   */
  async getAttendeeByAccessCode(accessCode: string): Promise<DatabaseResponse<Attendee>> {
    try {
      // No public endpoint for access code; this should be handled by auth service
      return { data: null as any, error: 'USE_AUTH_SERVICE_FOR_ACCESS_CODE', success: false };
    } catch (err) {
      console.error('❌ AttendeeService.getAttendeeByAccessCode error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Search attendees by name, company, or email
   */
  async searchAttendees(query: string): Promise<PaginatedResponse<Attendee>> {
    try {
      const all = await this.apiGet<Attendee[]>(this.basePath);
      const lower = query.toLowerCase();
      const filtered = all.filter(a =>
        [a.first_name, a.last_name, a.company, a.email]
          .filter(Boolean)
          .map(x => String(x).toLowerCase())
          .some(s => s.includes(lower))
      );
      const data = filtered.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      return { data, count: data.length, error: null, success: true };
    } catch (err) {
      console.error('❌ AttendeeService.searchAttendees error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendees by company
   */
  async getAttendeesByCompany(company: string): Promise<PaginatedResponse<Attendee>> {
    try {
      const all = await this.apiGet<Attendee[]>(this.basePath);
      const filtered = all.filter(a => (a.company || '') === company);
      const data = filtered.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      return { data, count: data.length, error: null, success: true };
    } catch (err) {
      console.error('❌ AttendeeService.getAttendeesByCompany error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Get attendees by breakout selection
   */
  async getAttendeesByBreakout(breakoutId: string): Promise<PaginatedResponse<Attendee>> {
    try {
      const all = await this.apiGet<Attendee[]>(this.basePath);
      const filtered = all.filter(a => Array.isArray((a as any).selected_breakouts) && (a as any).selected_breakouts.includes(breakoutId));
      const data = filtered.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      return { data, count: data.length, error: null, success: true };
    } catch (err) {
      console.error('❌ AttendeeService.getAttendeesByBreakout error:', err);
      return {
        data: [],
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      };
    }
  }

  /**
   * Validate access code format
   */
  validateAccessCode(accessCode: string): boolean {
    // Access codes are 6-digit strings
    return /^\d{6}$/.test(accessCode);
  }
}

// Export singleton instance
export const attendeeService = new AttendeeService();
