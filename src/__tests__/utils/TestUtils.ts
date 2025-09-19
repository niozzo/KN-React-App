/**
 * Test Utilities for common test patterns
 */

import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceContainer } from '../../services/ServiceContainer';
import { MockFactory } from '../mocks/MockFactory';
import type { IServerDataSyncService } from '../../services/interfaces/IServerDataSyncService';
import type { ICacheService } from '../../services/interfaces/ICacheService';

export interface TestServices {
  serverDataSyncService?: IServerDataSyncService;
  cacheService?: ICacheService;
}

export class TestUtils {
  /**
   * Clear all mocks and reset service container
   */
  static setupTestEnvironment(): void {
    vi.clearAllMocks();
    ServiceContainer.getInstance().clear();
  }

  /**
   * Register test services in the service container
   */
  static registerTestServices(services: TestServices): void {
    const container = ServiceContainer.getInstance();
    
    if (services.serverDataSyncService) {
      container.register('serverDataSyncService', services.serverDataSyncService);
    }
    
    if (services.cacheService) {
      container.register('cacheService', services.cacheService);
    }
  }

  /**
   * Create default test services
   */
  static createDefaultTestServices(): TestServices {
    return {
      serverDataSyncService: MockFactory.createServerDataSyncServiceMock(),
      cacheService: MockFactory.createCacheServiceMock()
    };
  }

  /**
   * Setup test environment with default services
   */
  static setupWithDefaultServices(): TestServices {
    this.setupTestEnvironment();
    const services = this.createDefaultTestServices();
    this.registerTestServices(services);
    return services;
  }

  /**
   * Create a mock localStorage for testing
   */
  static createMockLocalStorage(): Storage {
    const store: Record<string, string> = {};

    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      length: 0
    };
  }

  /**
   * Setup global fetch mock
   */
  static setupFetchMock(responseData: any = [], options: ResponseInit = {}): void {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(responseData),
      ...options
    });
  }

  /**
   * Setup fetch mock to reject with error
   */
  static setupFetchError(errorMessage = 'Network error'): void {
    global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsync(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Create a mock console to capture logs
   */
  static createMockConsole(): {
    console: Console;
    getLogs: () => string[];
    clearLogs: () => void;
  } {
    const logs: string[] = [];
    
    const mockConsole = {
      log: vi.fn((...args) => logs.push(args.join(' '))),
      warn: vi.fn((...args) => logs.push(`WARN: ${args.join(' ')}`)),
      error: vi.fn((...args) => logs.push(`ERROR: ${args.join(' ')}`)),
      info: vi.fn((...args) => logs.push(`INFO: ${args.join(' ')}`)),
      debug: vi.fn((...args) => logs.push(`DEBUG: ${args.join(' ')}`))
    } as Console;

    return {
      console: mockConsole,
      getLogs: () => [...logs],
      clearLogs: () => logs.length = 0
    };
  }
}
