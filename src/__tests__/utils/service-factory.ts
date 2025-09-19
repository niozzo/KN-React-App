/**
 * Service Factory for Test Dependency Injection
 * 
 * Provides a clean way to inject mock services for testing,
 * reducing complex mocking dependencies and improving test isolation.
 */

import { vi } from 'vitest';

// Service interfaces for dependency injection
export interface IAgendaService {
  getActiveAgendaItems: () => Promise<any>;
}

export interface IDataService {
  getCurrentAttendeeData: () => Promise<any>;
  getAttendeeSeatAssignments: () => Promise<any>;
}

export interface ITimeService {
  getCurrentTime: () => Date;
  isOverrideActive: () => boolean;
  getOverrideTime: () => Date | null;
  setOverrideTime: (time: Date) => void;
  clearOverrideTime: () => void;
}

// Default mock implementations
export const createMockAgendaService = (): IAgendaService => ({
  getActiveAgendaItems: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    error: null
  })
});

export const createMockDataService = (): IDataService => ({
  getCurrentAttendeeData: vi.fn().mockResolvedValue({
    id: 'test-attendee',
    name: 'Test User',
    selected_agenda_items: []
  }),
  getAttendeeSeatAssignments: vi.fn().mockResolvedValue([])
});

export const createMockTimeService = (): ITimeService => ({
  getCurrentTime: vi.fn().mockReturnValue(new Date()),
  isOverrideActive: vi.fn().mockReturnValue(false),
  getOverrideTime: vi.fn().mockReturnValue(null),
  setOverrideTime: vi.fn(),
  clearOverrideTime: vi.fn()
});

// Service factory for dependency injection
export class ServiceFactory {
  private static agendaService: IAgendaService | null = null;
  private static dataService: IDataService | null = null;
  private static timeService: ITimeService | null = null;

  static getAgendaService(): IAgendaService {
    if (!this.agendaService) {
      this.agendaService = createMockAgendaService();
    }
    return this.agendaService;
  }

  static getDataService(): IDataService {
    if (!this.dataService) {
      this.dataService = createMockDataService();
    }
    return this.dataService;
  }

  static getTimeService(): ITimeService {
    if (!this.timeService) {
      this.timeService = createMockTimeService();
    }
    return this.timeService;
  }

  // Reset all services (call in beforeEach)
  static reset(): void {
    this.agendaService = null;
    this.dataService = null;
    this.timeService = null;
  }

  // Inject specific services for testing
  static injectServices(services: {
    agendaService?: IAgendaService;
    dataService?: IDataService;
    timeService?: ITimeService;
  }): void {
    if (services.agendaService) {
      this.agendaService = services.agendaService;
    }
    if (services.dataService) {
      this.dataService = services.dataService;
    }
    if (services.timeService) {
      this.timeService = services.timeService;
    }
  }
}

// Mock factory for vitest
export const createServiceMocks = () => {
  const agendaService = createMockAgendaService();
  const dataService = createMockDataService();
  const timeService = createMockTimeService();

  return {
    agendaService,
    dataService,
    timeService,
    reset: () => {
      vi.clearAllMocks();
      ServiceFactory.reset();
    }
  };
};
