/**
 * OfflineIndicator Component Tests
 * Tests the offline indicator component's behavior and PWA integration
 */

import { render, screen, testOfflineBehavior, testOnlineBehavior, act } from '../utils/test-utils'
import OfflineIndicator from '../../components/OfflineIndicator'

describe('OfflineIndicator', () => {
  test('renders without crashing', () => {
    render(<OfflineIndicator />)
    // Component should not be visible when online (returns null)
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
  })

  testOnlineBehavior(() => {
    test('hides indicator when online', () => {
      render(<OfflineIndicator />)
      // Component should be hidden when online (returns null)
      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
    })
  })

  testOfflineBehavior(() => {
    test('shows offline state when disconnected', () => {
      render(<OfflineIndicator />)
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
})
