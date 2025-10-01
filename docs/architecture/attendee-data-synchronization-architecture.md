# Attendee Data Synchronization Architecture

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** IMPLEMENTATION READY  
**Branch:** `fix/conference-auth-personalization-sync`

## 🎯 **Problem Statement**

The `conference_auth` localStorage contains attendee personalization data (dining preferences, breakout session assignments) that drives the "Now Next" card personalization. However, this data becomes stale during periodic refreshes, breaking personalization accuracy.

## 🏗️ **Architectural Solution**

### **Phase 1: Enhanced PWA Data Sync Service**

#### **1.1 AttendeeSyncService Implementation**

```typescript
// src/services/attendeeSyncService.ts
import { BaseService } from './baseService';
import { getCurrentAttendeeData } from './dataService';
import { sanitizeAttendeeForStorage } from '../types/attendee';
import type { Attendee, SanitizedAttendee } from '../types/attendee';

export interface AttendeeSyncResult {
  success: boolean;
  attendee?: Attendee;
  error?: string;
  lastSync?: Date;
  syncVersion?: string;
}

export class AttendeeSyncError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'AttendeeSyncError';
  }
}

export class AttendeeSyncService extends BaseService {
  private readonly AUTH_KEY = 'conference_auth';
  private readonly SYNC_VERSION_KEY = 'attendee_sync_version';
  
  /**
   * Refresh attendee data from source and update conference_auth
   */
  async refreshAttendeeData(): Promise<AttendeeSyncResult> {
    try {
      console.log('🔄 Starting attendee data refresh...');
      
      const freshAttendeeData = await getCurrentAttendeeData();
      if (!freshAttendeeData) {
        return {
          success: false,
          error: 'No attendee data available'
        };
      }

      // Update conference_auth with fresh data
      await this.updateConferenceAuth(freshAttendeeData);
      
      // Emit change event for reactive updates
      this.emitAttendeeDataUpdated(freshAttendeeData);
      
      console.log('✅ Attendee data refreshed successfully');
      
      return {
        success: true,
        attendee: freshAttendeeData,
        lastSync: new Date(),
        syncVersion: this.getSyncVersion()
      };
      
    } catch (error) {
      console.error('❌ Failed to refresh attendee data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update conference_auth with fresh attendee data
   */
  private async updateConferenceAuth(attendeeData: Attendee): Promise<void> {
    try {
      const currentAuth = this.getCurrentAuth();
      const updatedAuth = {
        ...currentAuth,
        attendee: sanitizeAttendeeForStorage(attendeeData),
        lastUpdated: Date.now(),
        syncVersion: this.getSyncVersion(),
        attendeeDataVersion: attendeeData.updated_at || Date.now()
      };
      
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(updatedAuth));
      
      // Update sync version tracking
      this.updateSyncVersion();
      
    } catch (error) {
      throw new AttendeeSyncError('Failed to update conference_auth', error);
    }
  }

  /**
   * Get current attendee data from conference_auth
   */
  getCurrentAttendeeFromAuth(): Attendee | null {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      if (!authData) return null;
      
      const auth = JSON.parse(authData);
      return auth.attendee || null;
    } catch (error) {
      console.warn('⚠️ Failed to parse conference_auth:', error);
      return null;
    }
  }

  /**
   * Check if attendee data needs refresh based on TTL
   */
  shouldRefreshAttendeeData(ttlMinutes: number = 30): boolean {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      if (!authData) return true;
      
      const auth = JSON.parse(authData);
      const lastUpdated = auth.lastUpdated || 0;
      const ttlMs = ttlMinutes * 60 * 1000;
      
      return (Date.now() - lastUpdated) > ttlMs;
    } catch (error) {
      console.warn('⚠️ Failed to check attendee data TTL:', error);
      return true;
    }
  }

  /**
   * Get current authentication data
   */
  private getCurrentAuth(): any {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);
      return authData ? JSON.parse(authData) : {};
    } catch (error) {
      console.warn('⚠️ Failed to parse current auth data:', error);
      return {};
    }
  }

  /**
   * Get current sync version
   */
  private getSyncVersion(): string {
    return localStorage.getItem(this.SYNC_VERSION_KEY) || '1.0.0';
  }

  /**
   * Update sync version
   */
  private updateSyncVersion(): void {
    const currentVersion = this.getSyncVersion();
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    localStorage.setItem(this.SYNC_VERSION_KEY, newVersion);
  }

  /**
   * Emit attendee data updated event
   */
  private emitAttendeeDataUpdated(attendeeData: Attendee): void {
    const event = new CustomEvent('attendee-data-updated', {
      detail: {
        attendee: attendeeData,
        timestamp: Date.now(),
        syncVersion: this.getSyncVersion()
      }
    });
    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const attendeeSyncService = new AttendeeSyncService();
```

