/**
 * PRAGMATIC Test Suite: Logout Cache Repopulation Fix
 * 
 * Tests the critical fix for race condition where async operations
 * could repopulate cache after logout. Simplified from 15 tests to 3
 * core tests based on QA recommendations.
 * 
 * Root Cause: Async operations (periodic sync, background revalidation) 
 * continued running after cache was cleared.
 * 
 * Fix: Stop all async operations BEFORE clearing cache.
 * 
 * See docs/qa/test-simplification-analysis.md for rationale.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataClearingService } from '../../services/dataClearingService'
import { pwaDataSyncService } from '../../services/pwaDataSyncService'

describe('Logout Cache Repopulation - Pragmatic Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    pwaDataSyncService.setLogoutInProgress(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    pwaDataSyncService.setLogoutInProgress(false)
  })

  it('prevents cache repopulation from async operations (THE CRITICAL TEST)', async () => {
    // Given: Initial cache and a delayed write operation (simulates race condition)
    localStorage.setItem('kn_cache_attendees', JSON.stringify({ 
      data: [{ id: 1, name: 'Test User' }],
      timestamp: Date.now()
    }))
    localStorage.setItem('conference_auth', JSON.stringify({ isAuthenticated: true }))
    
    const delayedWrite = async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
      await pwaDataSyncService.cacheTableData('attendees', [{ id: 2, name: 'New User' }])
    }
    
    // When: Logout happens while async operation is pending
    const delayedOperation = delayedWrite()
    const result = await dataClearingService.clearAllData()
    await delayedOperation
    
    // Then: Cache stays empty (race condition prevented)
    expect(result.success).toBe(true)
    expect(localStorage.getItem('kn_cache_attendees')).toBeFalsy()
    expect(localStorage.getItem('conference_auth')).toBeFalsy()
  })

  it('clears all cache types including auth tokens', async () => {
    // Given: All types of cached data
    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: [] }))
    localStorage.setItem('kn_cache_sessions', JSON.stringify({ data: [] }))
    localStorage.setItem('kn_cache_agenda_items', JSON.stringify({ data: [] }))
    localStorage.setItem('kn_cached_sessions', JSON.stringify({ data: [] }))
    localStorage.setItem('kn_sync_status', JSON.stringify({ lastSync: Date.now() }))
    localStorage.setItem('conference_auth', JSON.stringify({ isAuthenticated: true }))
    localStorage.setItem('sb-test-auth-token', 'token')
    
    // When: Logout occurs
    const result = await dataClearingService.clearAllData()
    
    // Then: Everything is cleared
    expect(result.success).toBe(true)
    expect(localStorage.getItem('kn_cache_attendees')).toBeFalsy()
    expect(localStorage.getItem('kn_cache_sessions')).toBeFalsy()
    expect(localStorage.getItem('kn_cache_agenda_items')).toBeFalsy()
    expect(localStorage.getItem('kn_cached_sessions')).toBeFalsy()
    expect(localStorage.getItem('kn_sync_status')).toBeFalsy()
    expect(localStorage.getItem('conference_auth')).toBeFalsy()
    expect(localStorage.getItem('sb-test-auth-token')).toBeFalsy()
  })

  it('continues clearing even if async stop operations fail', async () => {
    // Given: Cache data and a failing stop operation
    localStorage.setItem('kn_cache_attendees', JSON.stringify({ data: [{ id: 1 }] }))
    localStorage.setItem('conference_auth', JSON.stringify({ isAuthenticated: true }))
    vi.spyOn(pwaDataSyncService, 'stopPeriodicSync').mockImplementation(() => {
      throw new Error('Stop failed')
    })
    
    // When: Logout occurs despite error
    const result = await dataClearingService.clearAllData()
    
    // Then: Cache is still cleared (graceful degradation)
    expect(result.errors.length).toBeGreaterThan(0) // Error recorded
    expect(localStorage.getItem('kn_cache_attendees')).toBeFalsy() // But clearing succeeded
    expect(localStorage.getItem('conference_auth')).toBeFalsy()
  })
})
