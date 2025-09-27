/**
 * Data Consistency Service
 * 
 * Validates consistency between cache data and UI state to detect
 * data synchronization issues and prevent UI inconsistencies.
 */

import { toMilliseconds, compareTimestamps, isValidTimestamp } from '../utils/timestampUtils.ts';

export interface ConsistencyReport {
  isConsistent: boolean;
  issues: string[];
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface UIState {
  sessions?: any[];
  attendees?: any[];
  sponsors?: any[];
  isLoading?: boolean;
  hasError?: boolean;
  lastUpdated?: string;
}

export interface CacheState {
  agendaItems?: any[];
  attendees?: any[];
  sponsors?: any[];
  lastSync?: string;
  syncStatus?: string;
}

export class DataConsistencyService {
  private readonly MAX_ISSUE_AGE = 5 * 60 * 1000; // 5 minutes
  private issueHistory: Map<string, number> = new Map();

  /**
   * Validate consistency between cache data and UI state
   */
  validateCacheConsistency(cacheState: CacheState, uiState: UIState): ConsistencyReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for data presence mismatches
    this.checkDataPresenceMismatch(cacheState, uiState, issues, recommendations);
    
    // Check for future timestamps
    this.checkFutureTimestamps(cacheState, uiState, issues, recommendations);
    
    // Check for stale data
    this.checkStaleData(cacheState, uiState, issues, recommendations);
    
    // Check for loading state inconsistencies
    this.checkLoadingStateInconsistencies(cacheState, uiState, issues, recommendations);
    
    // Check for error state inconsistencies
    this.checkErrorStateInconsistencies(cacheState, uiState, issues, recommendations);

    // Filter out recent duplicate issues
    const filteredIssues = this.filterDuplicateIssues(issues);

    // Determine severity based on filtered issues
    severity = this.determineSeverity(filteredIssues);

    return {
      isConsistent: filteredIssues.length === 0,
      issues: filteredIssues,
      timestamp: new Date().toISOString(),
      severity: severity,
      recommendations
    };
  }

  /**
   * Check for mismatches in data presence between cache and UI
   */
  private checkDataPresenceMismatch(
    cacheState: CacheState, 
    uiState: UIState, 
    issues: string[], 
    recommendations: string[]
  ): void {
    // Check agenda items vs sessions
    const cacheAgendaCount = cacheState.agendaItems?.length || 0;
    const uiSessionsCount = uiState.sessions?.length || 0;
    
    if (cacheAgendaCount > 0 && uiSessionsCount === 0 && !uiState.isLoading) {
      issues.push('Cache has agenda data but UI shows empty sessions');
      recommendations.push('Check session filtering logic and data transformation');
    }
    
    if (cacheAgendaCount === 0 && uiSessionsCount > 0) {
      issues.push('UI has sessions but cache is empty');
      recommendations.push('Verify cache storage and data persistence');
    }

    // Check attendees data
    const cacheAttendeesCount = cacheState.attendees?.length || 0;
    const uiAttendeesCount = uiState.attendees?.length || 0;
    
    if (cacheAttendeesCount !== uiAttendeesCount) {
      issues.push(`Attendee count mismatch: cache=${cacheAttendeesCount}, UI=${uiAttendeesCount}`);
      recommendations.push('Synchronize attendee data between cache and UI state');
    }
  }

  /**
   * Check for future timestamps in data
   */
  private checkFutureTimestamps(
    cacheState: CacheState, 
    uiState: UIState, 
    issues: string[], 
    recommendations: string[]
  ): void {
    const now = Date.now();
    
    // Check cache timestamps
    if (cacheState.lastSync) {
      if (!isValidTimestamp(cacheState.lastSync)) {
        issues.push('Cache contains invalid sync timestamp format');
        recommendations.push('Clear cache and re-sync data');
      } else {
        const comparison = compareTimestamps(cacheState.lastSync, now);
        if (comparison.isFuture) {
          issues.push('Cache contains future sync timestamp');
          recommendations.push('Clear cache and re-sync data');
        }
      }
    }

    // Check UI timestamps
    if (uiState.lastUpdated) {
      if (!isValidTimestamp(uiState.lastUpdated)) {
        issues.push('UI contains invalid update timestamp format');
        recommendations.push('Reset UI state and reload data');
      } else {
        const comparison = compareTimestamps(uiState.lastUpdated, now);
        if (comparison.isFuture) {
          issues.push('UI contains future update timestamp');
          recommendations.push('Reset UI state and reload data');
        }
      }
    }

    // Check agenda item timestamps
    if (cacheState.agendaItems) {
      const futureItems = cacheState.agendaItems.filter((item: any) => {
        if (item.date && item.start_time) {
          try {
            const startTime = `${item.date}T${item.start_time}`;
            if (isValidTimestamp(startTime)) {
              const comparison = compareTimestamps(startTime, now);
              return comparison.isFuture;
            }
          } catch (error) {
            // Invalid timestamp format
            return false;
          }
        }
        return false;
      });
      
      if (futureItems.length > 0) {
        issues.push(`Found ${futureItems.length} agenda items with future timestamps`);
        recommendations.push('Validate agenda item date/time data');
      }
    }
  }

