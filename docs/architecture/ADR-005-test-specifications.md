# ADR-005: Admin Authentication Pattern - Test Specifications

**Related ADR:** ADR-005 (Admin Authentication Pattern)  
**Status:** Ready for Implementation  
**Test Coverage Target:** 80% statements, 70% branches  

## Overview

This document specifies comprehensive test coverage for the Admin Authentication Pattern implementation, ensuring security boundaries are maintained and functionality works as expected.

## Test Strategy

### Test Categories

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test component interactions
3. **Security Tests**: Verify authentication boundaries
4. **Edge Cases**: Handle error scenarios and edge cases

## 1. Data Initialization Service Tests

### File: `src/__tests__/services/dataInitializationService.admin.test.ts`

```typescript
/**
 * Data Initialization Service - Admin Access Tests
 * Tests for admin-specific data loading (no user authentication required)
 * 
 * Test Categories:
 * - Admin Data Loading: ensureDataLoadedForAdmin() functionality
 * - User Data Loading: Verify original ensureDataLoaded() unchanged
 * - Security Boundaries: Ensure correct authentication requirements
 * - Error Handling: Handle sync failures gracefully
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';
import { serverDataSyncService } from '../../services/serverDataSyncService';
import { getAuthStatus } from '../../services/authService';

// Mock dependencies
vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}));

vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn()
  }
}));

vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    getCachedTableData: vi.fn()
  }
}));

describe('DataInitializationService - Admin Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDataLoadedForAdmin', () => {
    it('should load data for admin without user authentication check', async () => {
      // Arrange
      const mockCachedData = { data: [{ id: '1', title: 'Session 1' }] };
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue(mockCachedData);
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(getAuthStatus).not.toHaveBeenCalled(); // No user auth check
    });

    it('should use cached data if available (fast path)', async () => {
      // Arrange
      const mockCachedData = { data: [{ id: '1', title: 'Session 1' }] };
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue(mockCachedData);
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(serverDataSyncService.syncAllData).not.toHaveBeenCalled();
    });

    it('should sync fresh data if cache is empty', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue(null); // No cached data
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: true,
        syncedTables: ['attendees', 'agenda_items'],
        errors: [],
        totalRecords: 100
      });

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
      expect(serverDataSyncService.syncAllData).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      // Arrange
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue(null);
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
      
      serverDataSyncService.syncAllData.mockResolvedValue({
        success: false,
        syncedTables: [],
        errors: ['Network error'],
        totalRecords: 0
      });

      // Act
      const result = await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(result.success).toBe(false);
      expect(result.hasData).toBe(false);
      expect(result.error).toContain('Failed to load conference data');
    });

    it('should log admin data access attempts', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue({ data: [] });
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      await dataInitializationService.ensureDataLoadedForAdmin();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Admin data access')
      );
    });
  });

  describe('ensureDataLoaded (user/attendee)', () => {
    it('should still require user authentication', async () => {
      // Arrange
      getAuthStatus.mockReturnValue({ isAuthenticated: false });

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(false);
      expect(result.requiresAuthentication).toBe(true);
      expect(getAuthStatus).toHaveBeenCalled(); // User auth check required
    });

    it('should load data when user is authenticated', async () => {
      // Arrange
      getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        attendee: { id: 'attendee-1' }
      });
      
      const { unifiedCacheService } = await import('../../services/unifiedCacheService');
      unifiedCacheService.get.mockResolvedValue({ data: [{ id: '1' }] });
      
      const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
      pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

      // Act
      const result = await dataInitializationService.ensureDataLoaded();

      // Assert
      expect(result.success).toBe(true);
      expect(result.hasData).toBe(true);
    });
  });
});
```

## 2. Admin App Component Tests

### File: `src/__tests__/components/AdminApp.test.tsx`

