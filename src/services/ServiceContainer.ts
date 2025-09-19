/**
 * Service Container for Dependency Injection
 * Provides a centralized registry for service dependencies
 */

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service with the container
   */
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a service from the container
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found in container`);
    }
    return service;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Remove a service from the container
   */
  remove(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Clear all services from the container
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}
