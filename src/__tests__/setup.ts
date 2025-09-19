import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanupAfterTest } from './utils/test-utils'

// Global test setup
beforeAll(() => {
  // Setup global test environment
  // Add any global setup that needs to happen once
})

afterEach(() => {
  // Use standardized cleanup utility
  cleanupAfterTest()
})

afterAll(() => {
  // Cleanup after all tests
  vi.restoreAllMocks()
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
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
