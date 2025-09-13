/**
 * PWA Testing Utilities and Mocks
 * Provides mocks for Service Worker, A2HS, and offline functionality testing
 */

// Service Worker Mock
export const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: { 
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  getRegistration: vi.fn().mockResolvedValue(null),
  getRegistrations: vi.fn().mockResolvedValue([])
}

// Navigator.onLine Mock
export const mockNavigatorOnLine = (isOnline: boolean) => {
  try {
    Object.defineProperty(navigator, 'onLine', {
      value: isOnline,
      writable: true,
      configurable: true
    })
  } catch (error) {
    // Property already defined, just update the value
    (navigator as any).onLine = isOnline
  }
}

// Network State Change Events
export const mockNetworkStateChange = (isOnline: boolean) => {
  mockNavigatorOnLine(isOnline)
  window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'))
}

// A2HS (Add to Home Screen) Mock
export const mockInstallPrompt = () => {
  const event = new Event('beforeinstallprompt') as any
  event.prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  return event
}

// PWA Service Mock
export const mockPWAService = {
  checkForUpdates: vi.fn(),
  installPrompt: null,
  isInstalled: false,
  isOnline: true
}

// Cache API Mock
export const mockCache = {
  open: vi.fn().mockResolvedValue({
    add: vi.fn(),
    addAll: vi.fn(),
    delete: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    match: vi.fn(),
    matchAll: vi.fn().mockResolvedValue([]),
    put: vi.fn()
  }),
  delete: vi.fn().mockResolvedValue(true),
  has: vi.fn().mockResolvedValue(false),
  keys: vi.fn().mockResolvedValue([]),
  match: vi.fn(),
  matchAll: vi.fn().mockResolvedValue([])
}

// Setup PWA Mocks
export const setupPWAMocks = () => {
  // Only set up if not already defined
  if (!navigator.serviceWorker) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true
    })
  }

  // Only set up if not already defined
  if (!window.caches) {
    Object.defineProperty(window, 'caches', {
      value: mockCache,
      writable: true,
      configurable: true
    })
  }

  // Mock PWA Service
  vi.mock('../services/pwaService', () => ({
    pwaService: mockPWAService
  }))

  // Set initial online state
  mockNavigatorOnLine(true)
}

// Cleanup PWA Mocks
export const cleanupPWAMocks = () => {
  vi.clearAllMocks()
  mockNavigatorOnLine(true)
}

// Test Data for PWA Features
export const mockPWAConfig = {
  manifest: {
    name: 'KnowledgeNow 2025',
    short_name: 'KN2025',
    description: 'KnowledgeNow 2025 conference companion app for seamless event management',
    theme_color: '#1976d2',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
        }
      }
    ]
  }
}
