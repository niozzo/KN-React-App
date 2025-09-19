import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminService } from '../services/adminService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock application database service
vi.mock('../services/applicationDatabaseService', () => ({
  applicationDbService: {
    getSpeakerAssignments: vi.fn(),
    assignSpeaker: vi.fn(),
    removeSpeakerAssignment: vi.fn(),
    syncAgendaItemMetadata: vi.fn(),
  },
}));

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePasscode', () => {
    it('should return true for correct passcode', () => {
      expect(adminService.validatePasscode('616161')).toBe(true);
    });

    it('should return false for incorrect passcode', () => {
      expect(adminService.validatePasscode('123456')).toBe(false);
      expect(adminService.validatePasscode('')).toBe(false);
      expect(adminService.validatePasscode('616162')).toBe(false);
    });
  });

  describe('validateTitle', () => {
    it('should return true for valid title', () => {
      expect(adminService.validateTitle('Valid Title')).toBe(true);
      expect(adminService.validateTitle('A')).toBe(true);
    });

    it('should return false for invalid title', () => {
      expect(adminService.validateTitle('')).toBe(false);
      expect(adminService.validateTitle('   ')).toBe(false);
    });
  });

  describe('validateAssignmentCount', () => {
    it('should return true for valid assignment counts', () => {
      expect(adminService.validateAssignmentCount([])).toBe(true);
      expect(adminService.validateAssignmentCount(Array(5).fill({}))).toBe(true);
      expect(adminService.validateAssignmentCount(Array(10).fill({}))).toBe(true);
    });

    it('should return false for invalid assignment counts', () => {
      expect(adminService.validateAssignmentCount(Array(11).fill({}))).toBe(false);
    });
  });

  describe('validateAttendeeExists', () => {
    const attendees = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    it('should return true for existing attendee', () => {
      expect(adminService.validateAttendeeExists('1', attendees)).toBe(true);
      expect(adminService.validateAttendeeExists('2', attendees)).toBe(true);
    });

    it('should return false for non-existing attendee', () => {
      expect(adminService.validateAttendeeExists('3', attendees)).toBe(false);
      expect(adminService.validateAttendeeExists('', attendees)).toBe(false);
    });
  });
});
