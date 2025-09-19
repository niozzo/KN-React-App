# Testing Standards & Patterns

## 🎯 **Purpose**
This document establishes consistent testing patterns and standards across the KN-React-App project to improve test maintainability, readability, and reliability.

## 📋 **Testing Principles**

### 1. **Test Structure**
- **Arrange-Act-Assert (AAA)** pattern
- **Descriptive test names** that explain the expected behavior
- **Single responsibility** per test case
- **Consistent file organization** by feature/component

### 2. **Mocking Strategy**
- **Mock external dependencies** (APIs, services, browser APIs)
- **Use real implementations** for internal utilities when possible
- **Consistent mock setup** across similar test files
- **Clear mock boundaries** between unit and integration tests

### 3. **Test Categories**
- **Unit Tests**: Test individual functions/components in isolation
- **Integration Tests**: Test component interactions and data flow
- **E2E Tests**: Test complete user journeys
- **Security Tests**: Test authentication and data security

## 🏗️ **Standard Test File Structure**

### **File Naming Convention**
```
src/__tests__/
├── components/
│   ├── ComponentName.test.tsx          # Basic functionality
│   ├── ComponentName.integration.test.tsx  # Integration tests
│   └── ComponentName.edge-cases.test.tsx   # Edge cases
├── hooks/
│   ├── useHookName.test.js             # Hook functionality
│   └── useHookName.time-override.test.js  # Specific scenarios
├── services/
│   ├── serviceName.test.ts             # Basic service tests
│   ├── serviceName.basic.test.ts       # Basic functionality
│   └── serviceName.comprehensive.test.ts # Comprehensive tests
├── pages/
│   └── PageName.test.jsx               # Page-level tests
├── integration/
│   └── featureName.test.ts             # Cross-component tests
├── security/
│   └── security-aspect.test.tsx        # Security-focused tests
└── utils/
    └── utilityName.test.js             # Utility function tests
```

### **Standard Test Template**

```typescript
/**
 * [Component/Service/Feature] Tests
 * [Brief description of what this test file covers]
 * 
 * Test Categories:
 * - [Category 1]: [Description]
 * - [Category 2]: [Description]
 * - [Category 3]: [Description]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
// Import other testing utilities as needed

// Mock external dependencies
vi.mock('../../services/externalService', () => ({
  externalService: {
    method: vi.fn()
  }
}))

// Mock browser APIs
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

describe('[Component/Service/Feature] - [Test Category]', () => {
  // Test setup
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup common mocks
    global.localStorage = mockLocalStorage
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Cleanup if needed
  })

  describe('[Feature Group 1]', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const mockData = { /* test data */ }
      mockService.method.mockResolvedValue(mockData)

      // Act
      const result = await functionUnderTest()

      // Assert
      expect(result).toBe(expectedValue)
      expect(mockService.method).toHaveBeenCalledWith(expectedArgs)
    })

    it('should handle [error condition] gracefully', async () => {
      // Arrange
      mockService.method.mockRejectedValue(new Error('Test error'))

      // Act & Assert
      await expect(functionUnderTest()).rejects.toThrow('Test error')
    })
  })

  describe('[Feature Group 2]', () => {
    // More test cases
  })
})
```

## 🔧 **Mocking Standards**

### **Service Mocking**
```typescript
// Standard service mock pattern
vi.mock('../../services/serviceName', () => ({
  serviceName: {
    method1: vi.fn(),
    method2: vi.fn(),
    method3: vi.fn()
  }
}))

// In test setup
beforeEach(async () => {
  const { serviceName } = await import('../../services/serviceName')
  serviceName.method1.mockResolvedValue(mockData)
  serviceName.method2.mockRejectedValue(new Error('Test error'))
})
```

### **Browser API Mocking**
```typescript
// Standard browser API mocks
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

const mockIndexedDB = {
  deleteDatabase: vi.fn()
}

const mockCaches = {
  keys: vi.fn(),
  delete: vi.fn()
}

// Apply mocks
beforeEach(() => {
  vi.stubGlobal('localStorage', mockLocalStorage)
  vi.stubGlobal('indexedDB', mockIndexedDB)
  vi.stubGlobal('caches', mockCaches)
})
```

### **Component Mocking**
```typescript
// Mock React components
vi.mock('../../components/ComponentName', () => ({
  default: ({ children, ...props }) => (
    <div data-testid="mocked-component" {...props}>
      {children}
    </div>
  )
}))

// Mock context providers
vi.mock('../../contexts/ContextName', () => ({
  ContextProvider: ({ children }) => <div>{children}</div>,
  useContext: () => mockContextValue
}))
```

## 📝 **Test Naming Conventions**

### **Test Descriptions**
- **Use descriptive names** that explain the expected behavior
- **Include the condition** that triggers the behavior
- **Use consistent language**: "should [behavior] when [condition]"

**Good Examples:**
```typescript
it('should display error message when authentication fails')
it('should clear session data when user logs out')
it('should update current session when time changes')
it('should handle API errors gracefully')
```

**Bad Examples:**
```typescript
it('works correctly')
it('handles errors')
it('updates state')
```

