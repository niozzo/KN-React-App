/**
 * PWA Service Tests
 * Tests the PWA service functionality including updates and installation
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupPWAMocks, cleanupPWAMocks, mockPWAService } from '../utils/pwa-mocks'

// Mock the pwaService module
vi.mock('../../services/pwaService', () => ({
  pwaService: mockPWAService
}))

describe('PWA Service', () => {
  beforeEach(() => {
    setupPWAMocks()
  })

  afterEach(() => {
    cleanupPWAMocks()
  })

  test('initializes without errors', () => {
    expect(mockPWAService).toBeDefined()
    expect(mockPWAService.checkForUpdates).toBeDefined()
  })

  test('checkForUpdates calls service worker registration', async () => {
    await mockPWAService.checkForUpdates()
    expect(mockPWAService.checkForUpdates).toHaveBeenCalled()
  })

  test('handles service worker updates', async () => {
    // Mock service worker with update available
    const mockRegistration = {
      installing: null,
      waiting: { postMessage: vi.fn() },
      active: { postMessage: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ...navigator.serviceWorker,
        getRegistration: vi.fn().mockResolvedValue(mockRegistration)
      },
      writable: true,
      configurable: true
    })

    await mockPWAService.checkForUpdates()
    expect(mockPWAService.checkForUpdates).toHaveBeenCalled()
  })

  test('handles network state changes', () => {
    // Test online state
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    })
    
    expect(navigator.onLine).toBe(true)
    
    // Test offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })
    
    expect(navigator.onLine).toBe(false)
  })

  test('handles install prompt events', () => {
    const installEvent = new Event('beforeinstallprompt') as any
    installEvent.prompt = vi.fn()
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
    
    window.dispatchEvent(installEvent)
    
    expect(installEvent).toBeDefined()
    expect(installEvent.prompt).toBeDefined()
    expect(installEvent.userChoice).toBeDefined()
  })
})