#### **1.2 Enhanced PWADataSyncService Integration**

```typescript
// src/services/pwaDataSyncService.ts - Add to existing class
export class PWADataSyncService extends BaseService {
  // ... existing code ...

  /**
   * Enhanced syncAllData to include attendee synchronization
   */
  async syncAllData(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('🔄 Starting comprehensive data sync...');
    
    // Existing sync logic
    const results = await super.syncAllData();
    
    // Add attendee data sync
    let attendeeSyncResult = null;
    try {
      attendeeSyncResult = await attendeeSyncService.refreshAttendeeData();
      console.log('✅ Attendee data sync completed:', attendeeSyncResult.success);
    } catch (error) {
      console.warn('⚠️ Attendee data sync failed:', error);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      ...results,
      attendeeDataSynced: attendeeSyncResult?.success || false,
      lastAttendeeSync: attendeeSyncResult?.lastSync || null,
      attendeeSyncError: attendeeSyncResult?.error || null,
      totalSyncDuration: duration,
      syncVersion: attendeeSyncResult?.syncVersion || 'unknown'
    };
  }

  /**
   * Check if attendee data needs refresh
   */
  shouldRefreshAttendeeData(): boolean {
    return attendeeSyncService.shouldRefreshAttendeeData();
  }
}
```

### **Phase 2: Event-Driven Architecture for Component Updates**

#### **2.1 Enhanced useSessionData Hook**

```javascript
// src/hooks/useSessionData.js - Add event-driven updates
export const useSessionData = (options = {}) => {
  // ... existing state and logic ...

  // Event-driven attendee data updates
  useEffect(() => {
    const handleAttendeeDataUpdate = (event) => {
      const { attendee, timestamp, syncVersion } = event.detail;
      console.log('🔄 Attendee data updated via event:', { timestamp, syncVersion });
      
      // Update local attendee state
      setAttendee(attendee);
      
      // Re-apply personalization with fresh attendee data
      if (allSessions.length > 0) {
        const personalizedSessions = filterSessionsForAttendee(allSessions, attendee);
        setSessions(personalizedSessions);
        
        // Update combined events with fresh personalization
        const updatedCombinedEvents = mergeAndSortEvents(
          personalizedSessions,
          diningOptions
        );
        setAllEvents(updatedCombinedEvents);
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    };

    // Listen for attendee data updates
    window.addEventListener('attendee-data-updated', handleAttendeeDataUpdate);
    
    return () => {
      window.removeEventListener('attendee-data-updated', handleAttendeeDataUpdate);
    };
  }, [allSessions, diningOptions]);

  // Enhanced periodic refresh with attendee data check
  const loadSessionData = useCallback(async () => {
    // ... existing logic ...
    
    // Check if attendee data needs refresh
    if (attendeeSyncService.shouldRefreshAttendeeData()) {
      console.log('🔄 Attendee data is stale, refreshing...');
      try {
        const attendeeResult = await attendeeSyncService.refreshAttendeeData();
        if (attendeeResult.success && attendeeResult.attendee) {
          setAttendee(attendeeResult.attendee);
        }
      } catch (error) {
        console.warn('⚠️ Failed to refresh attendee data:', error);
      }
    }
    
    // ... rest of existing logic ...
  }, [/* dependencies */]);

  // ... rest of existing hook logic ...
};
```

#### **2.2 Enhanced AuthContext Integration**

