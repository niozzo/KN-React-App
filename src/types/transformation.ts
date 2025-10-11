/**
 * Transformation Types for Data Transformation Layer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

// Base data transformer interface
export interface DataTransformer<T> {
  transformFromDatabase(dbData: any): T
  transformToDatabase(uiData: T): any
  getUISchema(): SchemaDefinition
  getDatabaseSchema(): SchemaDefinition
  validateTransformation(data: any): boolean
}

// Field mapping configuration
export interface FieldMapping {
  source: string        // Database field name
  target: string        // UI field name
  type: string          // Data type conversion
  defaultValue?: any    // Default if field missing
  computed?: boolean    // Computed field for UI
  required?: boolean    // Whether field is required
}

// Schema definition interface
export interface SchemaDefinition {
  fields: FieldMapping[]
  tableName: string
  uiModel: string
  version: string
}

// Transformation error interface
export interface TransformationError {
  code: string
  message: string
  field?: string
  details?: any
  timestamp: Date
  transformer: string
}

// Error types - converted from enum to const object for esbuild compatibility
export const TransformationErrorCode = {
  FIELD_MAPPING_ERROR: 'FIELD_MAPPING_ERROR',
  TYPE_CONVERSION_ERROR: 'TYPE_CONVERSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  SCHEMA_MISMATCH: 'SCHEMA_MISMATCH'
} as const;

export type TransformationErrorCode = typeof TransformationErrorCode[keyof typeof TransformationErrorCode];

// Transformation result interface
export interface TransformationResult<T> {
  success: boolean
  data?: T
  error?: TransformationError
  warnings?: string[]
}

// Field mapping configuration for different data types
export interface FieldMappingConfig {
  [tableName: string]: {
    mappings: FieldMapping[]
    computedFields?: ComputedField[]
    validationRules?: ValidationRule[]
  }
}

// Computed field definition
export interface ComputedField {
  name: string
  sourceFields: string[]
  computation: (data: any) => any
  type: string
}

// Validation rule definition
export interface ValidationRule {
  field: string
  rule: (value: any) => boolean
  message: string
}

// Transformation configuration
export interface TransformationConfig {
  enableLogging: boolean
  enableValidation: boolean
  enableComputedFields: boolean
  strictMode: boolean
  errorHandling: 'strict' | 'permissive'
}
