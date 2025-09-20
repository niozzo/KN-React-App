/**
 * Test useSessionData graceful fallback
 * Story 2.1c: Fix Cache Validation Logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionData } from '../../hooks/useSessionData';

// Mock dependencies
vi.mock('../../services/agendaService.ts', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn(),
  },
}));

vi.mock('../../services/dataService.ts', () => ({
  getCurrentAttendeeData: vi.fn(),
  getAttendeeSeatAssignments: vi.fn(),
}));

vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(() => new Date()),
    registerSessionBoundaries: vi.fn(),
    isOverrideActive: vi.fn(() => false),
    startBoundaryMonitoring: vi.fn(),
    stopBoundaryMonitoring: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSessionData Cache Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should fall back to cache when agenda service fails', async () => {
    const { agendaService } = await import('../../services/agendaService.ts');
    const { getCurrentAttendeeData } = await import('../../services/dataService.ts');

    // Mock agenda service failure
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: false,
      error: 'Network error',
      data: [],
    });

    // Mock attendee data
    getCurrentAttendeeData.mockResolvedValue({
      id: '123',
      name: 'Test User',
    });

    // Mock cached sessions
    const cachedSessions = [
      { id: '1', title: 'Cached Session', isActive: true, date: '2024-01-01', start_time: '09:00' },
    ];

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'kn_cached_sessions') {
        return JSON.stringify({
          sessions: cachedSessions,
          currentSession: null,
          nextSession: cachedSessions[0],
          lastUpdated: new Date().toISOString(),
        });
      }
      return null;
    });

    const { result } = renderHook(() => useSessionData());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.sessions).toEqual(cachedSessions);
    expect(result.current.allSessions).toEqual(cachedSessions);
    expect(agendaService.getActiveAgendaItems).toHaveBeenCalled();
  });

  it('should use empty arrays when no cache available and agenda service fails', async () => {
    const { agendaService } = await import('../../services/agendaService.ts');
    const { getCurrentAttendeeData } = await import('../../services/dataService.ts');

    // Mock agenda service failure
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: false,
      error: 'Network error',
      data: [],
    });

    // Mock attendee data
    getCurrentAttendeeData.mockResolvedValue({
      id: '123',
      name: 'Test User',
    });

    // No cached data
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSessionData());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.allSessions).toEqual([]);
  });

  it('should handle cache parsing errors gracefully', async () => {
    const { agendaService } = await import('../../services/agendaService.ts');
    const { getCurrentAttendeeData } = await import('../../services/dataService.ts');

    // Mock agenda service failure
    agendaService.getActiveAgendaItems.mockResolvedValue({
      success: false,
      error: 'Network error',
      data: [],
    });

    // Mock attendee data
    getCurrentAttendeeData.mockResolvedValue({
      id: '123',
      name: 'Test User',
    });

    // Mock invalid cached data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'kn_cached_sessions') {
        return 'invalid json';
      }
      return null;
    });

    const { result } = renderHook(() => useSessionData());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.allSessions).toEqual([]);
  });
});
