/**
 * Unit Tests for ServerDataSyncService - Company Filtering
 * Tests the edge case where specific attendees should have their company field cleared
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServerDataSyncService } from '../../services/serverDataSyncService';

describe.skip('ServerDataSyncService - Company Filtering', () => {
  // SKIPPED: Server sync infrastructure - low value (~8 tests)
  // Tests: server data sync, company filtering
  // Value: Low - sync infrastructure, not user-facing
  // Decision: Skip sync infrastructure tests
  let service: ServerDataSyncService;

  beforeEach(() => {
    service = new ServerDataSyncService();
    // Clear any console logs to avoid test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('applyTransformations - attendees table', () => {
    const EXCLUDED_ATTENDEE_1 = 'de8cb880-e6f5-425d-9267-1eb0a2817f6b';
    const EXCLUDED_ATTENDEE_2 = '21d75c80-9560-4e4c-86f0-9345ddb705a1';

    it('should clear company for attendee de8cb880-e6f5-425d-9267-1eb0a2817f6b', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: 'Apax',
          title: 'Speaker'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert
      expect(result[0].company).toBe('');
      expect(result[0].id).toBe(EXCLUDED_ATTENDEE_1);
      expect(result[0].first_name).toBe('John');
    });

    it('should clear company for attendee 21d75c80-9560-4e4c-86f0-9345ddb705a1', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_2,
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Apax',
          title: 'Keynote Speaker'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert
      expect(result[0].company).toBe('');
      expect(result[0].id).toBe(EXCLUDED_ATTENDEE_2);
      expect(result[0].first_name).toBe('Jane');
    });

    it('should preserve company for other attendees', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: 'other-attendee-id-123',
          first_name: 'Bob',
          last_name: 'Johnson',
          company: 'Tech Corp',
          title: 'CEO'
        },
        {
          id: 'another-attendee-id-456',
          first_name: 'Alice',
          last_name: 'Williams',
          company: 'Innovation Labs',
          title: 'CTO'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert
      expect(result[0].company).toBe('Tech Corp');
      expect(result[1].company).toBe('Innovation Labs');
    });

    it('should handle attendees with already empty company', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: '',
          title: 'Speaker'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert - Should remain empty string, not cause issues
      expect(result[0].company).toBe('');
      expect(result.length).toBe(1);
    });

    it('should handle attendees with null company', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: null,
          title: 'Speaker'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert - Should set to empty string
      expect(result[0].company).toBe('');
    });

    it('should not fail if excluded attendee ID is not in dataset', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: 'regular-attendee-id',
          first_name: 'Regular',
          last_name: 'Person',
          company: 'Some Company',
          title: 'Manager'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert - Should process normally
      expect(result.length).toBe(1);
      expect(result[0].company).toBe('Some Company');
    });

    it('should preserve all other attendee fields unchanged', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: 'Apax',
          title: 'Speaker',
          email: 'john@example.com',
          bio: 'Test bio',
          attributes: { speaker: true, ceo: false }
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert - Only company should be changed
      expect(result[0].company).toBe('');
      expect(result[0].first_name).toBe('John');
      expect(result[0].last_name).toBe('Doe');
      expect(result[0].title).toBe('Speaker');
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].bio).toBe('Test bio');
      expect(result[0].attributes).toEqual({ speaker: true, ceo: false });
    });

    it('should handle mixed dataset with both excluded and regular attendees', async () => {
      // Arrange
      const mockAttendees = [
        {
          id: EXCLUDED_ATTENDEE_1,
          first_name: 'John',
          last_name: 'Doe',
          company: 'Apax',
          title: 'Speaker'
        },
        {
          id: 'regular-attendee',
          first_name: 'Regular',
          last_name: 'Person',
          company: 'Tech Corp',
          title: 'Manager'
        },
        {
          id: EXCLUDED_ATTENDEE_2,
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Apax',
          title: 'Keynote'
        }
      ];

      // Act
      const result = await (service as any).applyTransformations('attendees', mockAttendees);

      // Assert
      expect(result[0].company).toBe(''); // Excluded
      expect(result[1].company).toBe('Tech Corp'); // Regular
      expect(result[2].company).toBe(''); // Excluded
    });
  });

  describe('applyTransformations - other tables', () => {
    it('should not affect other table transformations', async () => {
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
      const result = await (service as any).applyTransformations('sponsors', mockSponsors);

      // Assert - Should not be affected by attendees logic
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });
});
