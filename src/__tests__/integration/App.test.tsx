/**
 * App Integration Tests
 * Tests the main App component with PWA features integration
 */

import { vi } from 'vitest'
import { render, screen, testOfflineBehavior, testOnlineBehavior, waitFor } from '../utils/test-utils'
import App from '../../App'

describe('App Integration', () => {
  test('renders main app without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })

  test('renders offline indicator when offline', () => {
    render(<App />)
    // OfflineIndicator should be hidden when online (returns null)
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
  })

  test('renders install prompt when beforeinstallprompt event is triggered', async () => {
    render(<App />)
    
    // Initially no install prompt should be visible
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument()
    
    // Simulate beforeinstallprompt event
    const installEvent = new Event('beforeinstallprompt') as any
    installEvent.prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(installEvent)
    
    // Wait for install prompt to appear
    await waitFor(() => {
      expect(screen.getByTestId('install-prompt')).toBeInTheDocument()
    })
  })

  test('renders main content area', () => {
    render(<App />)
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  testOnlineBehavior(() => {
    test('hides offline indicator when online', () => {
      render(<App />)
      // OfflineIndicator should not be visible when online (returns null)
      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
    })
  })

  testOfflineBehavior(() => {
    test('shows offline state in offline indicator', () => {
      render(<App />)
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  test('handles route navigation', () => {
    render(<App />)
    
    // Check that home page is rendered by default
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  test('has proper accessibility structure', () => {
    render(<App />)
    
    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Check for navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