```typescript
// src/contexts/AuthContext.tsx - Add attendee sync integration
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ... existing state ...

  // Enhanced login with attendee sync
  const login = async (accessCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔄 Starting authentication process...')
      
      // Step 1: Authenticate with the auth service
      const authResult = await authenticateWithAccessCode(accessCode)
      
      if (!authResult.success || !authResult.attendee) {
        clearCachedData()
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        }
      }
      
      // Step 2: Sync data for offline use
      let syncResult = null
      try {
        syncResult = await serverDataSyncService.syncAllData()
        console.log('✅ Data sync completed:', syncResult)
      } catch (syncError) {
        console.warn('⚠️ Data sync error:', syncError)
      }
      
      // Step 3: Set authentication state
      setIsAuthenticated(true)
      setAttendee(authResult.attendee)
      
      // Step 4: Initialize attendee sync service
      try {
        await attendeeSyncService.refreshAttendeeData()
        console.log('✅ Attendee sync service initialized')
      } catch (attendeeError) {
        console.warn('⚠️ Attendee sync initialization failed:', attendeeError)
      }
      
      // Load attendee name
      const cachedName = await attendeeInfoService.getAttendeeName()
      setAttendeeName(cachedName)
      
      console.log('✅ Authentication successful!')
      return { success: true }
      
    } catch (err) {
      console.error('❌ Authentication error:', err)
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      }
    }
  }

  // Enhanced logout with attendee sync cleanup
  const logout = async (): Promise<void> => {
    try {
      setIsSigningOut(true)
      
      // Clear attendee sync service state
      try {
        // Clear any pending sync operations
        attendeeSyncService.clearSyncState?.()
      } catch (error) {
        console.warn('⚠️ Failed to clear attendee sync state:', error)
      }
      
      // Clear all cached data
      clearCachedData()
      
      // Reset authentication state
      setIsAuthenticated(false)
      setAttendee(null)
      setAttendeeName(null)
      
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  // ... rest of existing context logic ...
};
```

### **Phase 3: Comprehensive Error Handling and Fallback Strategies**

#### **3.1 Error Handling Service**

```typescript
// src/services/attendeeSyncErrorHandler.ts
export class AttendeeSyncErrorHandler {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;
  
  /**
   * Handle attendee sync errors with retry logic
   */
  static async handleSyncError(
    error: Error, 
    retryCallback: () => Promise<AttendeeSyncResult>
  ): Promise<AttendeeSyncResult> {
    console.error('❌ Attendee sync error:', error);
    
    // Check if error is retryable
    if (this.isRetryableError(error)) {
      return await this.retryWithBackoff(retryCallback);
    }
    
    // Non-retryable error - return fallback
    return this.getFallbackResult(error);
  }
  
  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ServiceUnavailableError'
    ];
    
    return retryableErrors.some(errorType => 
      error.name.includes(errorType) || error.message.includes(errorType)
    );
  }
  
  /**
   * Retry with exponential backoff
   */
  private static async retryWithBackoff(
    retryCallback: () => Promise<AttendeeSyncResult>
  ): Promise<AttendeeSyncResult> {
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        const result = await retryCallback();
        
        if (result.success) {
          console.log(`✅ Attendee sync succeeded on attempt ${attempt}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Attendee sync attempt ${attempt} failed:`, error);
      }
    }
    
    return this.getFallbackResult(new Error('Max retry attempts exceeded'));
  }
  
  /**
   * Get fallback result when sync fails
   */
  private static getFallbackResult(error: Error): AttendeeSyncResult {
    return {
      success: false,
      error: error.message,
      lastSync: null,
      syncVersion: 'fallback'
    };
  }
  
  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### **3.2 Fallback Strategies**

```typescript
// src/services/attendeeSyncFallback.ts
export class AttendeeSyncFallback {
  /**
   * Get fallback attendee data when sync fails
   */
  static getFallbackAttendeeData(): Attendee | null {
    try {
      // Try to get from conference_auth
      const authData = localStorage.getItem('conference_auth');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.attendee) {
          console.log('🔄 Using fallback attendee data from conference_auth');
          return auth.attendee;
        }
      }
      