  /**
   * Check for stale data based on age
   */
  private checkStaleData(
    cacheState: CacheState, 
    uiState: UIState, 
    issues: string[], 
    recommendations: string[]
  ): void {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    if (cacheState.lastSync) {
      const syncAge = now - new Date(cacheState.lastSync).getTime();
      if (syncAge > staleThreshold) {
        issues.push(`Cache data is stale (age: ${Math.round(syncAge / 60000)} minutes)`);
        recommendations.push('Refresh cache data or trigger background sync');
      }
    }

    if (uiState.lastUpdated) {
      const updateAge = now - new Date(uiState.lastUpdated).getTime();
      if (updateAge > staleThreshold) {
        issues.push(`UI data is stale (age: ${Math.round(updateAge / 60000)} minutes)`);
        recommendations.push('Refresh UI data or trigger state update');
      }
    }
  }

  /**
   * Check for loading state inconsistencies
   */
  private checkLoadingStateInconsistencies(
    cacheState: CacheState, 
    uiState: UIState, 
    issues: string[], 
    recommendations: string[]
  ): void {
    // UI shows loading but cache has data
    if (uiState.isLoading && cacheState.agendaItems && cacheState.agendaItems.length > 0) {
      issues.push('UI shows loading state but cache has data available');
      recommendations.push('Update loading state logic to use cached data');
    }

    // UI not loading but no data available
    if (!uiState.isLoading && (!cacheState.agendaItems || cacheState.agendaItems.length === 0) && 
        (!uiState.sessions || uiState.sessions.length === 0)) {
      issues.push('UI not loading but no data available');
      recommendations.push('Check data loading logic and error handling');
    }
  }

  /**
   * Check for error state inconsistencies
   */
  private checkErrorStateInconsistencies(
    cacheState: CacheState, 
    uiState: UIState, 
    issues: string[], 
    recommendations: string[]
  ): void {
    // UI shows error but cache has valid data
    if (uiState.hasError && cacheState.agendaItems && cacheState.agendaItems.length > 0) {
      issues.push('UI shows error state but cache has valid data');
      recommendations.push('Implement fallback to cached data on error');
    }

    // Cache sync failed but UI shows success
    if (cacheState.syncStatus === 'failed' && !uiState.hasError) {
      issues.push('Cache sync failed but UI shows success state');
      recommendations.push('Synchronize error states between cache and UI');
    }
  }

  /**
   * Determine severity level based on issues
   */
  private determineSeverity(issues: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.length === 0) return 'low';
    
    const criticalKeywords = ['future timestamp', 'future sync timestamp', 'future update timestamp', 'integrity check failed', 'critical error'];
    const highKeywords = ['data mismatch', 'sync failed', 'stale data', 'count mismatch', 'stale cache', 'stale ui', 'cache data is stale', 'ui data is stale', 'cache has agenda data', 'ui has sessions', 'attendee count mismatch'];
    const mediumKeywords = ['loading state', 'error state'];
    
    for (const issue of issues) {
      const lowerIssue = issue.toLowerCase();
      
      if (criticalKeywords.some(keyword => lowerIssue.includes(keyword))) {
        return 'critical';
      }
      
      if (highKeywords.some(keyword => lowerIssue.includes(keyword))) {
        return 'high';
      }
      
      if (mediumKeywords.some(keyword => lowerIssue.includes(keyword))) {
        return 'medium';
      }
    }
    return 'low';
  }

  /**
   * Filter out recent duplicate issues to prevent spam
   */
  private filterDuplicateIssues(issues: string[]): string[] {
    const now = Date.now();
    const filtered: string[] = [];
    
    for (const issue of issues) {
      const issueKey = issue.toLowerCase();
      const lastSeen = this.issueHistory.get(issueKey) || 0;
      
      if (now - lastSeen > this.MAX_ISSUE_AGE) {
        filtered.push(issue);
        this.issueHistory.set(issueKey, now);
      }
    }
    
    return filtered;
  }

  /**
   * Get consistency health metrics
   */
  getConsistencyMetrics(reports: ConsistencyReport[]): {
    totalChecks: number;
    consistentChecks: number;
    issueCount: number;
    severityBreakdown: Record<string, number>;
    averageIssuesPerCheck: number;
  } {
    const metrics = {
      totalChecks: reports.length,
      consistentChecks: 0,
      issueCount: 0,
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      averageIssuesPerCheck: 0
    };

    let totalIssues = 0;
    
    reports.forEach(report => {
      if (report.isConsistent) {
        metrics.consistentChecks++;
      }
      
      totalIssues += report.issues.length;
      metrics.issueCount += report.issues.length;
      metrics.severityBreakdown[report.severity]++;
    });

    metrics.averageIssuesPerCheck = reports.length > 0 ? totalIssues / reports.length : 0;
    
    return metrics;
  }

  /**
   * Clear issue history
   */
  clearIssueHistory(): void {
    this.issueHistory.clear();
  }
}

// Export singleton instance
export const dataConsistencyService = new DataConsistencyService();