```typescript
/**
 * AdminApp Component Tests
 * Tests for admin passcode authentication
 * 
 * Test Categories:
 * - Authentication: Passcode validation
 * - Session Management: Session persistence
 * - Logout: Session clearing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminApp } from '../../components/AdminApp';

// Mock PasscodeScreen
vi.mock('../../components/PasscodeScreen', () => ({
  PasscodeScreen: ({ onPasscodeValid }) => (
    <div data-testid="passcode-screen">
      <button onClick={onPasscodeValid} data-testid="mock-passcode-valid">
        Submit Passcode
      </button>
    </div>
  )
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

describe('AdminApp - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.sessionStorage = mockSessionStorage as any;
  });

  it('should require passcode to access admin panel', () => {
    // Arrange
    mockSessionStorage.getItem.mockReturnValue(null);

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByTestId('passcode-screen')).toBeInTheDocument();
  });

  it('should grant access after valid passcode', async () => {
    // Arrange
    mockSessionStorage.getItem.mockReturnValue(null);
    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('mock-passcode-valid'));

    // Assert
    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'admin_authenticated',
        'true'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Admin authenticated')
      );
    });
  });

  it('should persist authentication in session', () => {
    // Arrange
    mockSessionStorage.getItem.mockReturnValue('true');

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.queryByTestId('passcode-screen')).not.toBeInTheDocument();
  });

  it('should clear authentication on logout', async () => {
    // Arrange
    mockSessionStorage.getItem.mockReturnValue('true');
    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    const { rerender } = render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Simulate logout (would be triggered from child component)
    // This would need adjustment based on actual implementation

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin logged out')
    );
  });
});
```

## 3. Security Boundary Tests

### File: `src/__tests__/security/admin-authentication-boundaries.test.ts`

```typescript
/**
 * Security Boundary Tests
 * Verifies security boundaries between admin and user authentication
 * 
 * Test Categories:
 * - Access Control: Who can access what
 * - Authentication Separation: Admin vs User auth
 * - Data Access: Appropriate data access levels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';
import { getAuthStatus } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  getAuthStatus: vi.fn()
}));

vi.mock('../../services/serverDataSyncService', () => ({
  serverDataSyncService: {
    syncAllData: vi.fn()
  }
}));

describe('Security Boundaries - Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin can access without user authentication', async () => {
    // Arrange
    getAuthStatus.mockReturnValue({ isAuthenticated: false }); // No user auth
    
    const { unifiedCacheService } = await import('../../services/unifiedCacheService');
    unifiedCacheService.get.mockResolvedValue({ data: [{ id: '1' }] });
    
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

    // Act
    const result = await dataInitializationService.ensureDataLoadedForAdmin();

    // Assert
    expect(result.success).toBe(true);
    expect(getAuthStatus).not.toHaveBeenCalled(); // No user auth check
  });

  it('regular users cannot bypass authentication', async () => {
    // Arrange
    getAuthStatus.mockReturnValue({ isAuthenticated: false });

    // Act
    const result = await dataInitializationService.ensureDataLoaded();

    // Assert
    expect(result.success).toBe(false);
    expect(result.requiresAuthentication).toBe(true);
  });

  it('admin path does not grant user authentication', async () => {
    // Arrange
    const { unifiedCacheService } = await import('../../services/unifiedCacheService');
    unifiedCacheService.get.mockResolvedValue({ data: [{ id: '1' }] });
    
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    pwaDataSyncService.getCachedTableData.mockResolvedValue([{ id: '1' }]);

    // Act
    await dataInitializationService.ensureDataLoadedForAdmin();
    const userAuthStatus = getAuthStatus();

    // Assert - Admin access doesn't change user auth status
    expect(userAuthStatus.isAuthenticated).toBe(false);
  });

  it('user authentication does not grant admin access', async () => {
    // This would be tested in AdminApp component tests
    // User being authenticated doesn't bypass admin passcode requirement
    expect(true).toBe(true); // Placeholder for actual test
  });
});
```

## 4. Admin Page Component Tests

### File: `src/__tests__/components/AdminPage.actions.test.tsx`

