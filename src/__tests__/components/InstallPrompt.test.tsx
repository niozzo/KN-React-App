/**
 * InstallPrompt Component Tests
 * Tests the A2HS (Add to Home Screen) install prompt functionality
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { mockInstallPrompt } from '../utils/pwa-mocks'
import InstallPrompt from '../../components/InstallPrompt'

describe('InstallPrompt', () => {
  test('renders without crashing', () => {
    render(<InstallPrompt />)
    // Component should not be visible by default (no beforeinstallprompt event)
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument()
  })

  test('shows install button when prompt is available', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/install knowledgenow 2025/i)).toBeInTheDocument()
    })
  })

  test('handles install button click', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/install knowledgenow 2025/i)).toBeInTheDocument()
    })
    
    // Click install button
    const installButton = screen.getByText('Install')
    fireEvent.click(installButton)
    
    // Verify prompt was called
    expect(installEvent.prompt).toHaveBeenCalled()
  })

  test('hides prompt after successful installation', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/install knowledgenow 2025/i)).toBeInTheDocument()
    })
    
    // Simulate successful installation
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
    
    const installButton = screen.getByText('Install')
    fireEvent.click(installButton)
    
    // Wait for async installation flow to complete
    await waitFor(() => {
      expect(screen.queryByText(/install knowledgenow 2025/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('has proper accessibility attributes', async () => {
    render(<InstallPrompt />)
    
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      const installButton = screen.getByText('Install')
      expect(installButton).toHaveAttribute('aria-label', 'Install KnowledgeNow 2025 app')
    })
  })
})
