/**
 * Schema Validation Service Tests
 * Story 1.3: PWA Polish & Branding
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchemaValidationService } from '../services/schemaValidationService';

// Mock fetch
global.fetch = vi.fn();

describe('SchemaValidationService', () => {
  let service: SchemaValidationService;

  beforeEach(() => {
    service = new SchemaValidationService();
    vi.clearAllMocks();
  });

  describe('validateSchema', () => {
    it('should validate schema successfully when all tables exist', async () => {
      // Mock successful API responses
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tables: [
            { table_name: 'attendees', count: 100 },
            { table_name: 'sponsors', count: 20 },
            { table_name: 'agenda_items', count: 50 }
          ]
        })
      });

      // Mock table structure responses
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          columns: [
            { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
            { name: 'first_name', type: 'text', nullable: false },
            { name: 'last_name', type: 'text', nullable: false },
            { name: 'email', type: 'text', nullable: false }
          ],
          indexes: [],
          constraints: [{ type: 'primary_key', columns: ['id'] }],
          rowCount: 100
        })
      });

      const result = await service.validateSchema();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.tables).toHaveLength(3);
    });

    it('should detect missing tables', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tables: [
            { table_name: 'attendees', count: 100 }
            // Missing sponsors and agenda_items
          ]
        })
      });

      const result = await service.validateSchema();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // Missing sponsors and agenda_items
      expect(result.errors[0].type).toBe('missing_table');
    });

    it('should detect missing columns', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tables: [{ table_name: 'attendees', count: 100 }]
        })
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          columns: [
            { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true }
            // Missing first_name, last_name, email
          ],
          indexes: [],
          constraints: [],
          rowCount: 100
        })
      });

      const result = await service.validateSchema();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing_column')).toBe(true);
    });

    it('should detect type mismatches', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tables: [{ table_name: 'attendees', count: 100 }]
        })
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          columns: [
            { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
            { name: 'first_name', type: 'varchar', nullable: false }, // Different type
            { name: 'last_name', type: 'text', nullable: false },
            { name: 'email', type: 'text', nullable: false }
          ],
          indexes: [],
          constraints: [],
          rowCount: 100
        })
      });

      const result = await service.validateSchema();

      expect(result.warnings.some(w => w.type === 'type_mismatch')).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service.validateSchema();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Schema validation failed');
    });
  });

  describe('validateTable', () => {
    it('should validate a specific table', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          columns: [
            { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
            { name: 'name', type: 'text', nullable: false }
          ],
          indexes: [],
          constraints: [],
          rowCount: 50
        })
      });

      const result = await service.validateTable('sponsors');

      expect(result.isValid).toBe(true);
      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('sponsors');
    });
  });

  describe('getValidationStatus', () => {
    it('should return validation status', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tables: [{ table_name: 'attendees', count: 100 }]
        })
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          columns: [
            { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
            { name: 'first_name', type: 'text', nullable: false },
            { name: 'last_name', type: 'text', nullable: false },
            { name: 'email', type: 'text', nullable: false }
          ],
          indexes: [],
          constraints: [],
          rowCount: 100
        })
      });

      const status = await service.getValidationStatus();

      expect(status).toHaveProperty('lastValidated');
      expect(status).toHaveProperty('isValid');
      expect(status).toHaveProperty('errorCount');
      expect(status).toHaveProperty('warningCount');
    });
  });

  describe('isCompatibleType', () => {
    it('should recognize compatible types', () => {
      const service = new SchemaValidationService();
      
      // Access private method for testing
      const isCompatible = (service as any).isCompatibleType('varchar', 'text');
      expect(isCompatible).toBe(true);
    });

    it('should recognize incompatible types', () => {
      const service = new SchemaValidationService();
      
      const isCompatible = (service as any).isCompatibleType('integer', 'text');
      expect(isCompatible).toBe(false);
    });
  });
});
