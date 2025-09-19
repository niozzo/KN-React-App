/**
 * Standardized Test Utilities
 * 
 * Provides consistent testing utilities and mock data across all test files
 * to ensure standardized testing patterns and reduce duplication.
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { vi } from 'vitest'

// ============================================================================
// CUSTOM RENDER UTILITIES
// ============================================================================

/**
 * Custom render function with common providers
 * Use this instead of the default render for consistent test setup
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    // Add common providers here if needed
    ...options
  })
}

// ============================================================================
// STANDARD MOCK DATA
// ============================================================================

/**
 * Standard mock session data for testing
 */
export const mockSessionData = {
  id: '1',
  title: 'Test Session',
  date: '2024-12-19',
  start_time: '09:00:00',
  end_time: '10:00:00',
  location: 'Main Hall',
  speaker: 'John Doe',
  type: 'keynote'
}

/**
 * Standard mock attendee data for testing
 */
export const mockAttendeeData = {
  id: 'attendee-1',
  name: 'Test User',
  access_code: 'ABC123',
  selected_agenda_items: [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ]
}

/**
 * Standard mock agenda items for testing
 */
export const mockAgendaItems = [
  {
    id: '1',
    title: 'Opening Keynote',
    date: '2024-12-19',
    start_time: '09:00:00',
    end_time: '10:00:00',
    location: 'Main Hall',
    speaker: 'John Doe',
    type: 'keynote'
  },
  {
    id: '2',
    title: 'Coffee Break',
    date: '2024-12-19',
    start_time: '10:00:00',
    end_time: '10:30:00',
    location: 'Lobby',
    type: 'coffee_break'
  },
  {
    id: '3',
    title: 'Panel Discussion',
    date: '2024-12-19',
    start_time: '10:30:00',
    end_time: '11:30:00',
    location: 'Room A',
    speaker: 'Jane Smith',
    type: 'panel'
  }
]

// ============================================================================
// STANDARD BROWSER API MOCKS
// ============================================================================

/**
 * Standard localStorage mock
 */
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

/**
 * Standard sessionStorage mock
 */
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

/**
 * Standard IndexedDB mock
 */
export const mockIndexedDB = {
  deleteDatabase: vi.fn()
}

/**
 * Standard Cache API mock
 */
export const mockCaches = {
  keys: vi.fn(),
  delete: vi.fn()
}

/**
 * Standard performance mock
 */
export const mockPerformance = {
  now: vi.fn(() => Date.now())
}

// ============================================================================
// MOCK SETUP UTILITIES
// ============================================================================

/**
 * Setup standard browser API mocks
 * Call this in beforeEach to set up consistent browser API mocks
 */
export const setupBrowserMocks = () => {
  vi.stubGlobal('localStorage', mockLocalStorage)
  vi.stubGlobal('sessionStorage', mockSessionStorage)
  vi.stubGlobal('indexedDB', mockIndexedDB)
  vi.stubGlobal('caches', mockCaches)
  vi.stubGlobal('performance', mockPerformance)
}

/**
 * Reset all mocks to default state
 * Call this in beforeEach to ensure clean test state
 */
export const resetAllMocks = () => {
  vi.clearAllMocks()
  
  // Reset localStorage mock
  mockLocalStorage.getItem.mockReturnValue(null)
  mockLocalStorage.setItem.mockImplementation(() => {})
  mockLocalStorage.removeItem.mockImplementation(() => {})
  mockLocalStorage.clear.mockImplementation(() => {})
  mockLocalStorage.length = 0
  mockLocalStorage.key.mockReturnValue(null)
  
  // Reset sessionStorage mock
  mockSessionStorage.getItem.mockReturnValue(null)
  mockSessionStorage.setItem.mockImplementation(() => {})
  mockSessionStorage.removeItem.mockImplementation(() => {})
  mockSessionStorage.clear.mockImplementation(() => {})
  mockSessionStorage.length = 0
  mockSessionStorage.key.mockReturnValue(null)
  
  // Reset IndexedDB mock
  mockIndexedDB.deleteDatabase.mockReturnValue({})
  
  // Reset Cache API mock
  mockCaches.keys.mockResolvedValue([])
  mockCaches.delete.mockResolvedValue(true)
  
  // Reset performance mock
  mockPerformance.now.mockReturnValue(Date.now())
}

/**
 * Setup standard service mocks using dependency injection
 * Call this in beforeEach to set up consistent service mocks
 */
