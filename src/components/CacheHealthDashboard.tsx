/**
 * Cache Health Dashboard Component
 * Story 2.1e2: Advanced Monitoring Dashboard
 * 
 * Provides visual interface for monitoring cache performance and health
 */

import React, { useState, useEffect } from 'react';
import { cacheMetricsService, CacheMetrics, HistoricalMetric } from '../services/cacheMetricsService';
import { dataConsistencyService } from '../services/dataConsistencyService';
import './CacheHealthDashboard.css';

interface CacheHealthDashboardProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

export const CacheHealthDashboard: React.FC<CacheHealthDashboardProps> = ({ 
  isVisible: controlledVisible, 
  onToggle 
}) => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState('unknown');
  const [historicalData, setHistoricalData] = useState<HistoricalMetric[]>([]);
  const [isVisible, setIsVisible] = useState(controlledVisible ?? false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const currentMetrics = cacheMetricsService.getMetrics();
        const health = cacheMetricsService.getHealthStatus();
        const historical = cacheMetricsService.getHistoricalData(24);
        
        setMetrics(currentMetrics);
        setHealthStatus(health.status);
        setHistoricalData(historical);
        setLoading(false);
      } catch (error) {
        console.error('Error loading cache metrics:', error);
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (controlledVisible !== undefined) {
      setIsVisible(controlledVisible);
    }
  }, [controlledVisible]);

  const handleToggle = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    onToggle?.(newVisible);
  };

  const calculateHitRate = (metrics: CacheMetrics | null): number => {
    if (!metrics) return 0;
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? Math.round((metrics.cacheHits / total) * 100) : 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'status-healthy';
      case 'unhealthy': return 'status-unhealthy';
      case 'warning': return 'status-warning';
      default: return 'status-unknown';
    }
  };

  if (!isVisible) {
    return (
      <button 
        className="cache-dashboard-toggle"
        onClick={handleToggle}
        title="Open Cache Health Dashboard"
      >
        📊 Cache Health
      </button>
    );
  }

  if (loading) {
    return (
      <div className="cache-health-dashboard loading">
        <div className="loading-spinner">Loading cache metrics...</div>
      </div>
    );
  }

  return (
    <div className="cache-health-dashboard">
      <div className="dashboard-header">
        <h3>Cache Health Dashboard</h3>
        <button 
          className="close-button"
          onClick={handleToggle}
          title="Close Dashboard"
        >
          ×
        </button>
      </div>
      
      <div className="health-status">
        <div className={`status-indicator ${getStatusColor(healthStatus)}`}>
          {getStatusIcon(healthStatus)}
        </div>
        <div className="status-details">
          <span className="status-text">Status: {healthStatus}</span>
          <span className="last-updated">
            Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : 'Unknown'}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Cache Performance</h4>
          <div className="metric-value">
            <div className="metric-item">
              <span className="metric-label">Hits:</span>
              <span className="metric-number">{metrics?.cacheHits || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Misses:</span>
              <span className="metric-number">{metrics?.cacheMisses || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Hit Rate:</span>
              <span className="metric-number">{calculateHitRate(metrics)}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Response Time</h4>
          <div className="metric-value">
            <div className="metric-item">
              <span className="metric-label">Average:</span>
              <span className="metric-number">{metrics?.averageResponseTime?.toFixed(2) || 0}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Data Size:</span>
              <span className="metric-number">{formatBytes(metrics?.totalDataSize || 0)}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Issues</h4>
          <div className="metric-value">
            <div className="metric-item">
              <span className="metric-label">Corruptions:</span>
              <span className="metric-number error">{metrics?.cacheCorruptions || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Sync Failures:</span>
              <span className="metric-number error">{metrics?.syncFailures || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">State Resets:</span>
              <span className="metric-number warning">{metrics?.stateResets || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="historical-chart">
        <h4>24-Hour Performance</h4>
        <CachePerformanceChart data={historicalData} />
      </div>

      <div className="dashboard-actions">
        <button 
          className="refresh-button"
          onClick={() => window.location.reload()}
          title="Refresh Page"
        >
          🔄 Refresh
        </button>
        <button 
          className="reset-button"
          onClick={() => {
            cacheMetricsService.resetMetrics();
            window.location.reload();
          }}
          title="Reset Metrics"
        >
          🔄 Reset Metrics
        </button>
      </div>
    </div>
  );
};

// Simple performance chart component
const CachePerformanceChart: React.FC<{ data: HistoricalMetric[] }> = ({ data }) => {
  const chartData = data.slice(-20); // Show last 20 data points
  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  
  return (
    <div className="performance-chart">
      <div className="chart-container">
        {chartData.map((point, index) => (
          <div 
            key={index}
            className="chart-bar"
            style={{
              height: `${(point.value / maxValue) * 100}%`,
              backgroundColor: point.type === 'cache_hit' ? '#4CAF50' : '#F44336'
            }}
            title={`${point.type}: ${point.value}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
          />
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>Cache Hits</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
          <span>Cache Misses</span>
        </div>
      </div>
    </div>
  );
};

export default CacheHealthDashboard;
