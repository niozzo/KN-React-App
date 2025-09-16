# Testing Standards

## Overview
This document defines the testing standards for the Conference Companion PWA project. All developers must follow these standards to ensure clear, maintainable, and reliable test output.

## Core Principle
**Test output must be unambiguous and actionable:**
- ✅ Green = Test PASSED (functionality works)
- ❌ Red = Test FAILED (something is broken)
- ⚠️ Yellow = Warning (non-critical issue)

## Console Output Standards

### 1. Console Levels and Usage

#### `console.log()` - Normal Flow
```typescript
// ✅ Use for normal application flow
console.log('✅ User authenticated successfully')
console.log('🔄 Syncing data...')
console.log('📊 Performance: 100ms')
```

#### `console.warn()` - Expected Issues
```typescript
// ✅ Use for expected error handling scenarios
console.warn('⚠️ Network error handled gracefully:', error)
console.warn('⚠️ Cache miss, falling back to default')
console.warn('⚠️ Background sync not supported in this environment')
```

#### `console.error()` - Actual Problems
```typescript
// ✅ Use ONLY for genuine errors that need immediate attention
console.error('❌ Database connection failed:', error)
console.error('❌ Authentication service unavailable:', error)
console.error('❌ Critical system error:', error)
```

### 2. Error Handling Test Standards

#### ❌ WRONG - Don't Do This
```typescript
// This creates confusing red ❌ in test output
it('should handle network errors', async () => {
  mockNetworkError()
  // BAD: Using console.error for expected test scenarios
  expect(console.error).toHaveBeenCalledWith('❌ Network error:', error)
})
```

#### ✅ CORRECT - Do This Instead
```typescript
// This creates clear yellow ⚠️ for expected scenarios
it('should handle network errors gracefully', async () => {
  mockNetworkError()
  // GOOD: Using console.warn for expected error handling
  expect(console.warn).toHaveBeenCalledWith('⚠️ Network error handled gracefully:', error)
  // Verify the app continues working
  expect(appState).toBe('recovered')
})
```

## Test Implementation Guidelines

### 1. Error Handling Tests
When testing error scenarios, focus on:
- **Recovery**: Does the app continue working?
- **User Experience**: Is the error handled gracefully?
- **Logging**: Are appropriate warnings logged?

```typescript
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Arrange: Mock network error
    mockNetworkError()
    
    // Act: Trigger the error scenario
    await service.performAction()
    
    // Assert: Verify graceful handling
    expect(console.warn).toHaveBeenCalledWith('⚠️ Network error handled gracefully:', expect.any(Error))
    expect(appState).toBe('recovered')
    expect(userCanContinue).toBe(true)
  })
})
```

### 2. Success Path Tests
Focus on:
- **Functionality**: Does it work as expected?
- **Performance**: Is it within acceptable limits?
- **User Experience**: Is the flow smooth?

```typescript
describe('Success Paths', () => {
  it('should authenticate user successfully', async () => {
    // Arrange: Mock successful response
    mockSuccessfulAuth()
    
    // Act: Perform authentication
    const result = await authService.login(credentials)
    
    // Assert: Verify success
    expect(result.success).toBe(true)
    expect(console.log).toHaveBeenCalledWith('✅ User authenticated successfully')
  })
})
```

### 3. Edge Case Tests
Focus on:
- **Boundary Conditions**: What happens at limits?
- **Unexpected Input**: How does it handle invalid data?
- **Resource Constraints**: What happens when resources are limited?

```typescript
describe('Edge Cases', () => {
  it('should handle empty data gracefully', async () => {
    // Arrange: Mock empty response
    mockEmptyData()
    
    // Act: Process empty data
    const result = await service.processData([])
    
    // Assert: Verify graceful handling
    expect(console.warn).toHaveBeenCalledWith('⚠️ No data available, using defaults')
    expect(result).toEqual(defaultData)
  })
})
```

## Test Output Examples

### ✅ Good Test Output
```
✓ should authenticate user successfully
✓ should handle network errors gracefully
✓ should process data within performance budget
⚠️ Background sync not supported in this environment
```

### ❌ Bad Test Output
```
✓ should authenticate user successfully
✓ should handle network errors gracefully
❌ Network error: Connection failed  // This is confusing!
✓ should process data within performance budget
```

## Migration Guide

### Step 1: Identify Problematic Tests
Look for tests that use `console.error()` for expected error scenarios.

### Step 2: Update Error Handling
Replace `console.error()` with `console.warn()` for expected error handling.

### Step 3: Update Test Assertions
Change test expectations to match the new console output.

### Step 4: Verify Output
Run tests and ensure only genuine failures show red ❌.

## Enforcement

### Pre-commit Hooks
- All tests must pass with clean output
- No red ❌ in test output unless test actually failed
- Error handling tests must use `console.warn()`

### Code Review Checklist
- [ ] Error handling tests use `console.warn()`
- [ ] Success tests use `console.log()`
- [ ] Only genuine errors use `console.error()`
- [ ] Test output is clear and unambiguous

### CI/CD Integration
- Test output is monitored for red ❌
- Build fails if unexpected red ❌ appear
- Coverage reports exclude warning logs

## Tools and Utilities

### Test Helpers
```typescript
// Helper to verify warning logs
export const expectWarning = (message: string) => {
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(message))
}

// Helper to verify success logs
export const expectSuccess = (message: string) => {
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message))
}
```

### Linting Rules
```typescript
// ESLint rule to catch console.error in tests
"no-console": ["error", { "allow": ["warn", "log"] }]
```

## Conclusion

Following these standards ensures:
- **Clear Test Output**: Easy to identify real problems
- **Better Debugging**: Warnings vs errors are distinct
- **Improved CI/CD**: Automated checks catch issues
- **Team Productivity**: Less confusion, faster development

Remember: **Red ❌ means something is broken and needs fixing. Yellow ⚠️ means expected behavior with a note.**
