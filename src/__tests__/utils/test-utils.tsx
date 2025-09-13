/**
 * Custom Test Utilities
 * Provides enhanced testing utilities for React components with PWA support
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { setupPWAMocks, cleanupPWAMocks } from './pwa-mocks'

// Custom render function with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// PWA-specific test helpers
export const testPWAFeature = (featureName: string, testFn: () => void) => {
  describe(`PWA Feature: ${featureName}`, () => {
    beforeEach(() => {
      setupPWAMocks()
    })
    
    afterEach(() => {
      cleanupPWAMocks()
    })
    
    testFn()
  })
}

// Network state testing helpers
export const testOfflineBehavior = (testFn: () => void) => {
  describe('Offline Behavior', () => {
    beforeEach(() => {
      setupPWAMocks()
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      })
    })
    
    afterEach(() => {
      cleanupPWAMocks()
    })
    
    testFn()
  })
}

export const testOnlineBehavior = (testFn: () => void) => {
  describe('Online Behavior', () => {
    beforeEach(() => {
      setupPWAMocks()
      // Simulate online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true
      })
    })
    
    afterEach(() => {
      cleanupPWAMocks()
    })
    
    testFn()
  })
}

// Accessibility testing helpers
export const testAccessibility = (componentName: string, testFn: () => void) => {
  describe(`Accessibility: ${componentName}`, () => {
    testFn()
  })
}

// Performance testing helpers
export const testPerformance = (testName: string, testFn: () => void) => {
  describe(`Performance: ${testName}`, () => {
    testFn()
  })
}
