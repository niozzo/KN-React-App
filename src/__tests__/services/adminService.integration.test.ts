/**
 * Admin Service Integration Tests - Simplified Version
 * 
 * Tests for the simplified admin service using the new cache architecture
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminService } from '../../services/adminService';
import { simplifiedDataService } from '../../services/simplifiedDataService';
import { serverDataSyncService } from '../../services/serverDataSyncService';

// Mock dependencies
vi.mock('../../services/simplifiedDataService');
vi.mock('../../services/serverDataSyncService');
vi.mock('../../services/applicationDatabaseService');
vi.mock('../../services/SupabaseClientFactory');

const mockSimplifiedDataService = vi.mocked(simplifiedDataService);
const mockServerDataSyncService = vi.mocked(serverDataSyncService);

describe('Admin Service - Simplified Integration', () => {
  let adminService: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    adminService = new AdminService();
    
    // Mock simplified data service responses
    mockSimplifiedDataService.getData.mockResolvedValue({
      success: true,
      data: [],
      fromCache: true
    });
    
    // Mock server sync service
    mockServerDataSyncService.syncAllData.mockResolvedValue({
      success: true,
      syncedTables: ['attendees', 'agenda_items'],
      errors: []
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Data Loading', () => {
    it('should load agenda items with assignments', async () => {
      const mockAgendaItems = [
        {
          id: '1',
          name: 'Opening Keynote',
          date: '2025-10-21',
          start_time: '09:00',
          end_time: '10:00'
        }
      ];

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockAgendaItems,
        fromCache: true
      });

      const result = await adminService.getAgendaItemsWithAssignments();

      expect(result).toBeDefined();
      expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('agenda_items');
    });

    it('should load dining options with assignments', async () => {
      const mockDiningOptions = [
        {
          id: '1',
          name: 'Networking Dinner',
          date: '2025-10-21',
          time: '18:30'
        }
      ];

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockDiningOptions,
        fromCache: true
      });

      const result = await adminService.getDiningOptionsWithMetadata();

      expect(result).toBeDefined();
      expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('dining_options');
    });

  });

  describe('Cache Integration', () => {
    it('should use cache when available', async () => {
      const mockData = [{ id: '1', name: 'Test Item' }];

      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: mockData,
        fromCache: true
      });

      await adminService.getAgendaItemsWithAssignments();

      expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('agenda_items');
    });

    it('should fallback to server when cache is empty', async () => {
      mockSimplifiedDataService.getData.mockResolvedValue({
        success: true,
        data: [],
        fromCache: false
      });

      await adminService.getAgendaItemsWithAssignments();

      expect(mockSimplifiedDataService.getData).toHaveBeenCalledWith('agenda_items');
    });
  });
});