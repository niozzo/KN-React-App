/**
 * AttendeeService Tests
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attendeeService } from '../../services/attendeeService';
import { Attendee } from '../../types/database';

// Helper to mock fetch for API-based service
const setupFetchMock = () => {
  const original = globalThis.fetch as any;
  const fetchMock = vi.fn();
  // @ts-expect-error override for tests
  globalThis.fetch = fetchMock;
  return { fetchMock, restore: () => { globalThis.fetch = original; } };
};

describe('AttendeeService', () => {
  const mockAttendee: Attendee = {
    id: 'test-id',
    salutation: 'Mr',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    title: 'CEO',
    company: 'Test Company',
    bio: 'Test bio',
    photo: 'https://example.com/photo.jpg',
    business_phone: '+1234567890',
    mobile_phone: '+1234567890',
    address1: '123 Test St',
    address2: '',
    postal_code: '12345',
    city: 'Test City',
    state: 'TS',
    country: 'Test Country',
    country_code: 'TC',
    check_in_date: '2025-03-15',
    check_out_date: '2025-03-17',
    hotel_selection: 'test-hotel',
    custom_hotel: '',
    registration_id: 'test-reg-123',
    has_spouse: false,
    spouse_details: {
      email: '',
      lastName: '',
      firstName: '',
      salutation: '',
      mobilePhone: '',
      dietaryRequirements: ''
    },
    dining_selections: {},
    selected_breakouts: ['breakout-1'],
    registration_status: 'confirmed',
    access_code: '123456',
    attributes: {
      ceo: true,
      apaxIP: false,
      spouse: false,
      apaxOEP: false,
      speaker: false,
      cLevelExec: true,
      sponsorAttendee: false,
      otherAttendeeType: false,
      portfolioCompanyExecutive: false
    },
    dietary_requirements: 'None',
    assistant_name: '',
    assistant_email: '',
    idloom_id: '',
    last_synced_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    is_cfo: false,
    is_apax_ep: false,
    primary_attendee_id: null,
    is_spouse: false,
    company_name_standardized: 'Test Company'
  };

  let restoreFetch: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    const { fetchMock, restore } = setupFetchMock();
    restoreFetch = restore;
    // Default: 200 with empty array
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [] }) });
  });

  afterEach(() => {
    restoreFetch?.();
  });

  describe('getAllAttendees', () => {
    it('should return all attendees successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockAttendee] }) });
      const result = await attendeeService.getAllAttendees();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockAttendee);
      expect(result.count).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should handle database error', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) });

      const result = await attendeeService.getAllAttendees();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toContain('API error');
    });

    it('should handle exception', async () => {
      (global.fetch as any).mockImplementationOnce(() => { throw new Error('Connection failed'); });

      const result = await attendeeService.getAllAttendees();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('getAttendeeById', () => {
    it('should return attendee by ID successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockAttendee }) });
      const result = await attendeeService.getAttendeeById('test-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendee);
      expect(result.error).toBeNull();
    });

    it('should handle attendee not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) });

      const result = await attendeeService.getAttendeeById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('API error');
    });
  });

  describe('getAttendeeByAccessCode', () => {
    it('should return attendee by access code successfully (now disabled in client)', async () => {
      const result = await attendeeService.getAttendeeByAccessCode('123456');
      expect(result.success).toBe(false);
      expect(result.error).toBe('USE_AUTH_SERVICE_FOR_ACCESS_CODE');
    });

    it('should handle invalid access code', async () => {
      const result = await attendeeService.getAttendeeByAccessCode('999999');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('USE_AUTH_SERVICE_FOR_ACCESS_CODE');
    });
  });

  describe('searchAttendees', () => {
    it('should search attendees successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockAttendee] }) });
      const result = await attendeeService.searchAttendees('John');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockAttendee);
      expect(result.count).toBe(1);
    });

    it('should handle search error', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) });

      const result = await attendeeService.searchAttendees('John');

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toContain('API error');
    });
  });

  describe('getAttendeesByCompany', () => {
    it('should return attendees by company successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockAttendee] }) });
      const result = await attendeeService.getAttendeesByCompany('Test Company');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockAttendee);
      expect(result.count).toBe(1);
    });
  });

  describe('getAttendeesByBreakout', () => {
    it('should return attendees by breakout successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [{ ...mockAttendee, selected_breakouts: ['breakout-1'] }] }) });
      const result = await attendeeService.getAttendeesByBreakout('breakout-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockAttendee);
      expect(result.count).toBe(1);
    });
  });

  describe('validateAccessCode', () => {
    it('should validate correct access code format', () => {
      expect(attendeeService.validateAccessCode('123456')).toBe(true);
      expect(attendeeService.validateAccessCode('000000')).toBe(true);
      expect(attendeeService.validateAccessCode('999999')).toBe(true);
    });

    it('should reject invalid access code format', () => {
      expect(attendeeService.validateAccessCode('12345')).toBe(false);
      expect(attendeeService.validateAccessCode('1234567')).toBe(false);
      expect(attendeeService.validateAccessCode('abc123')).toBe(false);
      expect(attendeeService.validateAccessCode('')).toBe(false);
    });
  });
});