export const setupServiceMocks = async () => {
  // Import the service factory
  const { ServiceFactory, createMockAgendaService, createMockDataService, createMockTimeService } = await import('./service-factory')
  
  // Create mock services with standard data
  const agendaService = createMockAgendaService()
  const dataService = createMockDataService()
  const timeService = createMockTimeService()
  
  // Setup standard mock implementations with test data
  agendaService.getActiveAgendaItems = vi.fn().mockResolvedValue({
    success: true,
    data: mockAgendaItems,
    error: null
  })
  
  dataService.getCurrentAttendeeData = vi.fn().mockResolvedValue(mockAttendeeData)
  dataService.getAttendeeSeatAssignments = vi.fn().mockResolvedValue([])
  
  timeService.getCurrentTime = vi.fn().mockReturnValue(new Date())
  timeService.isOverrideActive = vi.fn().mockReturnValue(false)
  timeService.getOverrideTime = vi.fn().mockReturnValue(null)
  
  // Inject services into factory
  ServiceFactory.injectServices({
    agendaService,
    dataService,
    timeService
  })
}

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Generate mock session data with custom properties
 */
export const createMockSession = (overrides: Partial<typeof mockSessionData> = {}) => ({
  ...mockSessionData,
  ...overrides
})

/**
 * Generate mock attendee data with custom properties
 */
export const createMockAttendee = (overrides: Partial<typeof mockAttendeeData> = {}) => ({
  ...mockAttendeeData,
  ...overrides
})

/**
 * Generate mock agenda items with custom properties
 */
export const createMockAgendaItems = (count: number = 3, overrides: Partial<typeof mockSessionData> = {}) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockSessionData,
    id: `${index + 1}`,
    title: `Test Session ${index + 1}`,
    ...overrides
  }))
}

// ============================================================================
// ASSERTION UTILITIES
// ============================================================================

/**
 * Assert that a function was called with specific arguments
 */
export const expectCalledWith = (mockFn: any, ...args: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...args)
}

/**
 * Assert that a function was called a specific number of times
 */
export const expectCalledTimes = (mockFn: any, times: number) => {
  expect(mockFn).toHaveBeenCalledTimes(times)
}

/**
 * Assert that a function was not called
 */
export const expectNotCalled = (mockFn: any) => {
  expect(mockFn).not.toHaveBeenCalled()
}

// ============================================================================
// ASYNC TESTING UTILITIES
// ============================================================================

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 10
): Promise<void> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Wait for an element to appear in the DOM
 */
export const waitForElement = async (
  selector: string,
  timeout: number = 1000
): Promise<Element> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector)
    if (element) {
      return element
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`)
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up after tests with improved isolation
 * Call this in afterEach to ensure clean test state
 */
export const cleanupAfterTest = async () => {
  // Clear all mocks and timers
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Reset service factory
  const { ServiceFactory } = await import('./service-factory')
  ServiceFactory.reset()
  
  // Clear DOM completely
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  
  // Clear storage (only if available)
  if (localStorage && typeof localStorage.clear === 'function') {
    localStorage.clear()
  }
  if (sessionStorage && typeof sessionStorage.clear === 'function') {
    sessionStorage.clear()
  }
  
  // Clear any remaining event listeners
  const events = ['beforeunload', 'unload', 'online', 'offline', 'focus', 'blur']
  events.forEach(event => {
    window.removeEventListener(event, () => {})
    document.removeEventListener(event, () => {})
  })
  
  // Clear service worker registrations
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations = vi.fn().mockResolvedValue([])
  }
  
  // Clear any remaining intervals/timeouts with better cleanup
  const highestTimeoutId = setTimeout(() => {}, 0)
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i)
    clearInterval(i)
  }
  
  // Clear any pending promises
  await new Promise(resolve => setTimeout(resolve, 0))
  
  // Reset global state
  if (global.gc) {
    global.gc()
  }
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  // Render utilities
  renderWithProviders,
  
  // Mock data
  mockSessionData,
  mockAttendeeData,
  mockAgendaItems,
  
  // Browser API mocks
  mockLocalStorage,
  mockSessionStorage,
  mockIndexedDB,
  mockCaches,
  mockPerformance,
  
  // Setup utilities
  setupBrowserMocks,
  resetAllMocks,
  setupServiceMocks,
  
  // Test data generators
  createMockSession,
  createMockAttendee,
  createMockAgendaItems,
  
  // Assertion utilities
  expectCalledWith,
  expectCalledTimes,
  expectNotCalled,
  
  // Async utilities
  waitForCondition,
  waitForElement,
  
  // Cleanup utilities
  cleanupAfterTest
}