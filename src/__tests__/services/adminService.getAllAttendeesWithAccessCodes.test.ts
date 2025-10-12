/**
 * AdminService.getAllAttendeesWithAccessCodes Tests
 * Tests for the method that retrieves attendees with access codes for QR generation
 * 
 * Note: This method fetches directly from Supabase because access_code is filtered
 * from cached data for security reasons.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminService } from '../../services/adminService';

// Mock supabase lib
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    }
  };
});

// Import the mocked supabase after the mock is defined
const { supabase: mockSupabase } = await import('../../lib/supabase');

describe('AdminService.getAllAttendeesWithAccessCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    (mockSupabase.from as any).mockReturnThis();
    (mockSupabase.select as any).mockReturnThis();
    (mockSupabase.not as any).mockReturnThis();
    (mockSupabase.order as any).mockResolvedValue({ data: [], error: null });
  });

  it('should fetch attendees from Supabase with access codes', async () => {
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
        access_code: 'XYZ789'
      }
    ];

    mockSupabase.order.mockResolvedValue({ data: mockAttendees, error: null });

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockAttendees[0]);
    expect(mockSupabase.from).toHaveBeenCalledWith('attendees');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, first_name, last_name, email, access_code');
    expect(mockSupabase.not).toHaveBeenCalledWith('access_code', 'is', null);
    expect(mockSupabase.order).toHaveBeenCalledWith('last_name', { ascending: true });
  });

  it('should return attendees ordered by last name', async () => {
    // Arrange
    const mockAttendees = [
      {
        id: '1',
        first_name: 'Jane',
        last_name: 'Anderson',
        email: 'jane@example.com',
        access_code: 'XYZ789'
      },
      {
        id: '2',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        access_code: 'ABC123'
      }
    ];

    mockSupabase.order.mockResolvedValue({ data: mockAttendees, error: null });

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].last_name).toBe('Anderson');
    expect(result[1].last_name).toBe('Doe');
  });

  it('should return empty array on Supabase error', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' }
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    // Cleanup
    consoleSpy.mockRestore();
  });

  it('should return empty array on exception', async () => {
    // Arrange
    mockSupabase.order.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    // Cleanup
    consoleSpy.mockRestore();
  });

  it('should filter out attendees without access codes via SQL', async () => {
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

    mockSupabase.order.mockResolvedValue({ data: mockAttendees, error: null });

    // Act
    await adminService.getAllAttendeesWithAccessCodes();

    // Assert - verify SQL filter was applied
    expect(mockSupabase.not).toHaveBeenCalledWith('access_code', 'is', null);
  });

  it('should return only required fields from database', async () => {
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

    mockSupabase.order.mockResolvedValue({ data: mockAttendees, error: null });

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toHaveLength(1);
    expect(Object.keys(result[0])).toEqual(['id', 'first_name', 'last_name', 'email', 'access_code']);
    expect(mockSupabase.select).toHaveBeenCalledWith('id, first_name, last_name, email, access_code');
  });

  it('should handle empty result set gracefully', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle null data response gracefully', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: null, error: null });

    // Act
    const result = await adminService.getAllAttendeesWithAccessCodes();

    // Assert
    expect(result).toEqual([]);
  });
});

