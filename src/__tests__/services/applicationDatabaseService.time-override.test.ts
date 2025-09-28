/**
 * Application Database Service Time Override Tests
 * Story 2.2.2: Breakout Session Time Override
 * 
 * Tests for time override functionality in application database service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applicationDatabaseService, AgendaItemMetadata } from '../../services/applicationDatabaseService';

// Mock the service registry first
vi.mock('../../services/ServiceRegistry.ts', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ 
        eq: vi.fn(() => ({ data: [], error: null }))
      }))
    }))
  };

  return {
    serviceRegistry: {
      invalidateCache: vi.fn(),
      getApplicationDbClient: () => mockSupabaseClient,
      getAdminDbClient: () => mockSupabaseClient
    }
  };
});

// Mock window.dispatchEvent for event emission
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

describe('ApplicationDatabaseService - Time Override', () => {
  let mockSupabaseClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDispatchEvent.mockClear();
    
    // Get the mocked service registry
    const { serviceRegistry } = await import('../../services/ServiceRegistry.ts');
    mockSupabaseClient = serviceRegistry.getAdminDbClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('updateAgendaItemTimes', () => {
    it('should update agenda item times with override enabled', async () => {
      // Arrange
      const agendaItemId = 'test-agenda-item-1';
      const startTime = '09:00:00';
      const endTime = '12:00:00';
      const enabled = true;

      const mockUpsert = vi.fn(() => ({ error: null }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act
      await applicationDatabaseService.updateAgendaItemTimes(
        agendaItemId,
        startTime,
        endTime,
        enabled
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('agenda_item_metadata');
      expect(mockUpsert).toHaveBeenCalledWith({
        id: agendaItemId,
        start_time: startTime,
        end_time: endTime,
        time_override_enabled: enabled,
        title: "Session",
        last_synced: expect.any(String)
      });
    });

    it('should emit time override updated event', async () => {
      // Arrange
      const agendaItemId = 'test-agenda-item-1';
      const startTime = '09:00:00';
      const endTime = '12:00:00';
      const enabled = true;

      const mockUpsert = vi.fn(() => ({ error: null }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act
      await applicationDatabaseService.updateAgendaItemTimes(
        agendaItemId,
        startTime,
        endTime,
        enabled
      );

      // Assert
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'agendaTimeOverrideUpdated',
          detail: {
            agendaItemId,
            startTime,
            endTime,
            enabled,
            timestamp: expect.any(String)
          }
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const agendaItemId = 'test-agenda-item-1';
      const startTime = '09:00:00';
      const endTime = '12:00:00';
      const enabled = true;
      const dbError = new Error('Database connection failed');

      const mockUpsert = vi.fn(() => ({ error: dbError }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act & Assert
      await expect(
        applicationDatabaseService.updateAgendaItemTimes(
          agendaItemId,
          startTime,
          endTime,
          enabled
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should update agenda item times with override disabled', async () => {
      // Arrange
      const agendaItemId = 'test-agenda-item-1';
      const startTime = '09:00:00';
      const endTime = '12:00:00';
      const enabled = false;

      const mockUpsert = vi.fn(() => ({ error: null }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act
      await applicationDatabaseService.updateAgendaItemTimes(
        agendaItemId,
        startTime,
        endTime,
        enabled
      );

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith({
        id: agendaItemId,
        start_time: startTime,
        end_time: endTime,
        time_override_enabled: false,
        title: "Session",
        last_synced: expect.any(String)
      });
    });
  });

  describe('getAgendaItemTimeOverrides', () => {
    it('should retrieve enabled time overrides', async () => {
      // Arrange
      // Expected result after conversion to HH:MM format
      const expectedResult = [
        {
          id: 'test-item-1',
          title: 'Test Session 1',
          start_time: '09:00',
          end_time: '12:00',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        },
        {
          id: 'test-item-2',
          title: 'Test Session 2',
          start_time: '13:00',
          end_time: '16:00',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        }
      ];
      const mockOverrides: AgendaItemMetadata[] = [
        {
          id: 'test-item-1',
          title: 'Test Session 1',
          start_time: '09:00:00',
          end_time: '12:00:00',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        },
        {
          id: 'test-item-2',
          title: 'Test Session 2',
          start_time: '13:00:00',
          end_time: '16:00:00',
          time_override_enabled: true,
          last_synced: '2025-01-27T10:00:00Z'
        }
      ];

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ data: mockOverrides, error: null }))
      }));
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      // Act
      const result = await applicationDatabaseService.getAgendaItemTimeOverrides();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('agenda_item_metadata');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      }));
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      // Act
      const result = await applicationDatabaseService.getAgendaItemTimeOverrides();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Query failed');
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: dbError }))
      }));
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      // Act & Assert
      await expect(
        applicationDatabaseService.getAgendaItemTimeOverrides()
      ).rejects.toThrow('Query failed');
    });
  });

  describe('syncAgendaItemMetadata', () => {
    it('should include time override enabled flag in sync', async () => {
      // Arrange
      const agendaItem = {
        id: 'test-item-1',
        title: 'Test Session',
        start_time: '09:00:00',
        end_time: '12:00:00',
        time_override_enabled: true
      };

      const mockUpsert = vi.fn(() => ({ error: null }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act
      await applicationDatabaseService.syncAgendaItemMetadata(agendaItem);

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith({
        id: agendaItem.id,
        title: agendaItem.title,
        start_time: agendaItem.start_time,
        end_time: agendaItem.end_time,
        time_override_enabled: true,
        title: agendaItem.title,
        last_synced: expect.any(String)
      });
    });

    it('should default time override enabled to false when not provided', async () => {
      // Arrange
      const agendaItem = {
        id: 'test-item-1',
        title: 'Test Session',
        start_time: '09:00:00',
        end_time: '12:00:00'
      };

      const mockUpsert = vi.fn(() => ({ error: null }));
      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert
      });

      // Act
      await applicationDatabaseService.syncAgendaItemMetadata(agendaItem);

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith({
        id: agendaItem.id,
        title: agendaItem.title,
        start_time: agendaItem.start_time,
        end_time: agendaItem.end_time,
        time_override_enabled: false,
        title: agendaItem.title,
        last_synced: expect.any(String)
      });
    });
  });
});
