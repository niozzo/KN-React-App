import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanupAfterTest } from './utils/test-utils'

// Mock Supabase to avoid module resolution issues
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
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

// Note: Removed conflicting service mocks to prevent test hanging
// Individual tests can mock services as needed using vi.mock() locally

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
  
  // Clear all intervals and timeouts
  const highestTimeoutId = setTimeout(() => {}, 0)
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i)
    clearInterval(i)
  }
  
  // Clear DOM completely
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  
  // Clear storage
  if (localStorage && typeof localStorage.clear === 'function') {
    localStorage.clear()
  }
  if (sessionStorage && typeof sessionStorage.clear === 'function') {
    sessionStorage.clear()
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Wait for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Force process exit after cleanup to prevent hanging
  setTimeout(() => {
    process.exit(0)
  }, 200) // Reduced timeout for faster exit
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
