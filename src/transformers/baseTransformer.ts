/**
 * Base Data Transformer
 * Story 1.7: Data Transformation Layer for Schema Evolution
 */

import { 
  DataTransformer, 
  FieldMapping, 
  SchemaDefinition, 
  TransformationError, 
  TransformationResult,
  TransformationErrorCode,
  ComputedField,
  ValidationRule
} from '../types/transformation.ts'

export interface SchemaVersion {
  version: string
  detectedAt: string
  fields: string[]
  confidence: number
}

export abstract class BaseTransformer<T> implements DataTransformer<T> {
  protected fieldMappings: FieldMapping[]
  protected computedFields: ComputedField[]
  protected validationRules: ValidationRule[]
  protected tableName: string
  protected uiModel: string
  protected version: string

  constructor(
    fieldMappings: FieldMapping[],
    tableName: string,
    uiModel: string,
    version: string = '1.0.0',
    computedFields: ComputedField[] = [],
    validationRules: ValidationRule[] = []
  ) {
    this.fieldMappings = fieldMappings
    this.computedFields = computedFields
    this.validationRules = validationRules
    this.tableName = tableName
    this.uiModel = uiModel
    this.version = version
  }

  /**
   * Detect schema version based on field presence and data types
   */
  protected detectSchemaVersion(dbData: any): SchemaVersion {
    const fields = Object.keys(dbData || {})
    const version = this.inferVersion(dbData)
    const confidence = this.calculateConfidence(dbData, version)
    
    return {
      version,
      detectedAt: new Date().toISOString(),
      fields,
      confidence
    }
  }

  /**
   * Infer schema version based on field presence and data types
   * Override this method in subclasses for specific version detection
   */
  protected inferVersion(data: any): string {
    // Default implementation - can be overridden by subclasses
    return '1.0.0'
  }

  /**
   * Calculate confidence score for version detection
   * Only checks required fields - optional fields being absent is normal
   */
  protected calculateConfidence(data: any, version: string): number {
    // Only check required fields - missing optional fields shouldn't reduce confidence
    const requiredFields = this.fieldMappings
      .filter(m => m.required)
      .map(m => m.source)
    
    // If no required fields defined, fall back to all fields
    if (requiredFields.length === 0) {
      const expectedFields = this.fieldMappings.map(m => m.source)
      const presentFields = Object.keys(data || {})
      const matchingFields = expectedFields.filter(field => presentFields.includes(field))
      return matchingFields.length / expectedFields.length
    }
    
    const presentFields = Object.keys(data || {})
    const matchingRequiredFields = requiredFields.filter(field => presentFields.includes(field))
    
    return matchingRequiredFields.length / requiredFields.length
  }

  /**
   * Handle schema evolution - override in subclasses
   */
  protected handleSchemaEvolution(dbData: any, schemaVersion: SchemaVersion): any {
    // Default implementation - no evolution needed
    return dbData
  }

