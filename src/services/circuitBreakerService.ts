/**
 * Circuit Breaker Service
 * 
 * Implements circuit breaker pattern to handle API failures gracefully
 * and prevent cascading failures in the application.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;        // Number of failures before opening circuit
  recoveryTimeout: number;         // Time to wait before attempting recovery
  monitoringPeriod: number;        // Time window for monitoring failures
  halfOpenMaxCalls: number;       // Max calls allowed in half-open state
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
  totalCalls: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  circuitState: CircuitBreakerState;
}

export class CircuitBreakerService {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 30000, // 30 seconds
      monitoringPeriod: config.monitoringPeriod || 60000, // 1 minute
      halfOpenMaxCalls: config.halfOpenMaxCalls || 3
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    circuitKey: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    const circuit = this.getOrCreateCircuit(circuitKey);
    const now = Date.now();

    // Check if circuit should be opened
    if (this.shouldOpenCircuit(circuit, now)) {
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = now + this.config.recoveryTimeout;
    }

    // Check if circuit should be half-opened
    if (this.shouldHalfOpenCircuit(circuit, now)) {
      circuit.state = 'HALF_OPEN';
      circuit.successCount = 0;
    }

    // Execute based on circuit state
    let result: CircuitBreakerResult<T>;
    switch (circuit.state) {
      case 'OPEN':
        result = await this.handleOpenCircuit(circuit, fallback);
        break;
      
      case 'HALF_OPEN':
        result = await this.handleHalfOpenCircuit(circuit, operation, fallback);
        break;
      
      case 'CLOSED':
      default:
        result = await this.handleClosedCircuit(circuit, operation, fallback);
        break;
    }

    // Check if circuit should be opened after execution (for CLOSED state)
    if (circuit.state === 'CLOSED' && this.shouldOpenCircuit(circuit, Date.now())) {
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }

    return result;
  }

  /**
   * Get circuit state for monitoring
   */
  getCircuitState(circuitKey: string): CircuitBreakerState | null {
    return this.circuits.get(circuitKey) || null;
  }

  /**
   * Reset circuit state (for testing or manual recovery)
   */
  resetCircuit(circuitKey: string): void {
    this.circuits.delete(circuitKey);
  }

  /**
   * Get all circuit states for monitoring
   */
  getAllCircuitStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuits);
  }

  /**
   * Check if circuit is healthy
   */
  isCircuitHealthy(circuitKey: string): boolean {
    const circuit = this.circuits.get(circuitKey);
    if (!circuit) return true;
    
    return circuit.state === 'CLOSED' || 
           (circuit.state === 'HALF_OPEN' && circuit.successCount > 0);
  }

  private getOrCreateCircuit(circuitKey: string): CircuitBreakerState {
    if (!this.circuits.has(circuitKey)) {
      this.circuits.set(circuitKey, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0,
        totalCalls: 0
      });
    }
    return this.circuits.get(circuitKey)!;
  }

  private shouldOpenCircuit(circuit: CircuitBreakerState, now: number): boolean {
    if (circuit.state !== 'CLOSED') return false;
    
    // Check if we're still in the monitoring period
    const timeSinceLastFailure = now - circuit.lastFailureTime;
    if (timeSinceLastFailure > this.config.monitoringPeriod) {
      // Reset failure count if monitoring period has passed
      circuit.failureCount = 0;
      return false;
    }
    
    return circuit.failureCount >= this.config.failureThreshold;
  }

  private shouldHalfOpenCircuit(circuit: CircuitBreakerState, now: number): boolean {
    return circuit.state === 'OPEN' && now >= circuit.nextAttemptTime;
  }

  private async handleOpenCircuit<T>(
    circuit: CircuitBreakerState,
    fallback?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    circuit.totalCalls++;
    
    if (fallback) {
      try {
        const data = await fallback();
        return {
          success: true,
          data,
          fromCache: true,
          circuitState: circuit
        };
      } catch (error) {
        return {
          success: false,
          error: `Circuit OPEN - Fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          circuitState: circuit
        };
      }
    }
    
    return {
      success: false,
      error: 'Circuit OPEN - Service unavailable',
      circuitState: circuit
    };
  }

  private async handleHalfOpenCircuit<T>(
    circuit: CircuitBreakerState,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    circuit.totalCalls++;
    
    // Check if we've exceeded half-open call limit
    if (circuit.successCount >= this.config.halfOpenMaxCalls) {
      circuit.state = 'CLOSED';
      circuit.failureCount = 0;
      circuit.successCount = 0;
    }
    
    try {
      const data = await operation();
      circuit.successCount++;
      
      // If we have enough successes, close the circuit
      if (circuit.successCount >= this.config.halfOpenMaxCalls) {
        circuit.state = 'CLOSED';
        circuit.failureCount = 0;
        circuit.successCount = 0;
      }
      
      return {
        success: true,
        data,
        circuitState: circuit
      };
    } catch (error) {
      circuit.state = 'OPEN';
      circuit.failureCount++;
      circuit.lastFailureTime = Date.now();
      circuit.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      
      if (fallback) {
        try {
          const data = await fallback();
          return {
            success: true,
            data,
            fromCache: true,
            circuitState: circuit
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: `Circuit HALF_OPEN - Operation and fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            circuitState: circuit
          };
        }
      }
      
      return {
        success: false,
        error: `Circuit HALF_OPEN - Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        circuitState: circuit
      };
    }
  }

  private async handleClosedCircuit<T>(
    circuit: CircuitBreakerState,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    circuit.totalCalls++;
    
    try {
      const data = await operation();
      
      // Only reset failure count if circuit is in CLOSED state
      if (circuit.state === 'CLOSED' && circuit.failureCount > 0) {
        circuit.failureCount = Math.max(0, circuit.failureCount - 1);
      }
      
      return {
        success: true,
        data,
        circuitState: circuit
      };
    } catch (error) {
      circuit.failureCount++;
      circuit.lastFailureTime = Date.now();
      
      if (fallback) {
        try {
          const data = await fallback();
          return {
            success: true,
            data,
            fromCache: true,
            circuitState: circuit
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: `Operation and fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            circuitState: circuit
          };
        }
      }
      
      return {
        success: false,
        error: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        circuitState: circuit
      };
    }
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService();
