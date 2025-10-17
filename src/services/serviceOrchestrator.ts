/**
 * Service Orchestrator
 * Centralizes service initialization to eliminate race conditions
 * 
 * Architecture Pattern: Service Orchestration
 * - Single point of service initialization control
 * - Eliminates race conditions during authentication sync
 * - Clear dependency ordering
 * - Reusable across the application
 */

import { BaseService } from './baseService';

export class ServiceOrchestrator extends BaseService {
  private static instance: ServiceOrchestrator;
  private initializationPromise: Promise<void> | null = null;
  private isInitializing = false;

  private constructor() {
    super('ServiceOrchestrator');
  }

  static getInstance(): ServiceOrchestrator {
    if (!ServiceOrchestrator.instance) {
      ServiceOrchestrator.instance = new ServiceOrchestrator();
    }
    return ServiceOrchestrator.instance;
  }

  /**
   * Ensure all critical services are initialized and ready
   * Uses promise caching to prevent multiple initializations
   */
  async ensureServicesReady(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.initializationPromise = this.initializeServices();
    
    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initialize all critical services in proper order
   */
  private async initializeServices(): Promise<void> {
    try {
      console.log('🔄 ServiceOrchestrator: Starting service initialization...');

      // Step 1: Company Normalization Service (required for data processing)
      console.log('🔄 ServiceOrchestrator: Initializing Company Normalization Service...');
      const { CompanyNormalizationService } = await import('./companyNormalizationService');
      const companyService = CompanyNormalizationService.getInstance();
      await companyService.initialize();
      console.log('✅ ServiceOrchestrator: Company Normalization Service ready');

      // Step 2: Other critical services can be added here
      // Example: await this.initializeOtherServices();

      console.log('✅ ServiceOrchestrator: All services initialized and ready');

    } catch (error) {
      console.error('❌ ServiceOrchestrator: Service initialization failed:', error);
      throw new Error(`Service initialization failed: ${error.message}`);
    }
  }

  /**
   * Reset initialization state (for testing or error recovery)
   */
  reset(): void {
    this.initializationPromise = null;
    this.isInitializing = false;
  }

  /**
   * Check if services are ready
   */
  isReady(): boolean {
    return this.initializationPromise !== null && !this.isInitializing;
  }
}

// Export singleton instance for convenience
export const serviceOrchestrator = ServiceOrchestrator.getInstance();
