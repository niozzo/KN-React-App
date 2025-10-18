import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceRegistry } from '../../services/ServiceRegistry';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_APPLICATION_DB_URL: 'https://test-app-db.supabase.co',
    VITE_APPLICATION_DB_ANON_KEY: 'test-anon-key',
    VITE_APPLICATION_DB_SERVICE_KEY: 'test-service-key'
  }
}));

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ServiceRegistry as any).instance = undefined;
    serviceRegistry = ServiceRegistry.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ServiceRegistry.getInstance();
      const instance2 = ServiceRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize ServiceRegistry only once', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      serviceRegistry.initialize();
      serviceRegistry.initialize(); // Second call should be skipped
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ ServiceRegistry already initialized - skipping duplicate initialization');
    });

    it('should handle initialization status correctly', () => {
      expect(serviceRegistry.isServiceInitialized()).toBe(false);
      
      serviceRegistry.initialize();
      
      expect(serviceRegistry.isServiceInitialized()).toBe(true);
    });

    it('should provide application database client', () => {
      serviceRegistry.initialize();
      
      const client = serviceRegistry.getApplicationDbClient();
      expect(client).toBeDefined();
    });

    it('should provide admin database client', () => {
      serviceRegistry.initialize();
      
      const client = serviceRegistry.getAdminDbClient();
      expect(client).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate initialization gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      serviceRegistry.initialize();
      serviceRegistry.initialize(); // Second call should not throw
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ ServiceRegistry already initialized - skipping duplicate initialization');
    });

    it('should maintain initialization state correctly', () => {
      expect(serviceRegistry.isServiceInitialized()).toBe(false);
      
      serviceRegistry.initialize();
      
      expect(serviceRegistry.isServiceInitialized()).toBe(true);
    });
  });

  describe('Dual Database Architecture', () => {
    it('should create separate clients for different databases', () => {
      serviceRegistry.initialize();
      
      const appClient = serviceRegistry.getApplicationDbClient();
      const adminClient = serviceRegistry.getAdminDbClient();
      
      // Clients should be different instances
      expect(appClient).toBeDefined();
      expect(adminClient).toBeDefined();
    });
  });
});
