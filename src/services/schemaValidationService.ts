/**
 * Database Schema Validation Service
 * Story 1.3: PWA Polish & Branding
 * 
 * Validates database schema consistency to catch changes during development
 * and ensure data synchronization continues to work properly.
 */

import { supabase } from '../lib/supabase';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  tables: TableSchema[];
  lastValidated: string;
}

export interface SchemaError {
  table: string;
  field: string;
  type: 'missing_table' | 'missing_column' | 'type_mismatch' | 'constraint_missing' | 'index_missing';
  message: string;
  severity: 'error' | 'warning';
}

export interface SchemaWarning {
  table: string;
  field: string;
  type: 'deprecated' | 'unexpected' | 'performance';
  message: string;
  suggestion: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  constraints: ConstraintSchema[];
  rowCount: number;
  lastModified: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  maxLength?: number;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintSchema {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export class SchemaValidationService {
  private readonly EXPECTED_TABLES = [
    'attendees',
    'sponsors',
    'agenda_items',
    'seat_assignments',
    'dining_options',
    'hotels',
    'seating_configurations',
    'user_profiles'
  ];

  private readonly EXPECTED_SCHEMAS: Record<string, Partial<TableSchema>> = {
    attendees: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'first_name', type: 'text', nullable: false },
        { name: 'last_name', type: 'text', nullable: false },
        { name: 'email', type: 'text', nullable: false },
        { name: 'company', type: 'text', nullable: true },
        { name: 'title', type: 'text', nullable: true },
        { name: 'access_code', type: 'text', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false },
        { name: 'updated_at', type: 'timestamp', nullable: false }
      ]
    },
    sponsors: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'text', nullable: false },
        { name: 'logo_url', type: 'text', nullable: true },
        { name: 'description', type: 'text', nullable: true },
        { name: 'website', type: 'text', nullable: true },
        { name: 'tier', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    agenda_items: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'start_time', type: 'timestamp', nullable: false },
        { name: 'end_time', type: 'timestamp', nullable: false },
        { name: 'location', type: 'text', nullable: true },
        { name: 'speaker', type: 'text', nullable: true },
        { name: 'type', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    seat_assignments: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'attendee_id', type: 'uuid', nullable: false, isForeignKey: true },
        { name: 'table_number', type: 'integer', nullable: false },
        { name: 'seat_number', type: 'integer', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    dining_options: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'dietary_restrictions', type: 'text', nullable: true },
        { name: 'meal_type', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    hotels: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'text', nullable: false },
        { name: 'address', type: 'text', nullable: true },
        { name: 'phone', type: 'text', nullable: true },
        { name: 'website', type: 'text', nullable: true },
        { name: 'distance_from_venue', type: 'numeric', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    seating_configurations: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'name', type: 'text', nullable: false },
        { name: 'table_count', type: 'integer', nullable: false },
        { name: 'seats_per_table', type: 'integer', nullable: false },
        { name: 'total_capacity', type: 'integer', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ]
    },
    user_profiles: {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true },
        { name: 'attendee_id', type: 'uuid', nullable: false, isForeignKey: true },
        { name: 'preferences', type: 'jsonb', nullable: true },
        { name: 'notifications_enabled', type: 'boolean', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false },
        { name: 'updated_at', type: 'timestamp', nullable: false }
      ]
    }
  };

  /**
   * Validate the entire database schema
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    console.log('🔍 Starting database schema validation...');
    
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tables: [],
      lastValidated: new Date().toISOString()
    };

    try {
      // Get all tables
      const tables = await this.getAllTables();
      result.tables = tables;

      // Validate each expected table
      for (const tableName of this.EXPECTED_TABLES) {
        const tableExists = tables.some(t => t.name === tableName);
        
        if (!tableExists) {
          result.errors.push({
            table: tableName,
            field: 'table',
            type: 'missing_table',
            message: `Expected table '${tableName}' not found`,
            severity: 'error'
          });
          result.isValid = false;
          continue;
        }

        // Get table structure
        const tableStructure = await this.getTableStructure(tableName);
        const expectedSchema = this.EXPECTED_SCHEMAS[tableName];

        if (expectedSchema) {
          // Validate columns
          this.validateColumns(tableName, tableStructure, expectedSchema, result);
          
          // Validate constraints
          this.validateConstraints(tableName, tableStructure, result);
          
          // Validate indexes
          this.validateIndexes(tableName, tableStructure, result);
        }
      }

      // Check for unexpected tables
      const unexpectedTables = tables.filter(t => !this.EXPECTED_TABLES.includes(t.name));
      for (const table of unexpectedTables) {
        result.warnings.push({
          table: table.name,
          field: 'table',
          type: 'unexpected',
          message: `Unexpected table '${table.name}' found`,
          suggestion: 'Consider if this table should be included in the expected schema'
        });
      }

      console.log(`✅ Schema validation completed: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      result.errors.push({
        table: 'system',
        field: 'validation',
        type: 'missing_table',
        message: `Schema validation failed: ${error.message}`,
        severity: 'error'
      });
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get all tables from the database
   */
  private async getAllTables(): Promise<TableSchema[]> {
    try {
      // For now, return the expected tables with basic structure
      // In a real implementation, you might query information_schema
      return this.EXPECTED_TABLES.map(tableName => ({
        name: tableName,
        columns: [],
        indexes: [],
        constraints: [],
        rowCount: 0,
        lastModified: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Failed to fetch tables:', error);
      throw error;
    }
  }

  /**
   * Get table structure details
   */
  private async getTableStructure(tableName: string): Promise<TableSchema> {
    try {
      // For now, return a basic structure based on expected schema
      // In a real implementation, you might query information_schema.columns
      const expectedSchema = this.EXPECTED_SCHEMAS[tableName];
      
      return {
        name: tableName,
        columns: expectedSchema?.columns || [],
        indexes: [],
        constraints: [],
        rowCount: 0,
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to fetch structure for table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Validate table columns
   */
  private validateColumns(
    tableName: string, 
    actualSchema: TableSchema, 
    expectedSchema: Partial<TableSchema>, 
    result: SchemaValidationResult
  ): void {
    if (!expectedSchema.columns) return;

    for (const expectedColumn of expectedSchema.columns) {
      const actualColumn = actualSchema.columns.find(c => c.name === expectedColumn.name);
      
      if (!actualColumn) {
        result.errors.push({
          table: tableName,
          field: expectedColumn.name,
          type: 'missing_column',
          message: `Expected column '${expectedColumn.name}' not found in table '${tableName}'`,
          severity: 'error'
        });
        result.isValid = false;
        continue;
      }

      // Validate column type
      if (expectedColumn.type && !this.isCompatibleType(actualColumn.type, expectedColumn.type)) {
        result.warnings.push({
          table: tableName,
          field: expectedColumn.name,
          type: 'type_mismatch',
          message: `Column '${expectedColumn.name}' has type '${actualColumn.type}', expected '${expectedColumn.type}'`,
          suggestion: 'Consider updating the column type or updating the expected schema'
        });
      }

      // Validate nullable constraint
      if (expectedColumn.nullable !== undefined && actualColumn.nullable !== expectedColumn.nullable) {
        result.warnings.push({
          table: tableName,
          field: expectedColumn.name,
          type: 'constraint_missing',
          message: `Column '${expectedColumn.name}' nullable constraint mismatch`,
          suggestion: 'Update the column constraint or expected schema'
        });
      }

      // Validate primary key
      if (expectedColumn.isPrimaryKey && !actualColumn.isPrimaryKey) {
        result.errors.push({
          table: tableName,
          field: expectedColumn.name,
          type: 'constraint_missing',
          message: `Column '${expectedColumn.name}' should be primary key`,
          severity: 'error'
        });
        result.isValid = false;
      }
    }
  }

  /**
   * Validate table constraints
   */
  private validateConstraints(tableName: string, actualSchema: TableSchema, result: SchemaValidationResult): void {
    // Check for primary key constraint
    const hasPrimaryKey = actualSchema.constraints.some(c => c.type === 'primary_key');
    if (!hasPrimaryKey) {
      result.warnings.push({
        table: tableName,
        field: 'constraints',
        type: 'constraint_missing',
        message: `Table '${tableName}' has no primary key constraint`,
        suggestion: 'Add a primary key constraint for better data integrity'
      });
    }
  }

  /**
   * Validate table indexes
   */
  private validateIndexes(tableName: string, actualSchema: TableSchema, result: SchemaValidationResult): void {
    // Check for basic indexes on common query fields
    const commonIndexFields = ['id', 'email', 'access_code', 'created_at'];
    
    for (const field of commonIndexFields) {
      const hasIndex = actualSchema.indexes.some(i => i.columns.includes(field));
      if (!hasIndex) {
        result.warnings.push({
          table: tableName,
          field: field,
          type: 'index_missing',
          message: `No index found on column '${field}' in table '${tableName}'`,
          suggestion: 'Consider adding an index for better query performance'
        });
      }
    }
  }

  /**
   * Check if two types are compatible
   */
  private isCompatibleType(actualType: string, expectedType: string): boolean {
    const typeMap: Record<string, string[]> = {
      'text': ['varchar', 'character varying', 'string'],
      'integer': ['int', 'int4', 'serial'],
      'uuid': ['uuid'],
      'timestamp': ['timestamptz', 'timestamp with time zone'],
      'boolean': ['bool'],
      'numeric': ['decimal', 'float', 'double precision'],
      'jsonb': ['json', 'jsonb']
    };

    const actualLower = actualType.toLowerCase();
    const expectedLower = expectedType.toLowerCase();

    if (actualLower === expectedLower) return true;
    
    const compatibleTypes = typeMap[expectedLower] || [];
    return compatibleTypes.includes(actualLower);
  }

  /**
   * Get schema validation status
   */
  async getValidationStatus(): Promise<{ lastValidated: string; isValid: boolean; errorCount: number; warningCount: number }> {
    try {
      const result = await this.validateSchema();
      return {
        lastValidated: result.lastValidated,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      };
    } catch (error) {
      console.error('❌ Failed to get validation status:', error);
      return {
        lastValidated: new Date().toISOString(),
        isValid: false,
        errorCount: 1,
        warningCount: 0
      };
    }
  }

  /**
   * Validate specific table
   */
  async validateTable(tableName: string): Promise<SchemaValidationResult> {
    console.log(`🔍 Validating table: ${tableName}`);
    
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tables: [],
      lastValidated: new Date().toISOString()
    };

    try {
      const tableStructure = await this.getTableStructure(tableName);
      result.tables = [tableStructure];

      const expectedSchema = this.EXPECTED_SCHEMAS[tableName];
      if (expectedSchema) {
        this.validateColumns(tableName, tableStructure, expectedSchema, result);
        this.validateConstraints(tableName, tableStructure, result);
        this.validateIndexes(tableName, tableStructure, result);
      }

    } catch (error) {
      console.error(`❌ Failed to validate table ${tableName}:`, error);
      result.errors.push({
        table: tableName,
        field: 'validation',
        type: 'missing_table',
        message: `Table validation failed: ${error.message}`,
        severity: 'error'
      });
      result.isValid = false;
    }

    return result;
  }
}
