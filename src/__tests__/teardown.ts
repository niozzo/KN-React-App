import { afterEach, afterAll, vi } from 'vitest'
import { cleanupAfterTest } from './utils/test-utils'

// Global test teardown for memory management
afterEach(() => {
  // Use standardized cleanup utility
  cleanupAfterTest()
  
  // Additional cleanup specific to teardown
  vi.useRealTimers()
  
  // Reset any global state
  if (window.workbox) {
    window.workbox.removeEventListener = vi.fn()
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
