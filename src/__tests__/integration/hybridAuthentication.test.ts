/**
 * Integration Tests for Hybrid Authentication
 * 
 * Tests the complete hybrid authentication flow including:
 * - Admin authentication for data sync
 * - Attendee lookup with admin credentials
 * - Data caching for offline use
 * - Error handling throughout the flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

// Mock the unified cache service
vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
    getHealthStatus: vi.fn()
  }
}))

import { serverDataSyncService } from '../../services/serverDataSyncService'
import { createClient } from '@supabase/supabase-js'
import { unifiedCacheService } from '../../services/unifiedCacheService'

// Mock localStorage for auth services
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const mockUnifiedCache = unifiedCacheService as any

describe('Hybrid Authentication Integration', () => {
  let mockClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the authenticated client cache
    ;(serverDataSyncService as any).authenticatedClient = null
    
    // Create fresh mock client
    mockClient = {
      auth: {
        signInWithPassword: vi.fn()
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }
    
    vi.mocked(createClient).mockReturnValue(mockClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Login Flow', () => {
    it('should complete full login flow: admin auth → data sync → attendee lookup → success', async () => {
      // Mock successful admin authentication
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'admin-user' } },
        error: null
      })

      // Mock successful data sync for all tables
      const mockTableData = {
        attendees: [{ id: 1, access_code: '629980', first_name: 'Adam', last_name: 'Garson' }],
        sponsors: [{ id: 1, name: 'Test Sponsor' }],
        agenda_items: [{ id: 1, title: 'Test Session' }],
        dining_options: [{ id: 1, name: 'Test Meal' }],
        hotels: [{ id: 1, name: 'Test Hotel' }],
        seating_configurations: [{ id: 1, name: 'Test Config' }],
        user_profiles: [{ id: 1, name: 'Test User' }],
        seat_assignments: []
      }

      // Mock data sync queries (without .eq)
      mockClient.from.mockImplementation((tableName: string) => ({
        select: vi.fn().mockResolvedValue({
          data: mockTableData[tableName as keyof typeof mockTableData] || [],
          error: null
        })
      }))

      // Test the complete flow
      const syncResult = await serverDataSyncService.syncAllData()
      console.log('Sync result:', syncResult)
      expect(syncResult).toBeDefined()
      expect(syncResult.success).toBe(true)
      expect(syncResult.syncedTables).toContain('attendees')
      expect(syncResult.totalRecords).toBeGreaterThan(0)

      // Mock attendee lookup query
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'attendees') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 1, access_code: '629980', first_name: 'Adam', last_name: 'Garson' }],
                error: null
              })
            }))
          }
        }
        return {
          select: vi.fn().mockResolvedValue({
            data: mockTableData[tableName as keyof typeof mockTableData] || [],
            error: null
          })
        }
      })

      // Test attendee lookup
      const attendeeResult = await serverDataSyncService.lookupAttendeeByAccessCode('629980')
      expect(attendeeResult.success).toBe(true)
      expect(attendeeResult.attendee).toBeDefined()
      expect(attendeeResult.attendee?.first_name).toBe('Adam')

      // Verify data was cached
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should handle admin authentication failure gracefully', async () => {
      // Mock admin authentication failure
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      const syncResult = await serverDataSyncService.syncAllData()
      expect(syncResult.success).toBe(false)
      expect(syncResult.errors).toContain('Admin authentication failed: Invalid credentials')
    })

    it('should handle attendee lookup failure gracefully', async () => {
      // Mock successful admin auth
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'admin-user' } },
        error: null
      })

      // Mock attendee lookup failure
      mockClient.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      }))

      const attendeeResult = await serverDataSyncService.lookupAttendeeByAccessCode('123456')
      expect(attendeeResult.success).toBe(false)
      expect(attendeeResult.error).toContain('Access code not found')
    })

    it('should cache all data for offline use after successful login', async () => {
      // Mock successful admin auth
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'admin-user' } },
        error: null
      })

      // Mock data sync
      const mockData = [{ id: 1, name: 'Test' }]
      mockClient.from.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({
          data: mockData,
          error: null
        })
      }))

      await serverDataSyncService.syncAllData()

      // Verify all tables were cached using unified cache service
      const expectedTables = [
        'attendees', 'sponsors', 'seat_assignments', 'agenda_items',
        'dining_options', 'hotels', 'seating_configurations', 'user_profiles'
      ]

      expectedTables.forEach(tableName => {
        expect(mockUnifiedCache.set).toHaveBeenCalledWith(
          `kn_cache_${tableName}`,
          expect.any(Array)
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network failures during data sync', async () => {
      // Mock admin auth success
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'admin-user' } },
        error: null
      })

      // Mock network failure
      mockClient.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const syncResult = await serverDataSyncService.syncAllData()
      expect(syncResult.success).toBe(true) // Should still succeed overall
      expect(syncResult.errors.length).toBeGreaterThan(0)
    })

    it('should handle partial data sync failures', async () => {
      // Mock admin auth success
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'admin-user' } },
        error: null
      })

      // Mock partial failure - some tables succeed, others fail
      let callCount = 0
      mockClient.from.mockImplementation((tableName: string) => ({
        select: vi.fn().mockImplementation(() => {
          callCount++
          if (tableName === 'attendees') {
            return Promise.resolve({
              data: [{ id: 1, name: 'Test' }],
              error: null
            })
          } else {
            return Promise.reject(new Error(`Failed to sync ${tableName}`))
          }
        })
      }))

      const syncResult = await serverDataSyncService.syncAllData()
      expect(syncResult.success).toBe(true) // Should still succeed overall
      expect(syncResult.syncedTables).toContain('attendees')
      expect(syncResult.errors.length).toBeGreaterThan(0)
    })
  })
})