  /**
   * Transform data from database format to UI format
   */
  transformFromDatabase(dbData: any): T {
    try {
      if (!dbData) {
        throw this.createError(TransformationErrorCode.VALIDATION_ERROR, 'Database data is null or undefined')
      }

      // Detect schema version and handle evolution
      const schemaVersion = this.detectSchemaVersion(dbData)
      const evolvedData = this.handleSchemaEvolution(dbData, schemaVersion)
      
      // Schema version detection - no logging needed for normal operation

      const result: any = {}
      const missingFields: string[] = []
      
      // Apply field mappings
      for (const mapping of this.fieldMappings) {
        const value = this.getFieldValue(evolvedData, mapping.source)
        if (mapping.required && (value === undefined || value === null)) {
          missingFields.push(mapping.source)
        }
        result[mapping.target] = this.convertType(value, mapping.type, mapping.defaultValue)
        
      }

      // Handle missing required fields silently - these are handled by the transformation logic

      // Apply computed fields
      for (const computedField of this.computedFields) {
        try {
          result[computedField.name] = computedField.computation(result)
        } catch (computedError) {
          // Silently handle computed field errors - set to null as fallback
          result[computedField.name] = null
        }
      }

      // Validate the result
      if (!this.validateTransformation(result)) {
        throw this.createError(TransformationErrorCode.VALIDATION_ERROR, 'Transformation validation failed')
      }

      return result as T
    } catch (error) {
      console.error(`❌ Transformation error in ${this.tableName}:`, error)
      console.error(`❌ Original data:`, dbData)
      throw this.createError(
        TransformationErrorCode.FIELD_MAPPING_ERROR,
        `Failed to transform data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        { originalData: dbData, error }
      )
    }
  }

  /**
   * Transform data from UI format to database format
   */
  transformToDatabase(uiData: T): any {
    try {
      if (!uiData) {
        throw this.createError(TransformationErrorCode.VALIDATION_ERROR, 'UI data is null or undefined')
      }

      const result: any = {}
      
      // Apply reverse field mappings
      for (const mapping of this.fieldMappings) {
        const value = (uiData as any)[mapping.target]
        result[mapping.source] = this.convertType(value, mapping.type, mapping.defaultValue)
      }

      return result
    } catch (error) {
      throw this.createError(
        TransformationErrorCode.FIELD_MAPPING_ERROR,
        `Failed to transform UI data to database format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        { originalData: uiData, error }
      )
    }
  }

  /**
   * Get UI schema definition
   */
  getUISchema(): SchemaDefinition {
    return {
      fields: this.fieldMappings,
      tableName: this.tableName,
      uiModel: this.uiModel,
      version: this.version
    }
  }

  /**
   * Get database schema definition
   */
  getDatabaseSchema(): SchemaDefinition {
    return {
      fields: this.fieldMappings.map(mapping => ({
        ...mapping,
        source: mapping.target,
        target: mapping.source
      })),
      tableName: this.tableName,
      uiModel: this.uiModel,
      version: this.version
    }
  }

  /**
   * Validate transformation data
   */
  validateTransformation(data: any): boolean {
    try {
      // Check required fields
      for (const mapping of this.fieldMappings) {
        if (mapping.required && (data[mapping.target] === undefined || data[mapping.target] === null)) {
          return false
        }
      }

      // Run validation rules
      for (const rule of this.validationRules) {
        if (!rule.rule(data[rule.field])) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  /**
   * Get field value from database data
   */
  protected getFieldValue(data: any, fieldName: string): any {
    if (data && typeof data === 'object') {
      return data[fieldName]
    }
    return undefined
  }

  /**
   * Convert data type
   */
  protected convertType(value: any, targetType: string, defaultValue?: any): any {
    if (value === undefined || value === null) {
      return defaultValue
    }

    try {
      switch (targetType) {
        case 'string':
          return String(value)
        case 'number':
          const num = Number(value)
          return isNaN(num) ? defaultValue : num
        case 'boolean':
          if (typeof value === 'boolean') return value
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1'
          }
          return Boolean(value)
        case 'date':
          const date = new Date(value)
          return isNaN(date.getTime()) ? defaultValue : date
        case 'array':
          if (Array.isArray(value)) {
            return value
          }
          if (value && typeof value === 'object' && Object.keys(value).length === 0) {
            // Empty object should become empty array
            return []
          }
          return value ? [value] : []
        case 'object':
          return typeof value === 'object' ? value : (value ? { value } : {})
        default:
          return value
      }
    } catch (error) {
      console.warn(`Type conversion failed for value: ${value}, type: ${targetType}`, error)
      return defaultValue
    }
  }

  /**
   * Create transformation error
   */
  protected createError(
    code: TransformationErrorCode,
    message: string,
    field?: string,
    details?: any
  ): TransformationError {
    return {
      code,
      message,
      field,
      details,
      timestamp: new Date(),
      transformer: this.constructor.name
    }
  }

  /**
   * Transform array of data
   */
  transformArrayFromDatabase(dbDataArray: any[]): T[] {
    return dbDataArray.map(item => this.transformFromDatabase(item))
  }

  /**
   * Transform array to database format
   */
  transformArrayToDatabase(uiDataArray: T[]): any[] {
    return uiDataArray.map(item => this.transformToDatabase(item))
  }
}
