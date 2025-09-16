/**
 * useSessionData Hook - Next Session Logic Tests
 * Testing the fix for proper next session selection by date and time
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionData } from '../../hooks/useSessionData'
import TimeService from '../../services/timeService'

// Mock dependencies
vi.mock('../../services/agendaService.ts', () => ({
  agendaService: {
    getActiveAgendaItems: vi.fn()
  }
}))

vi.mock('../../services/dataService', () => ({
  getCurrentAttendeeData: vi.fn(() => Promise.resolve({ id: 'test-user' })),
  getAttendeeSeatAssignments: vi.fn(() => Promise.resolve([]))
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}))

// Mock TimeService
vi.mock('../../services/timeService', () => ({
  default: {
    getCurrentTime: vi.fn(),
    isOverrideActive: vi.fn(() => false)
  }
}))

describe('useSessionData - Next Session Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should select the earliest upcoming session by date first, then time', async () => {
    // Mock current time: October 21st, 9:00 AM
    const currentTime = new Date('2024-10-21T09:00:00')
    TimeService.getCurrentTime.mockReturnValue(currentTime)

    // Mock agenda data with sessions at different times and dates
    const mockAgendaData = {
      success: true,
      data: [
        {
          id: '1',
          title: 'Current Session',
          date: '2024-10-21',
          start_time: '09:00',
          end_time: '09:30',
          is_active: true
        },
        {
          id: '2', 
          title: 'Same Day Later Session',
          date: '2024-10-21',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        },
        {
          id: '3',
          title: 'Tomorrow Morning Session',
          date: '2024-10-22',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '4',
          title: 'Tomorrow Afternoon Session', 
          date: '2024-10-22',
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        }
      ]
    }

    const { agendaService } = await import('../../services/agendaService.ts')
    agendaService.getActiveAgendaItems.mockResolvedValue(mockAgendaData)

    const { result } = renderHook(() => useSessionData())

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Should have current session (id: '1') and next session should be same day later (id: '2')
    // because it's earlier than tomorrow's session
    expect(result.current.currentSession).toBeTruthy()
    expect(result.current.currentSession.id).toBe('1')
    expect(result.current.nextSession).toBeTruthy()
    expect(result.current.nextSession.id).toBe('2')
  })

  it('should select tomorrow session when no more sessions today', async () => {
    // Mock current time: October 21st, 3:30 PM (after all today's sessions)
    const currentTime = new Date('2024-10-21T15:30:00')
    TimeService.getCurrentTime.mockReturnValue(currentTime)

    const mockAgendaData = {
      success: true,
      data: [
        {
          id: '1',
          title: 'Morning Session (Past)',
          date: '2024-10-21',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '2',
          title: 'Afternoon Session (Past)',
          date: '2024-10-21', 
          start_time: '14:00',
          end_time: '15:00',
          is_active: true
        },
        {
          id: '3',
          title: 'Tomorrow Morning Session',
          date: '2024-10-22',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        },
        {
          id: '4',
          title: 'Tomorrow Afternoon Session',
          date: '2024-10-22',
          start_time: '14:00', 
          end_time: '15:00',
          is_active: true
        }
      ]
    }

    const { agendaService } = await import('../../services/agendaService.ts')
    agendaService.getActiveAgendaItems.mockResolvedValue(mockAgendaData)

    const { result } = renderHook(() => useSessionData())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Should have no current session and next session should be tomorrow morning
    expect(result.current.currentSession).toBeNull()
    expect(result.current.nextSession).toBeTruthy()
    expect(result.current.nextSession.id).toBe('3')
  })

  it('should handle sessions with same start time correctly', async () => {
    // Mock current time: October 21st, 8:30 AM (before sessions start)
    const currentTime = new Date('2024-10-21T08:30:00')
    TimeService.getCurrentTime.mockReturnValue(currentTime)

    const mockAgendaData = {
      success: true,
      data: [
        {
          id: '1',
          title: 'Session A - Same Time',
          date: '2024-10-21',
          start_time: '09:00',
          end_time: '09:30',
          is_active: true
        },
        {
          id: '2',
          title: 'Session B - Same Time',
          date: '2024-10-21',
          start_time: '09:00', 
          end_time: '12:00',
          is_active: true
        },
        {
          id: '3',
          title: 'Tomorrow Session',
          date: '2024-10-22',
          start_time: '09:00',
          end_time: '10:00',
          is_active: true
        }
      ]
    }

    const { agendaService } = await import('../../services/agendaService.ts')
    agendaService.getActiveAgendaItems.mockResolvedValue(mockAgendaData)

    const { result } = renderHook(() => useSessionData())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Should select the first session alphabetically when times are the same
    expect(result.current.currentSession).toBeNull()
    expect(result.current.nextSession).toBeTruthy()
    expect(result.current.nextSession.id).toBe('1') // First alphabetically
  })
})
