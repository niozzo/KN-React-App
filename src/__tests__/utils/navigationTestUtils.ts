/**
 * Navigation Test Utilities
 * Story 1.6: Sign-Out Data Clear & Navigation
 * 
 * Centralized utilities for testing navigation functionality
 */

import { vi } from 'vitest'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ReactElement } from 'react'

// Mock navigation function
export const mockNavigate = vi.fn()

// Mock location object
export const mockLocation = {
  pathname: '/settings',
  search: '',
  hash: '',
  state: null,
  key: 'test-key'
}

// Setup navigation mocks
export const setupNavigationMocks = () => {
  vi.clearAllMocks()
  
  // Mock react-router-dom with proper hoisting
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useLocation: () => mockLocation,
      BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
      MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
      Link: ({ children, to, ...props }: any) => {
        const { createElement } = require('react')
        return createElement('a', { href: to, ...props }, children)
      },
      NavLink: ({ children, to, ...props }: any) => {
        const { createElement } = require('react')
        return createElement('a', { href: to, ...props }, children)
      }
    }
  })
}

// Custom render function with router
export const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    ),
    ...options
  })
}

// Navigation assertion helpers
export const expectNavigationTo = (path: string) => {
  expect(mockNavigate).toHaveBeenCalledWith(path)
}

export const expectNoNavigation = () => {
  expect(mockNavigate).not.toHaveBeenCalled()
}

export const getNavigationCalls = () => {
  return mockNavigate.mock.calls
}

export const clearNavigationCalls = () => {
  mockNavigate.mockClear()
}

// Reset all navigation mocks
export const resetNavigationMocks = () => {
  vi.clearAllMocks()
  mockNavigate.mockClear()
}
