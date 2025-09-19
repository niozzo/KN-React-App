/**
 * Debug test for data clearing service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('DataClearingService - Debug Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be able to import the service', async () => {
    // Try to import the service
    const { dataClearingService } = await import('../../services/dataClearingService')
    
    expect(dataClearingService).toBeDefined()
    expect(typeof dataClearingService.clearAllData).toBe('function')
  })
})
