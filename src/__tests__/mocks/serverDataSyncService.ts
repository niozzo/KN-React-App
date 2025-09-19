/**
 * Mock serverDataSyncService for testing
 */

export const serverDataSyncService = {
  syncAllData: vi.fn().mockResolvedValue({
    success: true,
    syncedTables: ['agenda_items'],
    errors: [],
    totalRecords: 0
  }),
  getCachedTableData: vi.fn().mockResolvedValue([]),
  clearCache: vi.fn().mockResolvedValue(undefined)
};