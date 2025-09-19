import { afterEach, afterAll, vi } from 'vitest'

// Global test teardown for memory management
afterEach(() => {
  // Clear all mocks to prevent memory leaks
  vi.clearAllMocks()
  
  // Clear all timers (setTimeout, setInterval, etc.)
  vi.clearAllTimers()
  vi.useRealTimers()
  
  // Clean up DOM completely
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  
  // Clear localStorage and sessionStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Clear any remaining event listeners
  window.removeEventListener('beforeunload', () => {})
  window.removeEventListener('unload', () => {})
  window.removeEventListener('online', () => {})
  window.removeEventListener('offline', () => {})
  
  // Reset any global state
  if (window.workbox) {
    window.workbox.removeEventListener = vi.fn()
  }
  
  // Clear service worker registrations
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations = vi.fn().mockResolvedValue([])
  }
  
  // Force cleanup of any pending async operations
  vi.clearAllTimers()
  
  // Clear any remaining intervals/timeouts
  const highestTimeoutId = setTimeout(() => {}, 0)
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i)
    clearInterval(i)
  }
})

afterAll(() => {
  // Final cleanup after all tests
  vi.restoreAllMocks()
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Clear any remaining global state
  document.body.innerHTML = ''
  localStorage.clear()
  sessionStorage.clear()
})

// Memory monitoring helper
export const logMemoryUsage = (label: string) => {
  if (process.env.NODE_ENV === 'test') {
    const usage = process.memoryUsage()
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
    
    if (heapUsedMB > 100) { // Warn if over 100MB
      console.warn(`⚠️ High memory usage at ${label}: ${heapUsedMB}MB used / ${heapTotalMB}MB total`)
    }
  }
}
