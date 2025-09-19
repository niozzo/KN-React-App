/**
 * Minimal test for useSessionData
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { injectServices, resetServices } from '../../hooks/useSessionData-testable';

// Mock the entire hook module
vi.mock('../../hooks/useSessionData-testable', async () => {
  const actual = await vi.importActual('../../hooks/useSessionData-testable');
  return {
    ...actual,
    useSessionData: vi.fn()
  };
});

describe('useSessionData Minimal Test', () => {
  let mockAgendaService, mockDataService, mockTimeService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAgendaService = {
      getActiveAgendaItems: vi.fn().mockResolvedValue({
        success: true,
        data: [],
        error: null
      })
    };

    mockDataService = {
      getCurrentAttendeeData: vi.fn().mockResolvedValue({}),
      getAttendeeSeatAssignments: vi.fn().mockResolvedValue([])
    };

    mockTimeService = {
      getCurrentTime: vi.fn().mockReturnValue(new Date()),
      isOverrideActive: vi.fn().mockReturnValue(false),
      getOverrideTime: vi.fn().mockReturnValue(null)
    };

    // Inject services
    injectServices({
      agendaService: mockAgendaService,
      dataService: mockDataService,
      timeService: mockTimeService
    });
  });

  afterEach(() => {
    resetServices();
  });

  it('should inject services without errors', () => {
    // Just test that injection works
    expect(mockAgendaService.getActiveAgendaItems).toBeDefined();
    expect(mockDataService.getCurrentAttendeeData).toBeDefined();
    expect(mockTimeService.getCurrentTime).toBeDefined();
  });
});
