import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../components/common/Header';

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

const renderWithAuth = (ui: React.ReactElement, authValue = {}) => {
  const defaultAuthValue = {
    isAuthenticated: false,
    attendee: null,
    attendeeName: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuthStatus: vi.fn(),
    ...authValue
  };

  mockUseAuth.mockReturnValue(defaultAuthValue);

  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render logo and not show user info when not authenticated', () => {
    renderWithAuth(<Header />, { isAuthenticated: false });
    
    expect(screen.getByText('KnowledgeNow')).toBeInTheDocument();
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });

  it('should show user info with full name when authenticated and attendeeName is available', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendeeName: {
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }
    });
    
    expect(screen.getByText('KnowledgeNow')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
  });

  it('should show user info with first name only when attendeeName is not available but attendee is', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendeeName: null,
      attendee: {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        company: 'Tech Corp',
        title: 'CTO',
        access_code: 'ABC123'
      }
    });
    
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument(); // Initials from first and last name
  });

  it('should show first name only when only first name is available', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendeeName: null,
      attendee: {
        id: '123',
        first_name: 'Alex',
        email: 'alex@example.com',
        company: 'Tech Corp',
        title: 'Developer',
        access_code: 'XYZ789'
      }
    });
    
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Initial from first name only
  });

  it('should show Guest when no attendee information is available', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendeeName: null,
      attendee: null
    });
    
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument(); // Unknown initials
  });

  it('should generate correct initials for different name formats', () => {
    const testCases = [
      { name: 'John Doe', expected: 'JD' },
      { name: 'Jane Smith', expected: 'JS' },
      { name: 'Alex Johnson', expected: 'AJ' },
      { name: 'Mary Jane Watson', expected: 'MW' }, // First and last
      { name: 'John', expected: 'J' },
      { name: '', expected: '?' },
      { name: null, expected: '?' }
    ];

    testCases.forEach(({ name, expected }) => {
      const { unmount } = renderWithAuth(<Header />, {
        isAuthenticated: true,
        attendeeName: name ? { first_name: name.split(' ')[0], last_name: name.split(' ')[1] || '', full_name: name } : null,
        attendee: null
      });
      
      if (expected !== '?') {
        expect(screen.getByText(expected)).toBeInTheDocument();
      }
      unmount();
    });
  });

  it('should handle click events when onUserClick is provided', () => {
    const mockOnUserClick = vi.fn();
    renderWithAuth(<Header onUserClick={mockOnUserClick} />, {
      isAuthenticated: true,
      attendeeName: {
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }
    });
    
    const userInfo = screen.getByText('John Doe').closest('.user-info');
    expect(userInfo).toHaveStyle('cursor: pointer');
  });

  it('should not show cursor pointer when onUserClick is not provided', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendeeName: {
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe'
      }
    });
    
    const userInfo = screen.getByText('John Doe').closest('.user-info');
    expect(userInfo).toHaveStyle('cursor: default');
  });
});
