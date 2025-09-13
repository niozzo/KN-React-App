/**
 * App Integration Tests
 * Tests the main App component with PWA features integration
 */

import { render, screen, testOfflineBehavior, testOnlineBehavior } from '../utils/test-utils'
import App from '../../App'

describe('App Integration', () => {
  test('renders main app without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('app')).toBeInTheDocument()
  })

  test('renders offline indicator', () => {
    render(<App />)
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
  })

  test('renders install prompt', () => {
    render(<App />)
    expect(screen.getByTestId('install-prompt')).toBeInTheDocument()
  })

  test('renders main content area', () => {
    render(<App />)
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  testOnlineBehavior(() => {
    test('shows online state in offline indicator', () => {
      render(<App />)
      expect(screen.getByText(/online/i)).toBeInTheDocument()
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