### **Describe Block Organization**
```typescript
describe('ComponentName - [Test Category]', () => {
  describe('[Feature Group 1]', () => {
    // Related test cases
  })
  
  describe('[Feature Group 2]', () => {
    // Related test cases
  })
  
  describe('Error Handling', () => {
    // Error scenarios
  })
  
  describe('Edge Cases', () => {
    // Edge case scenarios
  })
})
```

## 🧪 **Testing Utilities**

### **Common Test Utilities**
```typescript
// src/__tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    // Add common providers here
    ...options
  })
}

// Common mock data
export const mockSessionData = {
  id: '1',
  title: 'Test Session',
  start_time: '09:00:00',
  end_time: '10:00:00',
  type: 'keynote'
}

export const mockAttendeeData = {
  id: 'attendee-1',
  name: 'Test User',
  access_code: 'ABC123'
}
```

### **Async Testing Patterns**
```typescript
// Standard async test pattern
it('should handle async operations', async () => {
  // Arrange
  const mockData = { /* test data */ }
  mockService.method.mockResolvedValue(mockData)

  // Act
  const result = await functionUnderTest()

  // Assert
  expect(result).toEqual(mockData)
  expect(mockService.method).toHaveBeenCalledTimes(1)
})

// Testing async errors
it('should handle async errors', async () => {
  // Arrange
  mockService.method.mockRejectedValue(new Error('Test error'))

  // Act & Assert
  await expect(functionUnderTest()).rejects.toThrow('Test error')
})
```

## 🚀 **Performance Testing**

### **Memory Management**
```typescript
// Clean up after tests
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  
  // Clear DOM
  document.body.innerHTML = ''
  
  // Clear storage
  localStorage.clear()
  sessionStorage.clear()
})
```

### **Timeout Management**
```typescript
// Use appropriate timeouts
it('should complete within reasonable time', async () => {
  const startTime = Date.now()
  
  await functionUnderTest()
  
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(1000) // 1 second max
}, 5000) // 5 second test timeout
```

## 📊 **Coverage Standards**

### **Coverage Targets**
- **Critical Components**: 80%+ statements, 70%+ branches
- **Services**: 75%+ statements, 60%+ branches
- **Utilities**: 90%+ statements, 80%+ branches
- **Overall**: 50%+ statements, 50%+ branches (current realistic target)

### **Coverage Exclusions**
```typescript
// Exclude from coverage
/* istanbul ignore next */
const unreachableCode = () => {
  // This code should never be reached
}
```

## 🔍 **Quality Checklist**

### **Before Submitting Tests**
- [ ] Tests follow the standard file structure
- [ ] Test names are descriptive and consistent
- [ ] Mocks are properly set up and cleaned up
- [ ] Async operations are properly tested
- [ ] Error scenarios are covered
- [ ] Edge cases are considered
- [ ] Tests are isolated and don't depend on each other
- [ ] Coverage meets the minimum thresholds
- [ ] No console errors or warnings in test output

### **Code Review Checklist**
- [ ] Tests are readable and maintainable
- [ ] Mock boundaries are appropriate
- [ ] Test data is realistic and representative
- [ ] Assertions are specific and meaningful
- [ ] Test setup is efficient and not overly complex

## 📚 **Examples**

### **Component Test Example**
```typescript
/**
 * SessionCard Component Tests
 * Tests for session card display and interaction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionCard from '../../components/session/SessionCard'

describe('SessionCard - Basic Functionality', () => {
  const mockSession = {
    id: '1',
    title: 'Test Session',
    start_time: '09:00:00',
    end_time: '10:00:00',
    type: 'keynote'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Display', () => {
    it('should display session title and time', () => {
      // Arrange
      render(<SessionCard session={mockSession} />)

      // Act & Assert
      expect(screen.getByText('Test Session')).toBeInTheDocument()
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should call onSelect when clicked', () => {
      // Arrange
      const mockOnSelect = vi.fn()
      render(<SessionCard session={mockSession} onSelect={mockOnSelect} />)

      // Act
      fireEvent.click(screen.getByRole('button'))

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith(mockSession)
    })
  })
})
```

### **Service Test Example**
```typescript
/**
 * DataService Tests
 * Tests for data service functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataService } from '../../services/dataService'

// Mock external dependencies
vi.mock('../../services/apiService', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('DataService - Data Operations', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { apiService } = await import('../../services/apiService')
    apiService.get.mockResolvedValue({ data: [] })
  })

  describe('Data Retrieval', () => {
    it('should fetch data successfully', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Test' }]
      const { apiService } = await import('../../services/apiService')
      apiService.get.mockResolvedValue({ data: mockData })

      // Act
      const result = await dataService.getData()

      // Assert
      expect(result).toEqual(mockData)
      expect(apiService.get).toHaveBeenCalledWith('/data')
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const { apiService } = await import('../../services/apiService')
      apiService.get.mockRejectedValue(new Error('API Error'))

      // Act & Assert
      await expect(dataService.getData()).rejects.toThrow('API Error')
    })
  })
})
```

This testing standards document provides a comprehensive guide for maintaining consistent, high-quality tests across the KN-React-App project.
