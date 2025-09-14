/**
 * InstallPrompt Component Tests
 * Tests the A2HS (Add to Home Screen) install prompt functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import InstallPrompt from '../../components/InstallPrompt'

// Mock the beforeinstallprompt event
const mockInstallPrompt = () => {
  const event = new Event('beforeinstallprompt') as any
  event.prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  return event
}

// Mock environment variables
vi.mock('vite', () => ({
  importMeta: {
    env: {
      DEV: true
    }
  }
}))

describe('InstallPrompt', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock navigator.userAgent for non-iOS
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    // Mock window.matchMedia for non-standalone
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<InstallPrompt />)
    // Component should not be visible by default (no beforeinstallprompt event)
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument()
  })

  it('shows install button when prompt is available', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/apax knowledgenow 2025/i)).toBeInTheDocument()
    })
  })

  it('handles install button click', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/apax knowledgenow 2025/i)).toBeInTheDocument()
    })
    
    // Click install button
    const installButton = screen.getByText('Install')
    fireEvent.click(installButton)
    
    // Verify prompt was called
    expect(installEvent.prompt).toHaveBeenCalled()
  })

  it('hides prompt after successful installation', async () => {
    render(<InstallPrompt />)
    
    // Simulate beforeinstallprompt event
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      expect(screen.getByText(/apax knowledgenow 2025/i)).toBeInTheDocument()
    })
    
    // Simulate successful installation
    installEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
    
    const installButton = screen.getByText('Install')
    fireEvent.click(installButton)
    
    // Wait for async installation flow to complete
    await waitFor(() => {
      expect(screen.queryByText(/apax knowledgenow 2025/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('has proper accessibility attributes', async () => {
    render(<InstallPrompt />)
    
    const installEvent = mockInstallPrompt()
    window.dispatchEvent(installEvent)
    
    await waitFor(() => {
      const installButton = screen.getByText('Install')
      expect(installButton).toHaveAttribute('aria-label', 'Install Apax KnowledgeNow 2025 app')
    })
  })
})
