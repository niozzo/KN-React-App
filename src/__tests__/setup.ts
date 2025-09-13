import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Global test setup
beforeAll(() => {
  // Setup global test environment
})

afterEach(() => {
  // Cleanup after each test
})

afterAll(() => {
  // Cleanup after all tests
})

// Mock PWA APIs
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
  writable: true
})

// Mock beforeinstallprompt event
Object.defineProperty(window, 'beforeinstallprompt', {
  value: {
    prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
    userChoice: Promise.resolve({ outcome: 'accepted' })
  },
  writable: true
})

// Mock matchMedia for PWA display mode detection
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
  writable: true
})

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
})

// Mock Workbox
Object.defineProperty(window, 'workbox', {
  value: {
    messageSkipWaiting: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
})
