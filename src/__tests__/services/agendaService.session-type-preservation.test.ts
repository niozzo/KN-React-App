/**
 * Session Type Preservation Tests
 * Tests for the critical fix that prevents session_type field corruption during time overrides
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgendaService } from '../../services/agendaService';
import { unifiedCacheService } from '../../services/unifiedCacheService';
import { applicationDatabaseService } from '../../services/applicationDatabaseService';

// Mock dependencies
vi.mock('../../services/unifiedCacheService');
vi.mock('../../services/applicationDatabaseService');

describe('AgendaService - Session Type Preservation', () => {
  let agendaService: AgendaService;
  let mockUnifiedCache: any;
  let mockApplicationDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock unified cache service
    mockUnifiedCache = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    };
    (unifiedCacheService as any) = mockUnifiedCache;

    // Mock application database service
    mockApplicationDb = {
      getAgendaItemTimeOverrides: vi.fn()
    };
    (applicationDatabaseService as any) = mockApplicationDb;

    agendaService = new AgendaService();
  });

  describe('applyTimeOverrides - Session Type Preservation', () => {
    it('should preserve session_type field during time overrides', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'coffee-break-1',
          title: 'Morning Coffee Break',
          session_type: 'meal',
          start_time: '10:15:00',
          end_time: '10:30:00',
          date: '2025-10-21'
        },
        {
          id: 'general-session-1',
          title: 'AI-Powered Transformation',
          session_type: 'general',
          start_time: '09:00:00',
          end_time: '10:00:00',
          date: '2025-10-21'
        },
        {
          id: 'lunch-session-1',
          title: 'Lunch',
          session_type: 'meal',
          start_time: '12:00:00',
          end_time: '13:00:00',
          date: '2025-10-21'
        }
      ];

      const timeOverrides = [
        {
          id: 'coffee-break-1',
          start_time: '10:20:00',
          end_time: '10:35:00',
          date: '2025-10-21'
        },
        {
          id: 'general-session-1',
          start_time: '09:15:00',
          end_time: '10:15:00',
          date: '2025-10-21'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(timeOverrides);

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result).toHaveLength(3);
      
      // Coffee break should have updated times but preserved session_type
      const coffeeBreak = result.find(item => item.id === 'coffee-break-1');
      expect(coffeeBreak.session_type).toBe('meal'); // ✅ Preserved
      expect(coffeeBreak.start_time).toBe('10:20:00'); // ✅ Updated
      expect(coffeeBreak.end_time).toBe('10:35:00'); // ✅ Updated
      
      // General session should have updated times but preserved session_type
      const generalSession = result.find(item => item.id === 'general-session-1');
      expect(generalSession.session_type).toBe('general'); // ✅ Preserved
      expect(generalSession.start_time).toBe('09:15:00'); // ✅ Updated
      expect(generalSession.end_time).toBe('10:15:00'); // ✅ Updated
      
      // Lunch session should remain unchanged (no override)
      const lunchSession = result.find(item => item.id === 'lunch-session-1');
      expect(lunchSession.session_type).toBe('meal'); // ✅ Preserved
      expect(lunchSession.start_time).toBe('12:00:00'); // ✅ Unchanged
      expect(lunchSession.end_time).toBe('13:00:00'); // ✅ Unchanged
    });

    it('should preserve all non-time fields during time overrides', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'test-session',
          title: 'Test Session',
          description: 'Test Description',
          session_type: 'meal',
          location: 'Test Location',
          speaker: 'Test Speaker',
          capacity: 100,
          registered_count: 50,
          attendee_selection: 'everyone',
          selected_attendees: [],
          isActive: true,
          has_seating: false,
          seating_notes: 'No seating',
          seating_type: 'open',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      const timeOverrides = [
        {
          id: 'test-session',
          start_time: '10:30:00',
          end_time: '11:30:00',
          date: '2025-10-21'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(timeOverrides);

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result).toHaveLength(1);
      const session = result[0];
      
      // Time fields should be updated
      expect(session.start_time).toBe('10:30:00');
      expect(session.end_time).toBe('11:30:00');
      
      // All other fields should be preserved exactly
      expect(session.id).toBe('test-session');
      expect(session.title).toBe('Test Session');
      expect(session.description).toBe('Test Description');
      expect(session.session_type).toBe('meal');
      expect(session.location).toBe('Test Location');
      expect(session.speaker).toBe('Test Speaker');
      expect(session.capacity).toBe(100);
      expect(session.registered_count).toBe(50);
      expect(session.attendee_selection).toBe('everyone');
      expect(session.selected_attendees).toEqual([]);
      expect(session.isActive).toBe(true);
      expect(session.has_seating).toBe(false);
      expect(session.seating_notes).toBe('No seating');
      expect(session.seating_type).toBe('open');
      expect(session.created_at).toBe('2025-01-01T00:00:00Z');
      expect(session.updated_at).toBe('2025-01-01T00:00:00Z');
    });

    it('should handle empty time overrides without corruption', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'session-1',
          title: 'Session 1',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue([]);

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].session_type).toBe('meal'); // ✅ Preserved
      expect(result[0].start_time).toBe('10:00:00'); // ✅ Unchanged
      expect(result[0].end_time).toBe('11:00:00'); // ✅ Unchanged
    });

    it('should handle partial time overrides correctly', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'session-1',
          title: 'Session 1',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      const timeOverrides = [
        {
          id: 'session-1',
          start_time: '10:30:00'
          // No end_time or date override
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(timeOverrides);

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].session_type).toBe('meal'); // ✅ Preserved
      expect(result[0].start_time).toBe('10:30:00'); // ✅ Updated
      expect(result[0].end_time).toBe('11:00:00'); // ✅ Preserved (no override)
      expect(result[0].date).toBe('2025-10-21'); // ✅ Preserved (no override)
    });
  });

  describe('Regression Prevention', () => {
    it('should not call transformer during time overrides', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'test-session',
          title: 'Test Session',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      const timeOverrides = [
        {
          id: 'test-session',
          start_time: '10:30:00'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(timeOverrides);

      // Spy on the transformer to ensure it's not called
      const transformSpy = vi.spyOn(agendaService['agendaTransformer'], 'transformArrayFromDatabaseWithTimeOverrides');

      // Act
      await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(transformSpy).not.toHaveBeenCalled(); // ✅ Transformer not called
    });

    it('should maintain data integrity across multiple time override applications', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'coffee-break',
          title: 'Coffee Break',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '10:15:00',
          date: '2025-10-21'
        }
      ];

      const timeOverrides = [
        {
          id: 'coffee-break',
          start_time: '10:15:00',
          end_time: '10:30:00'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(timeOverrides);

      // Act - Apply time overrides multiple times
      let result = await (agendaService as any).applyTimeOverrides(agendaItems);
      result = await (agendaService as any).applyTimeOverrides(result);
      result = await (agendaService as any).applyTimeOverrides(result);

      // Assert
      expect(result[0].session_type).toBe('meal'); // ✅ Still preserved after multiple applications
      expect(result[0].start_time).toBe('10:15:00'); // ✅ Time override applied
      expect(result[0].end_time).toBe('10:30:00'); // ✅ Time override applied
    });
  });

  describe('Error Handling', () => {
    it('should handle time override service errors gracefully', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'session-1',
          title: 'Session 1',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result).toEqual(agendaItems); // ✅ Original data returned on error
      expect(result[0].session_type).toBe('meal'); // ✅ Session type preserved
    });

    it('should handle malformed time override data', async () => {
      // Arrange
      const agendaItems = [
        {
          id: 'session-1',
          title: 'Session 1',
          session_type: 'meal',
          start_time: '10:00:00',
          end_time: '11:00:00',
          date: '2025-10-21'
        }
      ];

      const malformedOverrides = [
        {
          id: 'session-1',
          start_time: null, // Invalid time
          end_time: undefined // Invalid time
        }
      ];

      mockApplicationDb.getAgendaItemTimeOverrides.mockResolvedValue(malformedOverrides);

      // Act
      const result = await (agendaService as any).applyTimeOverrides(agendaItems);

      // Assert
      expect(result[0].session_type).toBe('meal'); // ✅ Session type preserved
      expect(result[0].start_time).toBe('10:00:00'); // ✅ Original time preserved (null override ignored)
      expect(result[0].end_time).toBe('11:00:00'); // ✅ Original time preserved (undefined override ignored)
    });
  });
});