      // Try to get from cache
      const cachedData = localStorage.getItem('kn_cache_attendees');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        const attendees = cache.data || cache;
        if (Array.isArray(attendees) && attendees.length > 0) {
          console.log('🔄 Using fallback attendee data from cache');
          return attendees[0]; // Use first attendee as fallback
        }
      }
      
      console.warn('⚠️ No fallback attendee data available');
      return null;
    } catch (error) {
      console.error('❌ Failed to get fallback attendee data:', error);
      return null;
    }
  }
  
  /**
   * Check if fallback data is stale
   */
  static isFallbackDataStale(maxAgeMinutes: number = 60): boolean {
    try {
      const authData = localStorage.getItem('conference_auth');
      if (!authData) return true;
      
      const auth = JSON.parse(authData);
      const lastUpdated = auth.lastUpdated || 0;
      const maxAgeMs = maxAgeMinutes * 60 * 1000;
      
      return (Date.now() - lastUpdated) > maxAgeMs;
    } catch (error) {
      console.warn('⚠️ Failed to check fallback data staleness:', error);
      return true;
    }
  }
}
```

#### **3.3 Enhanced Error Handling in useSessionData**

```javascript
// src/hooks/useSessionData.js - Add comprehensive error handling
export const useSessionData = (options = {}) => {
  // ... existing state ...

  // Enhanced loadSessionData with error handling
  const loadSessionData = useCallback(async () => {
    // ... existing logic ...
    
    // Try to refresh attendee data with error handling
    if (attendeeSyncService.shouldRefreshAttendeeData()) {
      try {
        const attendeeResult = await attendeeSyncService.refreshAttendeeData();
        
        if (attendeeResult.success && attendeeResult.attendee) {
          setAttendee(attendeeResult.attendee);
          console.log('✅ Attendee data refreshed successfully');
        } else {
          // Handle sync failure with fallback
          console.warn('⚠️ Attendee sync failed, using fallback data');
          const fallbackAttendee = AttendeeSyncFallback.getFallbackAttendeeData();
          if (fallbackAttendee) {
            setAttendee(fallbackAttendee);
          }
        }
      } catch (error) {
        console.error('❌ Attendee sync error:', error);
        
        // Use error handler for retry logic
        try {
          const errorResult = await AttendeeSyncErrorHandler.handleSyncError(
            error,
            () => attendeeSyncService.refreshAttendeeData()
          );
          
          if (errorResult.success && errorResult.attendee) {
            setAttendee(errorResult.attendee);
          } else {
            // Final fallback
            const fallbackAttendee = AttendeeSyncFallback.getFallbackAttendeeData();
            if (fallbackAttendee) {
              setAttendee(fallbackAttendee);
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback failed:', fallbackError);
          setError('Failed to load attendee data');
        }
      }
    }
    
    // ... rest of existing logic ...
  }, [/* dependencies */]);

  // ... rest of existing hook logic ...
};
```

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// src/services/__tests__/attendeeSyncService.test.ts
describe('AttendeeSyncService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should refresh attendee data successfully', async () => {
    // Mock getCurrentAttendeeData
    jest.spyOn(dataService, 'getCurrentAttendeeData').mockResolvedValue(mockAttendee);
    
    const result = await attendeeSyncService.refreshAttendeeData();
    
    expect(result.success).toBe(true);
    expect(result.attendee).toEqual(mockAttendee);
    expect(localStorage.getItem('conference_auth')).toBeTruthy();
  });

  it('should handle sync errors gracefully', async () => {
    jest.spyOn(dataService, 'getCurrentAttendeeData').mockRejectedValue(new Error('Network error'));
    
    const result = await attendeeSyncService.refreshAttendeeData();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
```

### **Integration Tests**
```typescript
// src/hooks/__tests__/useSessionData.integration.test.ts
describe('useSessionData Integration', () => {
  it('should update personalization when attendee data changes', async () => {
    const { result } = renderHook(() => useSessionData());
    
    // Simulate attendee data update event
    const updatedAttendee = { ...mockAttendee, selected_breakouts: ['new-breakout'] };
    const event = new CustomEvent('attendee-data-updated', {
      detail: { attendee: updatedAttendee }
    });
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.attendee).toEqual(updatedAttendee);
      expect(result.current.sessions).toHaveLength(1); // Should be filtered
    });
  });
});
```

## 📋 **Implementation Checklist**

- [ ] Create `AttendeeSyncService` with comprehensive data synchronization
- [ ] Enhance `PWADataSyncService` to include attendee data sync
- [ ] Implement event-driven architecture for component updates
- [ ] Add comprehensive error handling and fallback strategies
- [ ] Create unit tests for all services
- [ ] Create integration tests for hook behavior
- [ ] Update `useSessionData` hook with attendee sync integration
- [ ] Update `AuthContext` with attendee sync initialization
- [ ] Add error monitoring and logging
- [ ] Performance testing and optimization

## 🚀 **Deployment Strategy**

1. **Phase 1**: Deploy `AttendeeSyncService` with basic functionality
2. **Phase 2**: Add event-driven updates to components
3. **Phase 3**: Implement comprehensive error handling
4. **Phase 4**: Add monitoring and performance optimization

This architecture ensures robust, maintainable, and performant attendee data synchronization while solving the personalization staleness issue.
