/**
 * Tests for Circuit Breaker Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreakerService } from '../../services/circuitBreakerService';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    service = new CircuitBreakerService({
      failureThreshold: 3,
      recoveryTimeout: 1000, // 1 second for testing
      monitoringPeriod: 5000, // 5 seconds for testing
      halfOpenMaxCalls: 2
    });
  });

  describe('execute', () => {
    it('should execute successful operation in CLOSED state', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await service.execute('test', operation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.fromCache).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle operation failure in CLOSED state', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const result = await service.execute('test', operation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Operation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after failure threshold', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Execute operations to reach failure threshold
      for (let i = 0; i < 3; i++) {
        await service.execute('test', operation);
      }

      // Next execution should be in OPEN state
      const result = await service.execute('test', operation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Circuit OPEN');
    });

    it('should use fallback when circuit is OPEN', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const fallback = vi.fn().mockResolvedValue('fallback data');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute('test', operation);
      }

      // Execute with fallback
      const result = await service.execute('test', operation, fallback);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback data');
      expect(result.fromCache).toBe(true);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute('test', operation);
      }

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Mock successful operation
      operation.mockResolvedValue('success');
      const result = await service.execute('test', operation);

      // The circuit should be in HALF_OPEN state and allow the operation
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    }, 5000);

    it('should close circuit after successful half-open calls', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute('test', operation);
      }

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Mock successful operations
      operation.mockResolvedValue('success');
      
      // Execute successful operations
      for (let i = 0; i < 2; i++) {
        const result = await service.execute('test', operation);
        expect(result.success).toBe(true);
      }

      // Circuit should be closed now
      const circuitState = service.getCircuitState('test');
      expect(circuitState?.state).toBe('CLOSED');
    }, 5000);
  });

  describe('getCircuitState', () => {
    it('should return null for non-existent circuit', () => {
      const state = service.getCircuitState('nonexistent');
      expect(state).toBeNull();
    });

    it('should return circuit state after execution', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      await service.execute('test', operation);

      const state = service.getCircuitState('test');
      expect(state).not.toBeNull();
      expect(state?.state).toBe('CLOSED');
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit state', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      await service.execute('test', operation);

      service.resetCircuit('test');
      const state = service.getCircuitState('test');
      expect(state).toBeNull();
    });
  });

  describe('isCircuitHealthy', () => {
    it('should return true for healthy circuit', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      await service.execute('test', operation);

      const isHealthy = service.isCircuitHealthy('test');
      expect(isHealthy).toBe(true);
    });

    it('should return false for open circuit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute('test', operation);
      }

      // Check circuit state directly
      const circuitState = service.getCircuitState('test');
      expect(circuitState?.state).toBe('OPEN');
      
      const isHealthy = service.isCircuitHealthy('test');
      expect(isHealthy).toBe(false);
    });
  });
});
