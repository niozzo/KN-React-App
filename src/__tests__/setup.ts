import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanupAfterTest } from './utils/test-utils'

// Mock Supabase to avoid module resolution issues
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }))
}));

// Mock serverDataSyncService to prevent module resolution issues
vi.mock('../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn(),
    getCachedData: vi.fn(),
    clearCache: vi.fn(),
    lookupAttendeeByAccessCode: vi.fn()
  },
  ServerDataSyncService: vi.fn()
}));

// Mock pwaDataSyncService to prevent module resolution issues
vi.mock('../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    syncAllData: vi.fn().mockResolvedValue({
      success: true,
      syncedTables: ['agenda_items', 'attendees', 'sponsors'],
      errors: [],
      conflicts: []
    }),
    getCachedTableData: vi.fn().mockResolvedValue([]),
    cacheTableData: vi.fn(),
    getSyncStatus: vi.fn().mockReturnValue({
      isOnline: true,
      lastSync: new Date().toISOString(),
      pendingChanges: 0,
      syncInProgress: false
    }),
    getCachedData: vi.fn(),
    clearCache: vi.fn(),
    invalidateCache: vi.fn()
  },
  PWADataSyncService: vi.fn()
}));

// Global test setup
beforeAll(() => {
  // Setup global test environment
  // Add any global setup that needs to happen once
})

afterEach(async () => {
  // Use standardized cleanup utility with improved isolation
  await cleanupAfterTest()
  
  // Clear all timers to prevent hanging
  vi.clearAllTimers()
  vi.useRealTimers()
})

afterAll(async () => {
  // Cleanup after all tests
  vi.restoreAllMocks()
  
  // Clear all timers to prevent hanging
  vi.clearAllTimers()
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Force process exit after cleanup to prevent hanging
  setTimeout(() => {
    process.exit(0)
  }, 500) // Reduced timeout for faster exit
})

// Mock PWA APIs
if (!navigator.serviceWorker) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({
        installing: null,
        waiting: null,
        active: {
          postMessage: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }
      }),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          postMessage: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }
      })
    },
    writable: true,
    configurable: true
  })
}

// Mock beforeinstallprompt event
if (!window.beforeinstallprompt) {
  Object.defineProperty(window, 'beforeinstallprompt', {
    value: {
      prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    },
    writable: true,
    configurable: true
  })
}

// Mock matchMedia for PWA display mode detection
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })),
    writable: true,
    configurable: true
  })
}

// Mock online/offline events
if (navigator.onLine === undefined) {
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true
  })
}

// Mock Workbox
if (!window.workbox) {
  Object.defineProperty(window, 'workbox', {
    value: {
      messageSkipWaiting: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    writable: true,
    configurable: true
  })
}
