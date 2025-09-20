/**
 * Cache Health Dashboard Component Tests
 * Story 2.1e2: Advanced Monitoring Dashboard
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CacheHealthDashboard } from '../../components/CacheHealthDashboard';
import { cacheMetricsService } from '../../services/cacheMetricsService';
import { dataConsistencyService } from '../../services/dataConsistencyService';

// Mock the services
vi.mock('../../services/cacheMetricsService', () => ({
  cacheMetricsService: {
    getMetrics: vi.fn(),
    getHealthStatus: vi.fn(),
    getHistoricalData: vi.fn(),
    resetMetrics: vi.fn()
  }
}));

vi.mock('../../services/dataConsistencyService', () => ({
  dataConsistencyService: {
    validateCacheConsistency: vi.fn()
  }
}));

const mockCacheMetricsService = cacheMetricsService as any;
const mockDataConsistencyService = dataConsistencyService as any;

describe('CacheHealthDashboard', () => {
  const mockMetrics = {
    cacheHits: 10,
    cacheMisses: 2,
    cacheCorruptions: 0,
    syncFailures: 0,
    stateResets: 0,
    averageResponseTime: 150.5,
    totalDataSize: 2048,
    lastUpdated: '2024-01-01T12:00:00Z'
  };

  const mockHealthStatus = {
    status: 'healthy',
    issues: [],
    lastChecked: '2024-01-01T12:00:00Z'
  };

  const mockHistoricalData = [
    { type: 'cache_hit', value: 100, timestamp: '2024-01-01T11:00:00Z' },
    { type: 'cache_miss', value: 0, timestamp: '2024-01-01T11:30:00Z' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockCacheMetricsService.getMetrics.mockReturnValue(mockMetrics);
    mockCacheMetricsService.getHealthStatus.mockReturnValue(mockHealthStatus);
    mockCacheMetricsService.getHistoricalData.mockReturnValue(mockHistoricalData);
    mockDataConsistencyService.validateCacheConsistency.mockReturnValue({
      isConsistent: true,
      issues: []
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('toggle visibility', () => {
    it('should show toggle button when not visible', () => {
      render(<CacheHealthDashboard />);
      
      expect(screen.getByText('📊 Cache Health')).toBeInTheDocument();
      expect(screen.queryByText('Cache Health Dashboard')).not.toBeInTheDocument();
    });

    it('should show dashboard when toggle button is clicked', () => {
      render(<CacheHealthDashboard />);
      
      const toggleButton = screen.getByText('📊 Cache Health');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Cache Health Dashboard')).toBeInTheDocument();
    });

    it('should hide dashboard when close button is clicked', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Cache Health Dashboard')).not.toBeInTheDocument();
    });

    it('should call onToggle when provided', () => {
      const onToggle = vi.fn();
      render(<CacheHealthDashboard onToggle={onToggle} />);
      
      const toggleButton = screen.getByText('📊 Cache Health');
      fireEvent.click(toggleButton);
      
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('loading state', () => {
    it('should handle loading errors gracefully', () => {
      mockCacheMetricsService.getMetrics.mockImplementation(() => {
        throw new Error('Loading error');
      });
      
      render(<CacheHealthDashboard isVisible={true} />);
      
      // Component should still render with default values
      expect(screen.getByText('Cache Health Dashboard')).toBeInTheDocument();
    });
  });

  describe('health status display', () => {
    it('should display healthy status correctly', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Status: healthy')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should display unhealthy status correctly', () => {
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'unhealthy',
        issues: ['Cache corruption detected'],
        lastChecked: '2024-01-01T12:00:00Z'
      });
      
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Status: unhealthy')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should display warning status correctly', () => {
      mockCacheMetricsService.getHealthStatus.mockReturnValue({
        status: 'warning',
        issues: ['Low hit rate: 45%'],
        lastChecked: '2024-01-01T12:00:00Z'
      });
      
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Status: warning')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('metrics display', () => {
    it('should display cache performance metrics', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Hits:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Misses:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Hit Rate:')).toBeInTheDocument();
      expect(screen.getByText('83%')).toBeInTheDocument();
    });

    it('should display response time metrics', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Average:')).toBeInTheDocument();
      expect(screen.getByText('150.50ms')).toBeInTheDocument();
      expect(screen.getByText('Data Size:')).toBeInTheDocument();
      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    it('should display issue metrics', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Corruptions:')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(3); // Three zeros for corruptions, sync failures, and state resets
      expect(screen.getByText('Sync Failures:')).toBeInTheDocument();
      expect(screen.getByText('State Resets:')).toBeInTheDocument();
    });
  });

  describe('historical chart', () => {
    it('should display historical performance chart', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('24-Hour Performance')).toBeInTheDocument();
      expect(screen.getByText('Cache Hits')).toBeInTheDocument();
      expect(screen.getByText('Cache Misses')).toBeInTheDocument();
    });
  });

  describe('dashboard actions', () => {
    it('should have refresh and reset buttons', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
      expect(screen.getByText('🔄 Reset Metrics')).toBeInTheDocument();
    });

    it('should call resetMetrics when reset button is clicked', () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      const resetButton = screen.getByText('🔄 Reset Metrics');
      fireEvent.click(resetButton);
      
      expect(mockCacheMetricsService.resetMetrics).toHaveBeenCalled();
    });
  });

  describe('auto refresh', () => {
    it('should refresh metrics every 5 seconds', async () => {
      render(<CacheHealthDashboard isVisible={true} />);
      
      // Initial call
      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(1);
      
      // Advance timer by 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      // Should have been called again
      expect(mockCacheMetricsService.getMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle metrics loading error gracefully', () => {
      mockCacheMetricsService.getMetrics.mockImplementation(() => {
        throw new Error('Failed to load metrics');
      });
      
      render(<CacheHealthDashboard isVisible={true} />);
      
      // Component should still render with default values
      expect(screen.getByText('Cache Health Dashboard')).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should render without crashing on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<CacheHealthDashboard isVisible={true} />);
      
      expect(screen.getByText('Cache Health Dashboard')).toBeInTheDocument();
    });
  });
});
