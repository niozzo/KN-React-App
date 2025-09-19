/**
 * Service Factory for creating services with dependency injection
 */

import { ServiceContainer } from './ServiceContainer';
import { AgendaService } from './agendaService';
import { serverDataSyncService } from './serverDataSyncService';
import type { IAgendaService } from './interfaces/IAgendaService';
import type { IServerDataSyncService } from './interfaces/IServerDataSyncService';
import type { ICacheService } from './interfaces/ICacheService';

export class ServiceFactory {
  private static container = ServiceContainer.getInstance();

  /**
   * Create AgendaService with optional dependencies
   */
  static createAgendaService(dependencies?: {
    serverDataSyncService?: IServerDataSyncService;
    cacheService?: ICacheService;
  }): IAgendaService {
    const serverSyncService = dependencies?.serverDataSyncService || 
      this.container.get<IServerDataSyncService>('serverDataSyncService');
    
    const cacheService = dependencies?.cacheService || 
      this.container.get<ICacheService>('cacheService');

    return new AgendaService(serverSyncService, cacheService);
  }

  /**
   * Initialize default services in the container
   */
  static initializeDefaultServices(): void {
    // Register default services
    this.container.register('serverDataSyncService', serverDataSyncService);
    
    // Register a simple cache service implementation
    this.container.register('cacheService', {
      get: (key: string) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch {
          return null;
        }
      },
      set: (key: string, data: any, version = '1.0') => {
        const entry = {
          data,
          timestamp: new Date().toISOString(),
          version
        };
        localStorage.setItem(key, JSON.stringify(entry));
      },
      remove: (key: string) => localStorage.removeItem(key),
      clear: () => localStorage.clear(),
      has: (key: string) => localStorage.getItem(key) !== null
    });
  }

  /**
   * Get the service container instance
   */
  static getContainer(): ServiceContainer {
    return this.container;
  }
}
