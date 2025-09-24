/**
 * Base Service Class
 * Provides common functionality for all services
 */

export abstract class BaseService {
  protected serviceName: string;
  protected isInitialized: boolean = false;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Initialize the service
   */
  abstract initialize(): Promise<void>;

  /**
   * Get service health status
   */
  getHealthStatus(): { healthy: boolean; service: string; timestamp: string } {
    return {
      healthy: this.isInitialized,
      service: this.serviceName,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if running in local development mode
   */
  protected isLocalMode(): boolean {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;
}