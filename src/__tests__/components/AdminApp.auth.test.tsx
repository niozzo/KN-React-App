/**
 * AdminApp Component - Authentication Tests
 * Tests for admin passcode authentication
 * 
 * Test Categories:
 * - Authentication: Passcode validation
 * - Session Management: Session persistence
 * - Logout: Session clearing
 * 
 * Related: ADR-005 (Admin Authentication Pattern)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminApp } from '../../components/AdminApp';

// Mock PasscodeScreen
vi.mock('../../components/PasscodeScreen', () => ({
  PasscodeScreen: ({ onPasscodeValid }: { onPasscodeValid: () => void }) => (
    <div data-testid="passcode-screen">
      <button onClick={onPasscodeValid} data-testid="mock-passcode-valid">
        Submit Passcode
      </button>
    </div>
  )
}));

// Mock Outlet
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: ({ context }: { context: any }) => (
      <div data-testid="admin-outlet">
        <button 
          onClick={context.onLogout} 
          data-testid="mock-logout"
        >
          Logout
        </button>
      </div>
    ),
  };
});

// Mock sessionStorage
const mockSessionStorage: Record<string, any> = {};

describe('AdminApp - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockSessionStorage).forEach(key => {
            delete mockSessionStorage[key];
          });
        })
      },
      writable: true
    });
    
    // Clear mock storage
    Object.keys(mockSessionStorage).forEach(key => {
      delete mockSessionStorage[key];
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require passcode to access admin panel', () => {
    // Arrange
    mockSessionStorage['admin_authenticated'] = null;

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByTestId('passcode-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-outlet')).not.toBeInTheDocument();
  });

  it('should grant access after valid passcode', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Verify passcode screen shown
    expect(screen.getByTestId('passcode-screen')).toBeInTheDocument();

    // Submit passcode
    fireEvent.click(screen.getByTestId('mock-passcode-valid'));

    // Assert
    await waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'admin_authenticated',
        'true'
      );
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin authenticated')
    );

    consoleSpy.mockRestore();
  });

  it('should persist authentication in session', () => {
    // Arrange
    mockSessionStorage['admin_authenticated'] = 'true';

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.queryByTestId('passcode-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-outlet')).toBeInTheDocument();
  });

  it('should show admin outlet when authenticated', () => {
    // Arrange
    mockSessionStorage['admin_authenticated'] = 'true';

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByTestId('admin-outlet')).toBeInTheDocument();
  });

  it('should clear authentication on logout', async () => {
    // Arrange
    mockSessionStorage['admin_authenticated'] = 'true';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    const { rerender } = render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Verify logged in
    expect(screen.getByTestId('admin-outlet')).toBeInTheDocument();

    // Click logout
    fireEvent.click(screen.getByTestId('mock-logout'));

    // Assert
    await waitFor(() => {
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('admin_authenticated');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Admin logged out')
    );

    // Rerender to reflect state change
    rerender(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    consoleSpy.mockRestore();
  });

  it('should log authentication events', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('mock-passcode-valid'));

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔐 Admin authenticated')
      );
    });

    consoleSpy.mockRestore();
  });

  it('should not show passcode screen if already authenticated', () => {
    // Arrange
    mockSessionStorage['admin_authenticated'] = 'true';

    // Act
    render(
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    );

    // Assert
    expect(screen.queryByTestId('passcode-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-outlet')).toBeInTheDocument();
  });
});

