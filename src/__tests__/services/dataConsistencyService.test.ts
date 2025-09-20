/**
 * Data Consistency Service Tests
 * 
 * Tests for cache vs UI state consistency validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataConsistencyService, type ConsistencyReport, type UIState, type CacheState } from '../../services/dataConsistencyService';

describe('DataConsistencyService', () => {
  let service: DataConsistencyService;

  beforeEach(() => {
    service = new DataConsistencyService();
  });

  describe('validateCacheConsistency', () => {
    it('should report consistent state when data matches', () => {
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        attendees: [{ id: 1, name: 'John Doe' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        attendees: [{ id: 1, name: 'John Doe' }],
        isLoading: false,
        hasError: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(true);
      expect(report.issues).toEqual([]);
      expect(report.severity).toBe('low');
    });

    it('should detect cache has data but UI shows empty', () => {
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [],
        isLoading: false,
        hasError: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues).toContain('Cache has agenda data but UI shows empty sessions');
      expect(report.recommendations).toContain('Check session filtering logic and data transformation');
    });

    it('should detect UI has data but cache is empty', () => {
      const cacheState: CacheState = {
        agendaItems: [],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        isLoading: false,
        hasError: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues).toContain('UI has sessions but cache is empty');
      expect(report.recommendations).toContain('Verify cache storage and data persistence');
    });

    it('should detect future timestamps in cache', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: futureTime
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        isLoading: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('future');
      expect(report.severity).toBe('critical');
    });

    it('should detect future timestamps in UI', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        lastUpdated: futureTime,
        isLoading: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('future');
      expect(report.severity).toBe('critical');
    });

    it('should detect stale cache data', () => {
      const staleTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: staleTime
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        isLoading: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('stale');
      expect(report.severity).toBe('high');
    });

    it('should detect stale UI data', () => {
      const staleTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [{ id: 1, title: 'Session 1' }],
        lastUpdated: staleTime,
        isLoading: false
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('stale');
      expect(report.severity).toBe('high');
    });

    it('should detect loading state inconsistencies', () => {
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [],
        isLoading: true // UI loading but cache has data
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues).toContain('UI shows loading state but cache has data available');
      expect(report.recommendations).toContain('Update loading state logic to use cached data');
    });

    it('should detect error state inconsistencies', () => {
      const cacheState: CacheState = {
        agendaItems: [{ id: 1, title: 'Session 1' }],
        lastSync: new Date().toISOString()
      };

      const uiState: UIState = {
        sessions: [],
        hasError: true // UI shows error but cache has data
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues).toContain('UI shows error state but cache has valid data');
      expect(report.recommendations).toContain('Implement fallback to cached data on error');
    });

    it('should detect attendee count mismatches', () => {
      const cacheState: CacheState = {
        attendees: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      };

      const uiState: UIState = {
        attendees: [{ id: 1, name: 'John' }] // Different count
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues).toContain('Attendee count mismatch: cache=2, UI=1');
      expect(report.severity).toBe('high');
    });

    it('should detect future timestamps in agenda items', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const cacheState: CacheState = {
        agendaItems: [{
          id: 1,
          title: 'Future Session',
          date: futureDate.toISOString().split('T')[0],
          start_time: '09:00:00'
        }]
      };

      const uiState: UIState = {
        sessions: []
      };

      const report = service.validateCacheConsistency(cacheState, uiState);

      expect(report.isConsistent).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('future');
      expect(report.severity).toBe('critical');
    });
  });

  describe('determineSeverity', () => {
    it('should return low severity for no issues', () => {
      const report = service.validateCacheConsistency({}, {});
      expect(report.severity).toBe('low');
    });

    it('should return critical severity for future timestamps', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const cacheState: CacheState = { lastSync: futureTime };
      const uiState: UIState = {};

      const report = service.validateCacheConsistency(cacheState, uiState);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.severity).toBe('critical');
    });

    it('should return high severity for data mismatches', () => {
      const cacheState: CacheState = { agendaItems: [{ id: 1 }] };
      const uiState: UIState = { sessions: [] };

      const report = service.validateCacheConsistency(cacheState, uiState);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.severity).toBe('high');
    });
  });

  describe('filterDuplicateIssues', () => {
    it('should filter out recent duplicate issues', () => {
      const cacheState: CacheState = { agendaItems: [{ id: 1 }] };
      const uiState: UIState = { sessions: [] };

      // First check
      const report1 = service.validateCacheConsistency(cacheState, uiState);
      expect(report1.issues.length).toBeGreaterThan(0);

      // Immediate second check should filter duplicates
      const report2 = service.validateCacheConsistency(cacheState, uiState);
      expect(report2.issues).toEqual([]);
    });
  });

  describe('getConsistencyMetrics', () => {
    it('should calculate metrics for consistent reports', () => {
      const reports: ConsistencyReport[] = [
        { isConsistent: true, issues: [], timestamp: new Date().toISOString(), severity: 'low', recommendations: [] },
        { isConsistent: true, issues: [], timestamp: new Date().toISOString(), severity: 'low', recommendations: [] }
      ];

      const metrics = service.getConsistencyMetrics(reports);

      expect(metrics.totalChecks).toBe(2);
      expect(metrics.consistentChecks).toBe(2);
      expect(metrics.issueCount).toBe(0);
      expect(metrics.averageIssuesPerCheck).toBe(0);
    });

    it('should calculate metrics for mixed reports', () => {
      const reports: ConsistencyReport[] = [
        { isConsistent: true, issues: [], timestamp: new Date().toISOString(), severity: 'low', recommendations: [] },
        { isConsistent: false, issues: ['Issue 1'], timestamp: new Date().toISOString(), severity: 'medium', recommendations: [] },
        { isConsistent: false, issues: ['Issue 2', 'Issue 3'], timestamp: new Date().toISOString(), severity: 'high', recommendations: [] }
      ];

      const metrics = service.getConsistencyMetrics(reports);

      expect(metrics.totalChecks).toBe(3);
      expect(metrics.consistentChecks).toBe(1);
      expect(metrics.issueCount).toBe(3);
      expect(metrics.averageIssuesPerCheck).toBe(1);
      expect(metrics.severityBreakdown.low).toBe(1);
      expect(metrics.severityBreakdown.medium).toBe(1);
      expect(metrics.severityBreakdown.high).toBe(1);
    });

    it('should handle empty reports array', () => {
      const metrics = service.getConsistencyMetrics([]);

      expect(metrics.totalChecks).toBe(0);
      expect(metrics.consistentChecks).toBe(0);
      expect(metrics.averageIssuesPerCheck).toBe(0);
    });
  });

  describe('clearIssueHistory', () => {
    it('should clear issue history', () => {
      const cacheState: CacheState = { agendaItems: [{ id: 1 }] };
      const uiState: UIState = { sessions: [] };

      // Generate an issue
      service.validateCacheConsistency(cacheState, uiState);
      
      // Clear history
      service.clearIssueHistory();
      
      // Same issue should appear again
      const report = service.validateCacheConsistency(cacheState, uiState);
      expect(report.issues.length).toBeGreaterThan(0);
    });
  });
});
