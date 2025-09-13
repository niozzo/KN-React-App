/**
 * AccessCodeAuthService Tests
 * Story 1.2: Database Integration & Data Access Layer Setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accessCodeAuthService } from '../../services/accessCodeAuthService';
import { attendeeService } from '../../services/attendeeService';
import { Attendee } from '../../types/database';

// Mock the attendee service
vi.mock('../../services/attendeeService', () => ({
  attendeeService: {
    getAttendeeByAccessCode: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AccessCodeAuthService', () => {
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
    selected_breakouts: [],
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

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    // Clear any existing session
    accessCodeAuthService.clearCurrentSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAccessCode', () => {
    it('should validate 6-digit access codes', () => {
      expect(accessCodeAuthService.validateAccessCode('123456')).toBe(true);
      expect(accessCodeAuthService.validateAccessCode('000000')).toBe(true);
      expect(accessCodeAuthService.validateAccessCode('999999')).toBe(true);
    });

    it('should reject invalid access codes', () => {
      expect(accessCodeAuthService.validateAccessCode('12345')).toBe(false);
      expect(accessCodeAuthService.validateAccessCode('1234567')).toBe(false);
      expect(accessCodeAuthService.validateAccessCode('abc123')).toBe(false);
      expect(accessCodeAuthService.validateAccessCode('')).toBe(false);
      expect(accessCodeAuthService.validateAccessCode('12-34-56')).toBe(false);
    });
  });

  describe('authenticateWithAccessCode', () => {
    it('should authenticate with valid access code', async () => {
      // Mock successful attendee lookup
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: mockAttendee,
        error: null,
        success: true
      });

      const result = await accessCodeAuthService.authenticateWithAccessCode('123456');

      expect(result.success).toBe(true);
      expect(result.attendee).toEqual(mockAttendee);
      expect(result.error).toBeUndefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reject invalid access code format', async () => {
      const result = await accessCodeAuthService.authenticateWithAccessCode('12345');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid access code format. Must be 6 digits.');
      expect(result.attendee).toBeUndefined();
    });

    it('should handle attendee not found', async () => {
      // Mock attendee not found
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: null,
        error: 'Access code not found',
        success: false
      });

      const result = await accessCodeAuthService.authenticateWithAccessCode('999999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access code not found');
      expect(result.attendee).toBeUndefined();
    });

    it('should handle database errors', async () => {
      // Mock database error
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
        success: false
      });

      const result = await accessCodeAuthService.authenticateWithAccessCode('123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.attendee).toBeUndefined();
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no session exists', async () => {
      const session = await accessCodeAuthService.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return valid session from memory', async () => {
      // First authenticate to create a session
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: mockAttendee,
        error: null,
        success: true
      });

      await accessCodeAuthService.authenticateWithAccessCode('123456');
      const session = await accessCodeAuthService.getCurrentSession();

      expect(session).not.toBeNull();
      expect(session?.attendee).toEqual(mockAttendee);
      expect(session?.isAuthenticated).toBe(true);
    });

    it('should return valid session from storage', async () => {
      // Mock stored session
      const storedSession = {
        attendee: mockAttendee,
        isAuthenticated: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSession));

      const session = await accessCodeAuthService.getCurrentSession();

      expect(session).not.toBeNull();
      expect(session?.attendee).toEqual(mockAttendee);
      expect(session?.isAuthenticated).toBe(true);
    });

    it('should return null for expired session', async () => {
      // Mock expired session
      const expiredSession = {
        attendee: mockAttendee,
        isAuthenticated: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession));

      const session = await accessCodeAuthService.getCurrentSession();

      expect(session).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should clear session and storage', async () => {
      // First authenticate to create a session
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: mockAttendee,
        error: null,
        success: true
      });

      await accessCodeAuthService.authenticateWithAccessCode('123456');
      
      // Verify session exists
      let session = await accessCodeAuthService.getCurrentSession();
      expect(session).not.toBeNull();

      // Sign out
      const result = await accessCodeAuthService.signOut();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      
      // Verify session is cleared
      session = await accessCodeAuthService.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', async () => {
      const isAuth = await accessCodeAuthService.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should return true when authenticated', async () => {
      // First authenticate
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: mockAttendee,
        error: null,
        success: true
      });

      await accessCodeAuthService.authenticateWithAccessCode('123456');
      
      const isAuth = await accessCodeAuthService.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  describe('getCurrentAttendee', () => {
    it('should return null when not authenticated', async () => {
      const attendee = await accessCodeAuthService.getCurrentAttendee();
      expect(attendee).toBeNull();
    });

    it('should return attendee when authenticated', async () => {
      // First authenticate
      vi.mocked(attendeeService.getAttendeeByAccessCode).mockResolvedValue({
        data: mockAttendee,
        error: null,
        success: true
      });

      await accessCodeAuthService.authenticateWithAccessCode('123456');
      
      const attendee = await accessCodeAuthService.getCurrentAttendee();
      expect(attendee).toEqual(mockAttendee);
    });
  });
});
