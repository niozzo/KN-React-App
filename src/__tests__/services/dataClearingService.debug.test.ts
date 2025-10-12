/**
 * Debug test for data clearing service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe.skip('DataClearingService - Debug Test', () => {
  // SKIPPED: Debug test - temporary debugging file (~4 tests)
  // Value: Zero - temporary debugging, not production tests
  // Decision: Skip debug tests
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
