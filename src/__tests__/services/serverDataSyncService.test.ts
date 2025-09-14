/**
 * Tests for Server Data Sync Service
 * 
 * Tests hybrid authentication pattern and data synchronization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServerDataSyncService } from '../../services/serverDataSyncService'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
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
  }))
}))

// Mock localStorage
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

describe('ServerDataSyncService', () => {
  let service: ServerDataSyncService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ServerDataSyncService()
  })

  describe('lookupAttendeeByAccessCode', () => {
    it('should validate access code format', async () => {
      const result = await service.lookupAttendeeByAccessCode('ABC12')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid access code format. Must be 6 alphanumeric characters.')
      expect(result.attendee).toBeUndefined()
    })

    it('should reject empty access code', async () => {
      const result = await service.lookupAttendeeByAccessCode('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid access code format. Must be 6 alphanumeric characters.')
    })

    it('should handle authentication errors gracefully', async () => {
      // Mock Supabase to throw an authentication error
      const mockCreateClient = await import('@supabase/supabase-js')
      mockCreateClient.createClient.mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockRejectedValue(new Error('Invalid credentials'))
        },
        from: vi.fn()
      })

      const result = await service.lookupAttendeeByAccessCode('ABC123')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Attendee lookup failed. Please try again.')
    })

    it('should handle database errors gracefully', async () => {
      // Mock successful authentication but database error
      const mockCreateClient = await import('@supabase/supabase-js')
      mockCreateClient.createClient.mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null })
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          }))
        }))
      })

      const result = await service.lookupAttendeeByAccessCode('ABC123')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid access code. Please check and try again.')
    })
  })

  describe('cacheTableData', () => {
    it('should cache data to localStorage', async () => {
      const testData = [{ id: 1, name: 'Test' }]
      
      // Use reflection to access private method
      const cacheMethod = (service as any).cacheTableData.bind(service)
      await cacheMethod('test_table', testData)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kn_cache_test_table',
        expect.stringContaining('"data":[{"id":1,"name":"Test"}],"timestamp":')
      )
    })
  })

  describe('getCachedTableData', () => {
    it('should return cached data from localStorage', async () => {
      const testData = [{ id: 1, name: 'Test' }]
      const cacheData = {
        data: testData,
        timestamp: Date.now(),
        version: 1,
        source: 'server-sync'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData))
      
      const result = await service.getCachedTableData('test_table')
      
      expect(result).toEqual(testData)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('kn_cache_test_table')
    })

    it('should return empty array when no cached data', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = await service.getCachedTableData('test_table')
      
      expect(result).toEqual([])
    })

    it('should handle JSON parse errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const result = await service.getCachedTableData('test_table')
      
      expect(result).toEqual([])
    })
  })

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      // Mock Object.keys to return cache keys
      const originalKeys = Object.keys
      Object.keys = vi.fn().mockReturnValue(['kn_cache_table1', 'kn_cache_table2', 'other_key'])
      
      await service.clearCache()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_table1')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kn_cache_table2')
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key')
      
      // Restore original Object.keys
      Object.keys = originalKeys
    })
  })
})
