/**
 * Test Setup Configuration
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Centralized test setup for React components and integration tests
 */

import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock React Router with proper hoisting
export const mockNavigate = vi.fn()
const mockLocation = {
  pathname: '/settings',
  search: '',
  hash: '',
  state: null,
  key: 'test-key'
}

// Use vi.hoisted to ensure mocks are available before module imports
const mockRouter = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLocation: {
    pathname: '/settings',
    search: '',
    hash: '',
    state: null,
    key: 'test-key'
  }
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockRouter.mockNavigate,
    useLocation: () => mockRouter.mockLocation,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
    Link: ({ children, to, ...props }: any) => {
      const { createElement } = require('react')
      return createElement('a', { href: to, ...props }, children)
    },
    NavLink: ({ children, to, ...props }: any) => {
      const { createElement } = require('react')
      return createElement('a', { href: to, ...props }, children)
    }
  }
})

// Export the hoisted mock for test access
export { mockRouter }

// Don't mock the data clearing service - let it use the real implementation
// with our mocked browser APIs

// Mock the attendee info service
vi.mock('../../services/attendeeInfoService', () => ({
  attendeeInfoService: {
    extractAttendeeInfo: vi.fn().mockReturnValue({
      id: 'test-id',
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      title: 'Test Title',
      access_code: 'TEST123'
    }),
    storeAttendeeInfo: vi.fn().mockReturnValue(true),
    getCachedAttendeeInfo: vi.fn().mockReturnValue(null),
    getAttendeeName: vi.fn().mockReturnValue(null),
    getFullAttendeeInfo: vi.fn().mockReturnValue(null),
    clearAttendeeInfo: vi.fn().mockReturnValue(true),
    hasValidAttendeeInfo: vi.fn().mockReturnValue(false),
    updateAttendeeInfo: vi.fn().mockReturnValue(true)
  }
}))

// Mock the PWA data sync service
vi.mock('../../services/simplifiedDataService', () => ({
  simplifiedDataService: {
    getData: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      fromCache: true
    }),
    clearCache: vi.fn().mockResolvedValue(undefined)
  }
}))

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authenticateWithAccessCode: vi.fn().mockResolvedValue({
    success: false,
    error: 'Invalid access code format. Must be 6 alphanumeric characters.',
    attendee: undefined
  }),
  getCurrentAttendee: vi.fn().mockReturnValue(null),
  isUserAuthenticated: vi.fn().mockReturnValue(false),
  signOut: vi.fn().mockReturnValue({
    success: true,
    error: undefined
  }),
  getAuthStatus: vi.fn(() => ({
    isAuthenticated: true,
    attendee: {
      id: 'test-attendee',
      first_name: 'Test',
      last_name: 'User',
      access_code: 'TEST123'
    }
  })),
  validateAccessCodeFormat: vi.fn().mockReturnValue(true)
}))

// Mock the server data sync service
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn().mockResolvedValue({
      success: true,
      syncedTables: ['attendees'],
      errors: []
    }),
    lookupAttendeeByAccessCode: vi.fn().mockResolvedValue({
      success: false,
      error: 'Invalid access code format. Must be 6 alphanumeric characters.',
      attendee: undefined
    }),
    cacheTableData: vi.fn().mockResolvedValue(true),
    getCachedTableData: vi.fn().mockResolvedValue([]),
    clearCache: vi.fn().mockResolvedValue(true)
  }
}))

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  }
}))

// Export mock functions for test access
export { mockLocation }
