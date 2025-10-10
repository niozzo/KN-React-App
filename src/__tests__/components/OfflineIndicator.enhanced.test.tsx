/**
 * Enhanced OfflineIndicator Component Tests
 * Tests the enhanced offline detection with platform-specific handling
 */

import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import OfflineIndicator from '../../components/OfflineIndicator'

describe('OfflineIndicator - Enhanced Detection', () => {
  // Mock console.log to capture platform detection logs
  let consoleLogSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore?.()
  })

  test('renders without crashing', () => {
    render(<OfflineIndicator />)
    // Component should not be visible when online (returns null)
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
  })

  test('hides indicator when online', () => {
    render(<OfflineIndicator />)
    // Component should be hidden when online (returns null)
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
  })

  test('shows offline state when disconnected', () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })
    
    render(<OfflineIndicator />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  describe('Platform-Specific Detection', () => {
    test('handles iOS Simulator detection', () => {
      // Mock iOS Simulator user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 Simulator',
        writable: true,
        configurable: true
      })

      // Mock online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })

      render(<OfflineIndicator />)
      
      // Should not show offline indicator when online in iOS Simulator
      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
    })

    test('handles Chrome browser detection', () => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        writable: true,
        configurable: true
      })

      // Mock online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })

      render(<OfflineIndicator />)
      
      // Should not show offline indicator when online in Chrome
      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
    })

    test('handles connection quality changes', async () => {
      // Mock connection API
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
        configurable: true
      })

      render(<OfflineIndicator />)

      // Simulate connection change to slow-2g
      mockConnection.effectiveType = 'slow-2g'
      
      await act(async () => {
        // Trigger connection change event
        const changeEvent = new Event('change')
        mockConnection.addEventListener.mock.calls
          .find(call => call[0] === 'change')?.[1]?.(changeEvent)
      })

      // Should show offline indicator for poor connection
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  test('updates when network state changes', async () => {
    const { rerender } = render(<OfflineIndicator />)
    
    // Initially online - component should be hidden when online
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })
    
    await act(async () => {
      window.dispatchEvent(new Event('offline'))
    })
    
    rerender(<OfflineIndicator />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<OfflineIndicator />)
    const indicator = screen.getByTestId('offline-indicator')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
    expect(indicator).toHaveAttribute('role', 'status')
  })

  test('logs network events for debugging', async () => {
    render(<OfflineIndicator />)
    
    // Simulate online event
    await act(async () => {
      window.dispatchEvent(new Event('online'))
    })
    
    expect(consoleLogSpy).toHaveBeenCalledWith('🌐 Online event detected')
    
    // Simulate offline event
    await act(async () => {
      window.dispatchEvent(new Event('offline'))
    })
    
    expect(consoleLogSpy).toHaveBeenCalledWith('📱 Offline event detected')
  })
})
