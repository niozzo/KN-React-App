import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

  it('should render profile picture when attendee has photo', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendee: {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        photo: 'https://example.com/profile.jpg'
      }
    });
    
    const profileImage = screen.getByAltText('John profile picture');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
    expect(profileImage).toHaveStyle({
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%'
    });
  });

  it('should fall back to initials when attendee has no photo', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendee: {
        id: '123',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        photo: null
      }
    });
    
    expect(screen.getByText('JS')).toBeInTheDocument(); // Initials
    expect(screen.queryByAltText('Jane profile picture')).not.toBeInTheDocument();
  });

  it('should fall back to initials when attendee has empty photo URL', () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendee: {
        id: '123',
        first_name: 'Alex',
        last_name: 'Johnson',
        email: 'alex@example.com',
        photo: ''
      }
    });
    
    expect(screen.getByText('AJ')).toBeInTheDocument(); // Initials
    expect(screen.queryByAltText('Alex profile picture')).not.toBeInTheDocument();
  });

  it('should handle image load error and fall back to initials', async () => {
    renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendee: {
        id: '123',
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob@example.com',
        photo: 'https://invalid-url.com/broken-image.jpg'
      }
    });
    
    // Initially should show the image
    const profileImage = screen.getByAltText('Bob profile picture');
    expect(profileImage).toBeInTheDocument();
    
    // Simulate image load error using fireEvent
    await act(async () => {
      fireEvent.error(profileImage);
    });
    
    // After error, should show initials
    expect(screen.getByText('BW')).toBeInTheDocument();
  });

  it('should reset image error state when attendee changes', async () => {
    const { rerender } = renderWithAuth(<Header />, {
      isAuthenticated: true,
      attendee: {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        photo: 'https://example.com/profile1.jpg'
      }
    });
    
    // Simulate image error for first attendee
    const profileImage = screen.getByAltText('John profile picture');
    
    await act(async () => {
      fireEvent.error(profileImage);
    });
    
    // Should show initials after error
    expect(screen.getByText('JD')).toBeInTheDocument();
    
    // Change to different attendee
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      attendee: {
        id: '456',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        photo: 'https://example.com/profile2.jpg'
      },
      attendeeName: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuthStatus: vi.fn()
    });
    
    await act(async () => {
      rerender(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );
    });
    
    // Should show new attendee's image (error state should be reset)
    expect(screen.getByAltText('Jane profile picture')).toBeInTheDocument();
  });
});
