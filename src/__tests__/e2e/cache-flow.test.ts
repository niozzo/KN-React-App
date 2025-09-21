/**
 * End-to-End Cache Flow Tests
 * Story 2.1f4: Integration & Testing
 * 
 * End-to-end tests for complete cache flow scenarios
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAgendaData } from '../../hooks/useAgendaData';
import { unifiedCacheService } from '../../services/unifiedCacheService';

// Mock components and services
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, attendee: { id: 'test-user' } })
}));

vi.mock('../../services/unifiedCacheService', () => ({
  unifiedCacheService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
    getHealthStatus: vi.fn()
  }
}));

vi.mock('../../services/agendaService', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test component that uses the hooks
const TestComponent = () => {
  const { agendaData, loading, error, loadAgendaItems } = useAgendaData();

  React.useEffect(() => {
    loadAgendaItems();
  }, [loadAgendaItems]);

  if (loading) return <div>Loading your schedule...</div>;
  if (error) return <div>Error: {error}</div>;
  if (agendaData?.data) {
    return (
      <div>
        {agendaData.data.map((item: any) => (
          <div key={item.id}>{item.title}</div>
        ))}
      </div>
    );
  }
  return <div>No data available</div>;
};

describe('Cache Flow End-to-End', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full data loading flow', async () => {
    const mockAgendaData = {
      data: [
        { id: '1', title: 'Morning Session', isActive: true },
        { id: '2', title: 'Afternoon Session', isActive: true }
      ],
      success: true
    };

    // Mock API responses
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgendaData.data)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test-user', name: 'Test User' })
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Morning Session')).toBeInTheDocument();
    });

    expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
  });

  it('should handle cache corruption gracefully', async () => {
    // Mock corrupted cache
    const mockLocalStorage = {
      getItem: vi.fn((key) => {
        if (key === 'kn_cache_agenda_items') {
          return '{"data": [{"id": "1", "title": "Test"}], "version": "1.0.0", "timestamp": "2025-01-01T00:00:00Z"}';
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should handle corrupted cache and fallback to server
    await waitFor(() => {
      expect(screen.getByText('Loading your schedule...')).toBeInTheDocument();
    });
  });

  it('should handle network failure recovery', async () => {
    // Mock network failure then recovery
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: '1', title: 'Recovered Session' }])
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show loading initially
    expect(screen.getByText('Loading your schedule...')).toBeInTheDocument();

    // Should eventually recover and show data
    await waitFor(() => {
      expect(screen.getByText('Recovered Session')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should persist state across page reloads', async () => {
    const mockData = {
      data: [{ id: '1', title: 'Persistent Session' }],
      success: true
    };

    // Mock localStorage with existing data
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should load from cache immediately
    await waitFor(() => {
      expect(screen.getByText('Persistent Session')).toBeInTheDocument();
    });
  });

  it('should handle concurrent data loading', async () => {
    const mockData1 = { data: [{ id: '1', title: 'Session 1' }], success: true };
    const mockData2 = { data: [{ id: '2', title: 'Session 2' }], success: true };

    // Mock multiple concurrent requests
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData1.data)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData2.data)
      });

    const TestConcurrentComponent = () => {
      const { agendaData: data1, loadAgendaItems: load1 } = useAgendaData();
      const { agendaData: data2, loadAgendaItems: load2 } = useAgendaData();

      React.useEffect(() => {
        load1();
        load2();
      }, [load1, load2]);

      return (
        <div>
          <div>Data1: {data1?.data?.length || 0}</div>
          <div>Data2: {data2?.data?.length || 0}</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConcurrentComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should handle concurrent loading without conflicts
    await waitFor(() => {
      expect(screen.getByText('Data1: 1')).toBeInTheDocument();
      expect(screen.getByText('Data2: 1')).toBeInTheDocument();
    });
  });
});
