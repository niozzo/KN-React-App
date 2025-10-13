/**
 * Enhanced Attendee Search Service
 * Story 3.1: Attendee Search & Discovery
 * 
 * Extends existing OfflineAttendeeService with advanced search capabilities
 * including filtering, sorting, privacy controls, and sponsor integration
 */

import { OfflineAttendeeService } from './offlineAttendeeService';
import { pwaDataSyncService } from './pwaDataSyncService';
import { sponsorService } from './sponsorService';
import { 
  Attendee, 
  PaginatedResponse 
} from '../types/database';

export interface SearchFilters {
  query?: string;
  company?: string;
  role?: string;
  title?: string;
  showSharedEventsOnly?: boolean;
  sortBy?: 'last_name' | 'first_name' | 'company';
  sortOrder?: 'asc' | 'desc';
  includeSponsors?: boolean;
}

export interface SearchResult {
  attendees: Attendee[];
  totalCount: number;
  hasMore: boolean;
  searchTime: number;
  cached: boolean;
}

export class AttendeeSearchService {
  private offlineAttendeeService: OfflineAttendeeService;
  private searchCache = new Map<string, { data: Attendee[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.offlineAttendeeService = new OfflineAttendeeService();
  }

  /**
   * Enhanced search with multiple filters and sorting
   */
  async searchAttendees(filters: SearchFilters): Promise<SearchResult> {
    const startTime = performance.now();
    
    try {
      // Get all attendees from cache
      const allAttendees = await this.getAllAttendeesFromCache();
      
      if (!allAttendees || allAttendees.length === 0) {
        return {
          attendees: [],
          totalCount: 0,
          hasMore: false,
          searchTime: performance.now() - startTime,
          cached: false
        };
      }

      // Apply filters
      let filteredAttendees = this.applyFilters(allAttendees, filters);
      
      // Apply sorting
      filteredAttendees = this.applySorting(filteredAttendees, filters.sortBy, filters.sortOrder);
      
      // Apply privacy controls
      filteredAttendees = this.applyPrivacyControls(filteredAttendees);
      
      // Add sponsor integration if requested
      if (filters.includeSponsors) {
        filteredAttendees = await this.addSponsorContext(filteredAttendees);
      }

      const searchTime = performance.now() - startTime;
      
      // Cache results
      const cacheKey = this.generateCacheKey(filters);
      this.searchCache.set(cacheKey, {
        data: filteredAttendees,
        timestamp: Date.now()
      });

      return {
        attendees: filteredAttendees,
        totalCount: filteredAttendees.length,
        hasMore: false, // For now, return all results
        searchTime,
        cached: true
      };

    } catch (error) {
      console.error('❌ AttendeeSearchService.searchAttendees error:', error);
      return {
        attendees: [],
        totalCount: 0,
        hasMore: false,
        searchTime: performance.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Get all attendees from cache (PWA-first approach)
   */
  private async getAllAttendeesFromCache(): Promise<Attendee[]> {
    try {
      // Try PWA cache first
      const cachedData = await pwaDataSyncService.getCachedTableData<Attendee>('attendees');
      
      if (cachedData && cachedData.length > 0) {
        console.log(`📱 Using cached attendees data (${cachedData.length} records)`);
        return cachedData;
      }

      // Fallback to offline service
      const result = await this.offlineAttendeeService.getAllAttendees();
      return result.success ? result.data : [];
      
    } catch (error) {
      console.error('❌ Failed to get attendees from cache:', error);
      return [];
    }
  }

  /**
   * Apply search filters
   */
  private applyFilters(attendees: Attendee[], filters: SearchFilters): Attendee[] {
    let filtered = [...attendees];

    // Text search
    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase().trim();
      filtered = filtered.filter(attendee => 
        attendee.first_name?.toLowerCase().includes(query) ||
        attendee.last_name?.toLowerCase().includes(query) ||
        attendee.company?.toLowerCase().includes(query) ||
        attendee.title?.toLowerCase().includes(query) ||
        attendee.bio?.toLowerCase().includes(query)
      );
    }

    // Company filter
    if (filters.company && filters.company.trim()) {
      const company = filters.company.toLowerCase().trim();
      filtered = filtered.filter(attendee => 
        attendee.company?.toLowerCase().includes(company)
      );
    }

    // Role filter
    if (filters.role && filters.role.trim()) {
      const role = filters.role.toLowerCase().trim();
      filtered = filtered.filter(attendee => 
        attendee.title?.toLowerCase().includes(role)
      );
    }

    // Shared events filter
    if (filters.showSharedEventsOnly) {
      // TODO: Implement shared events logic when agenda integration is ready
      // For now, return all attendees
    }

    return filtered;
  }

  /**
   * Apply sorting
   */
  private applySorting(attendees: Attendee[], sortBy?: string, sortOrder?: string): Attendee[] {
    if (!sortBy) return attendees;

    const sorted = [...attendees].sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortBy) {
        case 'last_name':
          aValue = a.last_name || '';
          bValue = b.last_name || '';
          break;
        case 'first_name':
          aValue = a.first_name || '';
          bValue = b.first_name || '';
          break;
        case 'company':
          aValue = a.company || '';
          bValue = b.company || '';
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Apply privacy controls (discoverability opt-out)
   */
  private applyPrivacyControls(attendees: Attendee[]): Attendee[] {
    return attendees.filter(attendee => {
      // Check if attendee has opted out of discoverability
      // This would be based on the attendee's privacy settings
      // For now, return all attendees (privacy controls to be implemented)
      return true;
    });
  }

  /**
   * Add sponsor context to attendees
   */
  private async addSponsorContext(attendees: Attendee[]): Promise<Attendee[]> {
    try {
      // Get sponsor data
      const sponsorsResult = await sponsorService.getAllSponsors();
      if (!sponsorsResult.success) return attendees;

      // Add sponsor context to attendees
      return attendees.map(attendee => ({
        ...attendee,
        // Add sponsor information if attendee is associated with a sponsor
        sponsorContext: this.getSponsorContext(attendee, sponsorsResult.data)
      }));
    } catch (error) {
      console.error('❌ Failed to add sponsor context:', error);
      return attendees;
    }
  }

  /**
   * Get sponsor context for an attendee
   */
  private getSponsorContext(attendee: Attendee, sponsors: any[]): any {
    // TODO: Implement sponsor association logic
    // This would check if the attendee is associated with any sponsors
    return null;
  }

  /**
   * Generate cache key for search results
   */
  private generateCacheKey(filters: SearchFilters): string {
    return JSON.stringify(filters);
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get cached search results
   */
  getCachedResults(filters: SearchFilters): Attendee[] | null {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.searchCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.searchCache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Debounced search for performance optimization
   */
  debouncedSearch(filters: SearchFilters, delay: number = 300): Promise<SearchResult> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await this.searchAttendees(filters);
        resolve(result);
      }, delay);
    });
  }
}

// Export singleton instance
export const attendeeSearchService = new AttendeeSearchService();
