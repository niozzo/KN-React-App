import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../../App';

// Mock all the page components
vi.mock('../../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

vi.mock('../../pages/MeetPage', () => ({
  default: () => <div data-testid="meet-page">Meet Page</div>
}));

vi.mock('../../pages/SchedulePage', () => ({
  default: () => <div data-testid="schedule-page">Schedule Page</div>
}));

vi.mock('../../pages/SponsorsPage', () => ({
  default: () => <div data-testid="sponsors-page">Sponsors Page</div>
}));

vi.mock('../../pages/SettingsPage', () => ({
  default: () => <div data-testid="settings-page">Settings Page</div>
}));

vi.mock('../../pages/BioPage', () => ({
  default: () => <div data-testid="bio-page">Bio Page</div>
}));

vi.mock('../../pages/SeatMapPage', () => ({
  default: () => <div data-testid="seat-map-page">Seat Map Page</div>
}));

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  withAuth: (Component) => Component,
  LoginPage: () => <div data-testid="login-page">Login Page</div>
}));

// Mock other components
vi.mock('../../components/OfflineIndicator', () => ({
  default: () => <div data-testid="offline-indicator">Offline Indicator</div>
}));

vi.mock('../../components/InstallPrompt', () => ({
  default: () => <div data-testid="install-prompt">Install Prompt</div>
}));

vi.mock('../../components/OfflinePage', () => ({
  default: () => <div data-testid="offline-page">Offline Page</div>
}));

vi.mock('../../components/AdminApp', () => ({
  AdminApp: () => <div data-testid="admin-app">Admin App</div>
}));

// Mock PWA service
vi.mock('../../services/pwaService', () => ({
  pwaService: {
    checkForUpdates: vi.fn()
  }
}));

describe('Schedule Page Route Integration', () => {
  it('renders schedule page when navigating to /schedule', () => {
    render(
      <MemoryRouter initialEntries={['/schedule']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('schedule-page')).toBeInTheDocument();
    expect(screen.getByText('Schedule Page')).toBeInTheDocument();
  });

  it('does not render schedule page on other routes', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('schedule-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders schedule page with proper auth wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/schedule']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-page')).toBeInTheDocument();
  });

  it('handles route changes correctly', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-page')).not.toBeInTheDocument();

    // Navigate to schedule
    rerender(
      <MemoryRouter initialEntries={['/schedule']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('schedule-page')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });
});
