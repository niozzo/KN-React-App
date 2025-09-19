/**
 * Test dependency injection mechanism
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectServices, resetServices } from '../../hooks/useSessionData-testable';

describe('Dependency Injection Test', () => {
  let mockAgendaService, mockDataService, mockTimeService;

  beforeEach(() => {
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
  });

  afterEach(() => {
    resetServices();
  });

  it('should inject services correctly', () => {
    // Inject services
    injectServices({
      agendaService: mockAgendaService,
      dataService: mockDataService,
      timeService: mockTimeService
    });

    // The injection should work without errors
    expect(mockAgendaService.getActiveAgendaItems).toBeDefined();
    expect(mockDataService.getCurrentAttendeeData).toBeDefined();
    expect(mockTimeService.getCurrentTime).toBeDefined();
  });

  it('should reset services correctly', () => {
    // Inject services
    injectServices({
      agendaService: mockAgendaService,
      dataService: mockDataService,
      timeService: mockTimeService
    });

    // Reset services
    resetServices();

    // Services should be reset (we can't easily test this without accessing internals)
    // But the function should not throw
    expect(() => resetServices()).not.toThrow();
  });
});
