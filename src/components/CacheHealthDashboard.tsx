/**
 * Cache Health Dashboard - Simplified Version
 * 
 * Provides basic cache status information using the simplified cache approach
 */

import React, { useState, useEffect } from 'react';
import './CacheHealthDashboard.css';

interface CacheHealthDashboardProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

interface CacheStatus {
  totalEntries: number;
  cacheKeys: string[];
  lastUpdated: string;
}

export const CacheHealthDashboard: React.FC<CacheHealthDashboardProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    totalEntries: 0,
    cacheKeys: [],
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadCacheStatus = async () => {
    setIsLoading(true);
    try {
      // Get all cache_ prefixed keys from localStorage
      const cacheKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          cacheKeys.push(key);
        }
      }

      setCacheStatus({
        totalEntries: cacheKeys.length,
        cacheKeys,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load cache status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadCacheStatus();
    }
  }, [isVisible]);

  const handleRefresh = () => {
    loadCacheStatus();
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache?')) {
      // Clear all cache_ prefixed keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      loadCacheStatus();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cache-health-dashboard">
      <div className="dashboard-header">
        <h3>Cache Status (Simplified)</h3>
        <div className="dashboard-actions">
          <button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={handleClearCache} className="clear-button">
            Clear Cache
          </button>
          {onToggle && (
            <button onClick={() => onToggle(false)} className="close-button">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="status-grid">
          <div className="status-card">
            <h4>Cache Entries</h4>
            <div className="metric-value">{cacheStatus.totalEntries}</div>
          </div>
          
          <div className="status-card">
            <h4>Last Updated</h4>
            <div className="metric-value">
              {new Date(cacheStatus.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="cache-keys">
          <h4>Cache Keys</h4>
          <div className="keys-list">
            {cacheStatus.cacheKeys.length > 0 ? (
              cacheStatus.cacheKeys.map((key, index) => (
                <div key={index} className="key-item">
                  {key}
                </div>
              ))
            ) : (
              <div className="no-keys">No cache entries found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheHealthDashboard;