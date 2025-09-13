# TDD Setup Guide

## Overview
This guide covers the Test-Driven Development (TDD) infrastructure setup for the Conference Companion PWA.

## Testing Stack
- **Framework**: Vitest (Vite-native, fast, TypeScript-first)
- **React Testing**: React Testing Library (user-centric testing)
- **PWA Testing**: Custom utilities for Service Worker, A2HS, offline functionality
- **Coverage**: c8 (V8 coverage reporting)
- **Mocking**: Vitest mocks + MSW for API mocking

## Quick Start

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci

# Run tests with UI
npm run test:ui
```

### Test Structure
```
src/
├── __tests__/
│   ├── setup.ts                 # Global test setup
│   ├── utils/
│   │   ├── test-utils.tsx       # Custom render functions
│   │   ├── pwa-mocks.ts         # PWA API mocks
│   │   └── mock-data.ts         # Test data fixtures
│   ├── components/              # Component tests
│   ├── pages/                   # Page tests
│   ├── services/                # Service tests
│   └── integration/             # Integration tests
```

## PWA Testing

### Service Worker Testing
```typescript
import { setupPWAMocks, cleanupPWAMocks } from '../utils/pwa-mocks'

describe('Service Worker', () => {
  beforeEach(() => {
    setupPWAMocks()
  })
  
  afterEach(() => {
    cleanupPWAMocks()
  })
  
  test('registers service worker', async () => {
    // Test service worker registration
  })
})
```

### Offline/Online Testing
```typescript
import { testOfflineBehavior, testOnlineBehavior } from '../utils/test-utils'

testOfflineBehavior(() => {
  test('shows offline state', () => {
    // Test offline behavior
  })
})

testOnlineBehavior(() => {
  test('shows online state', () => {
    // Test online behavior
  })
})
```

### A2HS Testing
```typescript
import { mockInstallPrompt } from '../utils/pwa-mocks'

test('handles install prompt', () => {
  const installEvent = mockInstallPrompt()
  window.dispatchEvent(installEvent)
  
  // Test install prompt behavior
})
```

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '../utils/test-utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  test('renders without crashing', () => {
    render(<MyComponent />)
    expect(screen.getByTestId('my-component')).toBeInTheDocument()
  })
  
  test('handles user interaction', () => {
    render(<MyComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // Assert expected behavior
  })
})
```

### Service Tests
```typescript
import { describe, test, expect, vi } from 'vitest'
import { myService } from '../myService'

describe('MyService', () => {
  test('calls API correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' })
    global.fetch = mockFetch
    
    const result = await myService.getData()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/data')
    expect(result).toEqual({ data: 'test' })
  })
})
```

## Coverage Requirements

### Thresholds
- **Lines**: 80% minimum
- **Functions**: 85% minimum
- **Branches**: 70% minimum
- **Statements**: 80% minimum

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Coverage reports uploaded to Codecov

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No critical accessibility violations
- PWA compliance checks

## Best Practices

### Test Organization
1. **Unit Tests (70%)**: Individual components, utilities, services
2. **Integration Tests (20%)**: Component interactions, data flow
3. **E2E Tests (10%)**: Critical user journeys, PWA installation

### Naming Conventions
- Test files: `ComponentName.test.tsx`
- Test descriptions: `should [expected behavior] when [condition]`
- Test data: Use descriptive names and realistic values

### Accessibility Testing
```typescript
import { testAccessibility } from '../utils/test-utils'

testAccessibility('MyComponent', () => {
  test('has proper ARIA attributes', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label')
  })
})
```

### Performance Testing
```typescript
import { testPerformance } from '../utils/test-utils'

testPerformance('MyComponent', () => {
  test('renders within performance budget', () => {
    const start = performance.now()
    render(<MyComponent />)
    const end = performance.now()
    expect(end - start).toBeLessThan(100) // 100ms budget
  })
})
```

## Troubleshooting

### Common Issues
1. **Service Worker not mocked**: Ensure `setupPWAMocks()` is called
2. **Network state not updating**: Use `mockNetworkStateChange()`
3. **Coverage not generating**: Check vitest.config.ts coverage settings
4. **Tests timing out**: Increase timeout or use `waitFor()`

### Debug Commands
```bash
# Run specific test file
npm test -- OfflineIndicator.test.tsx

# Run tests with verbose output
npm test -- --reporter=verbose

# Debug tests
npm run test:ui
```

## Resources
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [PWA Testing Guide](https://web.dev/testing-pwa/)
- [Accessibility Testing](https://testing-library.com/docs/guiding-principles/)
