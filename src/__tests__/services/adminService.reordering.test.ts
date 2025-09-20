/**
 * AdminService Reordering Tests
 * 
 * Tests for speaker reordering functionality in AdminService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../../services/adminService';
import { applicationDbService } from '../../services/applicationDatabaseService';
import { pwaDataSyncService } from '../../services/pwaDataSyncService';

// Mock dependencies
vi.mock('../../services/applicationDatabaseService', () => ({
  applicationDbService: {
    reorderSpeakersForAgendaItem: vi.fn(),
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn(),
    cacheTableData: vi.fn(),
  }
}));

describe('AdminService - Speaker Reordering', () => {
  let adminService: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    adminService = new AdminService();
  });

  describe('reorderSpeakers', () => {
    const mockSpeakers = [
      {
        id: '1',
        agenda_item_id: 'agenda-1',
        attendee_id: 'attendee-1',
        role: 'presenter',
        display_order: 1,
        created_at: '2025-01-16T00:00:00Z',
        updated_at: '2025-01-16T00:00:00Z'
      },
      {
        id: '2',
        agenda_item_id: 'agenda-1',
        attendee_id: 'attendee-2',
        role: 'moderator',
        display_order: 2,
        created_at: '2025-01-16T00:00:00Z',
        updated_at: '2025-01-16T00:00:00Z'
      }
    ];

    it('should reorder speakers successfully', async () => {
      // Arrange
      const reorderedSpeakers = [mockSpeakers[1], mockSpeakers[0]]; // Swap order
      vi.mocked(applicationDbService.reorderSpeakersForAgendaItem).mockResolvedValue(undefined);
      vi.mocked(pwaDataSyncService.cacheTableData).mockResolvedValue(undefined);

      // Act
      await adminService.reorderSpeakers('agenda-1', reorderedSpeakers);

      // Assert
      expect(applicationDbService.reorderSpeakersForAgendaItem).toHaveBeenCalledWith(
        'agenda-1',
        [
          { id: '2', display_order: 1 },
          { id: '1', display_order: 2 }
        ]
      );
      expect(pwaDataSyncService.cacheTableData).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const reorderedSpeakers = [mockSpeakers[1], mockSpeakers[0]];
      const error = new Error('Database connection failed');
      vi.mocked(applicationDbService.reorderSpeakersForAgendaItem).mockRejectedValue(error);

      // Act & Assert
      await expect(adminService.reorderSpeakers('agenda-1', reorderedSpeakers))
        .rejects.toThrow('Database connection failed');
    });

    it('should update display_order values correctly', async () => {
      // Arrange
      const reorderedSpeakers = [mockSpeakers[1], mockSpeakers[0]]; // Swap order
      vi.mocked(applicationDbService.reorderSpeakersForAgendaItem).mockResolvedValue(undefined);
      vi.mocked(pwaDataSyncService.cacheTableData).mockResolvedValue(undefined);

      // Act
      await adminService.reorderSpeakers('agenda-1', reorderedSpeakers);

      // Assert
      const expectedOrders = [
        { id: '2', display_order: 1 },
        { id: '1', display_order: 2 }
      ];
      expect(applicationDbService.reorderSpeakersForAgendaItem).toHaveBeenCalledWith(
        'agenda-1',
        expectedOrders
      );
    });

    it('should update local cache with new order', async () => {
      // Arrange
      const reorderedSpeakers = [mockSpeakers[1], mockSpeakers[0]];
      vi.mocked(applicationDbService.reorderSpeakersForAgendaItem).mockResolvedValue(undefined);
      vi.mocked(pwaDataSyncService.cacheTableData).mockResolvedValue(undefined);

      // Act
      await adminService.reorderSpeakers('agenda-1', reorderedSpeakers);

      // Assert
      expect(pwaDataSyncService.cacheTableData).toHaveBeenCalledWith(
        'speaker_assignments',
        expect.arrayContaining([
          expect.objectContaining({
            id: '2',
            display_order: 1,
            updated_at: expect.any(String)
          }),
          expect.objectContaining({
            id: '1',
            display_order: 2,
            updated_at: expect.any(String)
          })
        ])
      );
    });
  });

  describe('getAgendaItemsWithAssignments', () => {
    it('should sort speakers by display_order', async () => {
      // Arrange
      const mockAssignments = [
        {
          id: '1',
          agenda_item_id: 'agenda-1',
          attendee_id: 'attendee-1',
          display_order: 3
        },
        {
          id: '2',
          agenda_item_id: 'agenda-1',
          attendee_id: 'attendee-2',
          display_order: 1
        },
        {
          id: '3',
          agenda_item_id: 'agenda-1',
          attendee_id: 'attendee-3',
          display_order: 2
        }
      ];

      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAssignments);
      
      // Mock localStorage for agenda items
      const mockAgendaItems = [
        { id: 'agenda-1', title: 'Session 1' }
      ];
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ data: mockAgendaItems }));

      // Act
      const result = await adminService.getAgendaItemsWithAssignments();

      // Assert
      expect(result[0].speaker_assignments).toEqual([
        expect.objectContaining({ display_order: 1 }),
        expect.objectContaining({ display_order: 2 }),
        expect.objectContaining({ display_order: 3 })
      ]);
    });

    it('should handle missing display_order values', async () => {
      // Arrange
      const mockAssignments = [
        {
          id: '1',
          agenda_item_id: 'agenda-1',
          attendee_id: 'attendee-1'
          // No display_order
        },
        {
          id: '2',
          agenda_item_id: 'agenda-1',
          attendee_id: 'attendee-2',
          display_order: 1
        }
      ];

      vi.mocked(pwaDataSyncService.getCachedTableData).mockResolvedValue(mockAssignments);
      
      const mockAgendaItems = [
        { id: 'agenda-1', title: 'Session 1' }
      ];
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ data: mockAgendaItems }));

      // Act
      const result = await adminService.getAgendaItemsWithAssignments();

      // Assert
      expect(result[0].speaker_assignments).toEqual([
        expect.objectContaining({ display_order: 1 }),
        expect.objectContaining({ display_order: 0 }) // Should default to 0
      ]);
    });
  });
});
