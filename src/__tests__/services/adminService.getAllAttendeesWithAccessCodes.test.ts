/**
 * AdminService.getAllAttendeesWithAccessCodes Tests
 * Tests for the method that retrieves attendees with access codes for QR generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminService } from '../../services/adminService';

describe('AdminService.getAllAttendeesWithAccessCodes', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should load attendees from kn_cache_attendees localStorage', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123',
        other_field: 'should not be included'
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        access_code: 'XYZ789'
      }
    ];

    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: mockAttendees }));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      access_code: 'ABC123'
    });
    expect(result[0]).not.toHaveProperty('other_field');
  });

  it('should fallback to attendees key if kn_cache_attendees empty', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123'
      }
    ];

    // Empty kn_cache_attendees
    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: [] }));
    // Fallback data
    localStorage.setItem('attendees', JSON.stringify(mockAttendees));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].access_code).toBe('ABC123');
  });

  it('should filter out attendees without access codes', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123'
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        access_code: null // No access code
      },
      {
        id: '3',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com'
        // Missing access_code field
      }
    ];

    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: mockAttendees }));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return only required fields (id, name, email, code)', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123',
        business_phone: '555-1234',
        dietary_requirements: 'Vegetarian',
        hotel_selection: 'Marriott',
        check_in_date: '2025-01-15'
      }
    ];

    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: mockAttendees }));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(1);
    expect(Object.keys(result[0])).toEqual(['id', 'first_name', 'last_name', 'email', 'access_code']);
    expect(result[0]).not.toHaveProperty('business_phone');
    expect(result[0]).not.toHaveProperty('dietary_requirements');
  });

  it('should handle empty localStorage gracefully', async () => {
    // Arrange
    // No data in localStorage

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle direct array format in kn_cache_attendees', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123'
      }
    ];

    // Direct array format (not wrapped in { data: ... })
    localStorage.setItem('kn_cache_attendees', JSON.stringify(mockAttendees));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].access_code).toBe('ABC123');
  });

  it('should handle JSON parse errors gracefully', async () => {
    // Arrange
    localStorage.setItem('kn_cache_attendees', 'invalid json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    // Cleanup
    consoleSpy.mockRestore();
  });

  it('should handle multiple attendees with various edge cases', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123'
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        access_code: '' // Empty string - should be filtered
      },
      {
        id: '3',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        access_code: 'XYZ789'
      },
      {
        id: '4',
        first_name: 'Alice',
        last_name: 'Williams',
        email: 'alice@example.com',
        access_code: undefined // Undefined - should be filtered
      }
    ];

    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: mockAttendees }));

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
  });
});

