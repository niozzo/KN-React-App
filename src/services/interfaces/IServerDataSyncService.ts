/**
 * Interface for Server Data Sync Service
 */

export interface SyncResult {
  success: boolean;
  syncedTables: string[];
  errors: string[];
  totalRecords: number;
}

export interface IServerDataSyncService {
  syncAllData(): Promise<SyncResult>;
  getCachedTableData(tableName: string): Promise<any[]>;
  clearCache(): Promise<void>;
}