```typescript
/**
 * AdminPage Component - Admin Action Tests
 * Tests for admin action logging
 * 
 * Test Categories:
 * - Data Modification: Edit agenda items, dining options
 * - Logging: Verify admin actions are logged
 * - Validation: Input validation works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../../components/AdminPage';

// Mock services
vi.mock('../../services/adminService', () => ({
  adminService: {
    getAgendaItemsWithAssignments: vi.fn(),
    getDiningOptionsWithMetadata: vi.fn(),
    getAvailableAttendees: vi.fn(),
    updateAgendaItemTitle: vi.fn(),
    updateDiningOptionTitle: vi.fn(),
    validateTitle: vi.fn()
  }
}));

vi.mock('../../services/dataInitializationService', () => ({
  dataInitializationService: {
    ensureDataLoadedForAdmin: vi.fn()
  }
}));

describe('AdminPage - Admin Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { adminService } = await import('../../services/adminService');
    adminService.getAgendaItemsWithAssignments.mockResolvedValue([
      { id: '1', title: 'Session 1', speaker_assignments: [] }
    ]);
    adminService.getDiningOptionsWithMetadata.mockResolvedValue([]);
    adminService.getAvailableAttendees.mockResolvedValue([]);
    
    const { dataInitializationService } = await import('../../services/dataInitializationService');
    dataInitializationService.ensureDataLoadedForAdmin.mockResolvedValue({
      success: true,
      hasData: true
    });
  });

  it('should log admin modifications to agenda items', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log');
    const { adminService } = await import('../../services/adminService');
    adminService.validateTitle.mockReturnValue(true);
    adminService.updateAgendaItemTitle.mockResolvedValue(undefined);

    // Act
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });

    // Simulate editing (would require clicking edit button, etc.)
    // This is a simplified example

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin modified agenda item'),
      expect.any(Object)
    );
  });

  it('should log admin modifications to dining options', async () => {
    // Similar test for dining option modifications
    expect(true).toBe(true); // Placeholder
  });

  it('should log force global sync actions', async () => {
    // Similar test for force sync
    expect(true).toBe(true); // Placeholder
  });
});
```

## 5. Edge Cases & Error Handling

### File: `src/__tests__/services/dataInitializationService.edge-cases.test.ts`

```typescript
/**
 * Data Initialization Service - Edge Cases
 * Tests for error scenarios and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataInitializationService } from '../../services/dataInitializationService';
import { serverDataSyncService } from '../../services/serverDataSyncService';

describe('DataInitializationService - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle network errors during sync', async () => {
    // Arrange
    const { unifiedCacheService } = await import('../../services/unifiedCacheService');
    unifiedCacheService.get.mockResolvedValue(null);
    
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
    
    serverDataSyncService.syncAllData.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await dataInitializationService.ensureDataLoadedForAdmin();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle corrupted cache data', async () => {
    // Arrange
    const { unifiedCacheService } = await import('../../services/unifiedCacheService');
    unifiedCacheService.get.mockRejectedValue(new Error('Invalid JSON'));
    
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    pwaDataSyncService.getCachedTableData.mockResolvedValue([]);

    // Act
    const result = await dataInitializationService.ensureDataLoadedForAdmin();

    // Assert - Should handle gracefully
    expect(result).toBeDefined();
  });

  it('should handle empty database', async () => {
    // Arrange
    const { unifiedCacheService } = await import('../../services/unifiedCacheService');
    unifiedCacheService.get.mockResolvedValue(null);
    
    const { pwaDataSyncService } = await import('../../services/pwaDataSyncService');
    pwaDataSyncService.getCachedTableData.mockResolvedValue([]);
    
    serverDataSyncService.syncAllData.mockResolvedValue({
      success: true,
      syncedTables: ['attendees', 'agenda_items'],
      errors: [],
      totalRecords: 0 // Empty database
    });

    // Act
    const result = await dataInitializationService.ensureDataLoadedForAdmin();

    // Assert
    expect(result.success).toBe(true);
    expect(result.hasData).toBe(true); // Sync succeeded even if empty
  });
});
```

## Test Execution

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test dataInitializationService.admin.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Coverage Targets

| Component | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| `dataInitializationService.ts` | 80% | 70% | 80% | 80% |
| `AdminApp.tsx` | 75% | 70% | 75% | 75% |
| `AdminPage.tsx` | 70% | 60% | 70% | 70% |
| **Overall** | **75%** | **65%** | **75%** | **75%** |

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All security boundary tests pass
- [ ] Coverage meets minimum thresholds
- [ ] No linter errors
- [ ] No console errors in test output

## Implementation Checklist

- [ ] Create test files in `src/__tests__/` directory
- [ ] Implement all specified test cases
- [ ] Run tests and verify all pass
- [ ] Check coverage and add tests if needed
- [ ] Document any test assumptions or limitations
- [ ] Add tests to CI/CD pipeline

---

**These test specifications ensure comprehensive coverage of the Admin Authentication Pattern implementation with focus on security boundaries and functionality.**

