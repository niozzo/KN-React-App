/**
 * Async Test Utilities
 * Provides common patterns for testing async operations in components
 */

import { vi } from 'vitest'

/**
 * Mock async operations to resolve immediately
 * Useful for testing component behavior without waiting for real async operations
 */
export const mockAsyncOperations = () => {
  // Mock all timers to prevent hanging
  vi.useFakeTimers()
}

/**
 * Clean up async mocks and restore real timers
 */
export const cleanupAsyncMocks = () => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.clearAllMocks()
}

/**
 * Wait for async operations to complete
 * Advances timers and waits for promises to resolve
 */
export const waitForAsyncOperations = async () => {
  vi.runAllTimers()
}

/**
 * Mock data clearing service with success response
 */
export const mockDataClearingSuccess = () => {
  return {
    success: true,
    errors: [],
    clearedData: {
      localStorage: true,
      attendeeInfo: true,
      pwaCache: true,
      indexedDB: true,
      serviceWorker: true
    },
    performanceMetrics: {
      startTime: 0,
      endTime: 100,
      duration: 100
    }
  }
}

/**
 * Mock data clearing service with failure response
 */
export const mockDataClearingFailure = () => {
  return Promise.reject(new Error('Data clearing failed'))
}

/**
 * Mock auth service with authenticated state
 */
export const mockAuthenticatedUser = () => {
  return {
    isAuthenticated: true,
    attendee: {
      id: 'test-attendee',
      first_name: 'Test',
      last_name: 'User',
      access_code: 'TEST123'
    }
  }
}

/**
 * Mock auth service with unauthenticated state
 */
export const mockUnauthenticatedUser = () => {
  return {
    isAuthenticated: false,
    attendee: null
  }
}
