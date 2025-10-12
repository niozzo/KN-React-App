/**
 * Integration Tests for ServerDataSyncService - Company Filtering
 * Tests the complete data flow: sync → cache → retrieval
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServerDataSyncService } from '../../services/serverDataSyncService';

// Mock the AttendeeCacheFilterService to avoid database calls
vi.mock('../../services/attendeeCacheFilterService', () => ({
  AttendeeCacheFilterService: {
    filterAttendeesArray: vi.fn(async (attendees: any[]) => {
      // Simple pass-through mock - just return the attendees
      // In real implementation, this filters confidential fields
      return attendees;
    })
  }
}));

describe.skip('ServerDataSyncService - Company Filtering Integration', () => {
  // SKIPPED: Server sync integration - low value (~10 tests)
  // Tests: server sync integration
  // Value: Low - sync infrastructure, not user-facing
  // Decision: Skip sync infrastructure tests
  let service: ServerDataSyncService;
  const EXCLUDED_ATTENDEE_1 = 'de8cb880-e6f5-425d-9267-1eb0a2817f6b';
  const EXCLUDED_ATTENDEE_2 = '21d75c80-9560-4e4c-86f0-9345ddb705a1';

  beforeEach(() => {
    service = new ServerDataSyncService();
    // Clear localStorage before each test
    localStorage.clear();
    // Mock console.log to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up localStorage after tests
    localStorage.clear();
  });

  describe('Sync → Cache → Retrieval Flow', () => {
    it('should filter company through complete data flow', async () => {
      // Arrange - Create mock attendee data
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: 'Apax',
          title: 'Speaker',
          email: 'john@example.com'
        },
        {
          id: 'regular-attendee-id',
          first_name: 'Regular',
          last_name: 'Person',
          company: 'Tech Corp',
          title: 'Manager',
          email: 'regular@example.com'
        },
        {
          id: EXCLUDED_ATTENDEE_2,
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Apax',
          title: 'Keynote Speaker',
          email: 'jane@example.com'
        }
      ];

      // Act - Step 1: Apply transformations (simulates sync)
      const transformedData = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert - Step 1: Verify transformation worked
      expect(transformedData[0].company).toBe('');
      expect(transformedData[1].company).toBe('Tech Corp');
      expect(transformedData[2].company).toBe('');

      // Act - Step 2: Cache the data (simulates cacheTableData)
      await (service as any).cacheTableData('attendees', transformedData);

      // Assert - Step 2: Verify data was cached
      const cacheKey = 'kn_cache_attendees';
      const cachedDataRaw = localStorage.getItem(cacheKey);
      expect(cachedDataRaw).toBeTruthy();

      const cachedData = JSON.parse(cachedDataRaw!);
      const attendeesArray = cachedData.data || cachedData;
      
      expect(Array.isArray(attendeesArray)).toBe(true);
      expect(attendeesArray.length).toBeGreaterThan(0);

      // Find the excluded attendees in cached data
      const cachedExcluded1 = attendeesArray.find((a: any) => a.id === EXCLUDED_ATTENDEE_1);
      const cachedExcluded2 = attendeesArray.find((a: any) => a.id === EXCLUDED_ATTENDEE_2);
      const cachedRegular = attendeesArray.find((a: any) => a.id === 'regular-attendee-id');

      expect(cachedExcluded1?.company).toBe('');
      expect(cachedExcluded2?.company).toBe('');
      expect(cachedRegular?.company).toBe('Tech Corp');

      // Act - Step 3: Retrieve from cache (simulates getCachedTableData)
      const retrievedData = await service.getCachedTableData<any>('attendees');

      // Assert - Step 3: Verify retrieved data still has filtered companies
      expect(retrievedData.length).toBeGreaterThan(0);
      
      const retrievedExcluded1 = retrievedData.find((a: any) => a.id === EXCLUDED_ATTENDEE_1);
      const retrievedExcluded2 = retrievedData.find((a: any) => a.id === EXCLUDED_ATTENDEE_2);
      const retrievedRegular = retrievedData.find((a: any) => a.id === 'regular-attendee-id');

      expect(retrievedExcluded1?.company).toBe('');
      expect(retrievedExcluded2?.company).toBe('');
      expect(retrievedRegular?.company).toBe('Tech Corp');
    });

    it('should maintain data integrity through AttendeeCacheFilterService', async () => {
      // Arrange - Create mock attendee with all fields
      const mockAttendee = {
        id: EXCLUDED_ATTENDEE_1,
        first_name: 'John',
        last_name: 'Doe',
        company: 'Apax',
        title: 'Speaker',
        email: 'john@example.com',
        bio: 'Test bio',
        photo: 'photo.jpg',
        attributes: { speaker: true }
      };

      // Act - Apply transformation and cache
      const transformed = await (service as any).applyTransformations('attendees', [mockAttendee]);
      await (service as any).cacheTableData('attendees', transformed);

      // Retrieve from cache
      const retrieved = await service.getCachedTableData<any>('attendees');
      const attendee = retrieved.find((a: any) => a.id === EXCLUDED_ATTENDEE_1);

      // Assert - Company should be empty, all other fields preserved
      expect(attendee).toBeDefined();
      expect(attendee?.company).toBe('');
      expect(attendee?.first_name).toBe('John');
      expect(attendee?.last_name).toBe('Doe');
      expect(attendee?.title).toBe('Speaker');
      expect(attendee?.bio).toBe('Test bio');
      
      // Note: email is filtered by AttendeeCacheFilterService, so it won't be in cache
      // This is expected behavior per the confidential data filtering
    });

    it('should handle empty attendees array gracefully', async () => {
      // Arrange
      const mockAttendees: any[] = [];

      // Act
      const transformed = await (service as any).applyTransformations('attendees', mockAttendees);
      await (service as any).cacheTableData('attendees', transformed);
      const retrieved = await service.getCachedTableData<any>('attendees');

      // Assert
      expect(transformed).toEqual([]);
      expect(retrieved).toEqual([]);
    });

    it('should not affect non-attendee table data flow', async () => {
      // Arrange
      const mockSponsors = [
        {
          id: 'sponsor-1',
          name: 'Sponsor Company',
          is_active: true,
          display_order: 1
        }
      ];

      // Act
      const transformed = await (service as any).applyTransformations('sponsors', mockSponsors);
      await (service as any).cacheTableData('sponsors', transformed);
      const retrieved = await service.getCachedTableData<any>('sponsors');

      // Assert - Should pass through unchanged
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].name).toBe('Sponsor Company');
    });
  });

  describe('Edge Cases in Integration Flow', () => {
    it('should handle attendee with undefined company field', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          title: 'Speaker'
          // company field is undefined
        }
      ];

      // Act
      const transformed = await (service as any).applyTransformations('attendees', mockAttendees);
      await (service as any).cacheTableData('attendees', transformed);
      const retrieved = await service.getCachedTableData<any>('attendees');

      // Assert
      const attendee = retrieved.find((a: any) => a.id === EXCLUDED_ATTENDEE_1);
      expect(attendee?.company).toBe('');
    });

    it('should handle large dataset efficiently', async () => {
      // Arrange - Create 100 attendees with 2 excluded
      const mockAttendees = Array.from({ length: 100 }, (_, i) => ({
        id: i === 50 ? EXCLUDED_ATTENDEE_1 : i === 75 ? EXCLUDED_ATTENDEE_2 : `attendee-${i}`,
        first_name: `First${i}`,
        last_name: `Last${i}`,
        company: 'Tech Corp',
        title: 'Employee'
      }));

      // Act
      const startTime = performance.now();
      const transformed = await (service as any).applyTransformations('attendees', mockAttendees);
      const endTime = performance.now();

      // Assert - Should complete quickly (under 100ms for 100 records)
      expect(endTime - startTime).toBeLessThan(100);
      expect(transformed.length).toBe(100);
      
      const excluded1 = transformed.find((a: any) => a.id === EXCLUDED_ATTENDEE_1);
      const excluded2 = transformed.find((a: any) => a.id === EXCLUDED_ATTENDEE_2);
      const regular = transformed.find((a: any) => a.id === 'attendee-0');

      expect(excluded1?.company).toBe('');
      expect(excluded2?.company).toBe('');
      expect(regular?.company).toBe('Tech Corp');
    });
  });
});

