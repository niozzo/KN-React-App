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
    expect(screen.getByTestId('install-prompt')).toBeInTheDocument()
  })

  test('shows install button when prompt is available', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/install app/i)).toBeInTheDocument()
    })
  })

  test('handles install button click', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/install app/i)).toBeInTheDocument()
    })
    
    // Click install button
    const installButton = screen.getByText(/install app/i)
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
      expect(screen.getByText(/install app/i)).toBeInTheDocument()
    })
    
    // Simulate successful installation
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
    
    const installButton = screen.getByText(/install app/i)
    fireEvent.click(installButton)
    
    await waitFor(() => {
      expect(screen.queryByText(/install app/i)).not.toBeInTheDocument()
    })
  })

  test('has proper accessibility attributes', async () => {
    render(<InstallPrompt />)
    
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      const installButton = screen.getByText(/install app/i)
      expect(installButton).toHaveAttribute('aria-label', 'Install Conference Companion app')
    })
  })
})
