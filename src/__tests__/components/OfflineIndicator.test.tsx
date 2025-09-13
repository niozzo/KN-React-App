/**
 * OfflineIndicator Component Tests
 * Tests the offline indicator component's behavior and PWA integration
 */

import { render, screen, testOfflineBehavior, testOnlineBehavior } from '../utils/test-utils'
import OfflineIndicator from '../../components/OfflineIndicator'

describe('OfflineIndicator', () => {
  test('renders without crashing', () => {
    render(<OfflineIndicator />)
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
  })

  testOnlineBehavior(() => {
    test('shows online state when connected', () => {
      render(<OfflineIndicator />)
      expect(screen.getByText(/online/i)).toBeInTheDocument()
    })
  })

  testOfflineBehavior(() => {
    test('shows offline state when disconnected', () => {
      render(<OfflineIndicator />)
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  test('updates when network state changes', () => {
    const { rerender } = render(<OfflineIndicator />)
    
    // Initially online
    expect(screen.getByText(/online/i)).toBeInTheDocument()
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true
    })
    window.dispatchEvent(new Event('offline'))
    
    rerender(<OfflineIndicator />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<OfflineIndicator />)
    const indicator = screen.getByTestId('offline-indicator')
    expect(indicator).toHaveAttribute('aria-live', 'polite')
    expect(indicator).toHaveAttribute('role', 'status')
  })
})
