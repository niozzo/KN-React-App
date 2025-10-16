/**
 * End-to-End Tests for Attendee Filtering
 * 
 * Tests the complete data flow from refresh operations to UI display
 * to ensure Bims (non-confirmed attendee) never appears in company attendees.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendeeDataProcessor } from '../../services/attendeeDataProcessor';
import { DataValidationService } from '../../services/dataValidationService';
import { pwaDataSyncService } from '../../services/pwaDataSyncService';
import { attendeeSyncService } from '../../services/attendeeSyncService';
import { offlineAttendeeService } from '../../services/offlineAttendeeService';
import type { Attendee } from '../../types/database';

// Mock dependencies
vi.mock('../../services/pwaDataSyncService', () => ({
  pwaDataSyncService: {
    syncAllData: vi.fn(),
    cacheTableData: vi.fn(),
    getCachedTableData: vi.fn()
  }
}));

vi.mock('../../services/attendeeSyncService', () => ({
  attendeeSyncService: {
    refreshAttendeeData: vi.fn()
  }
}));

vi.mock('../../services/offlineAttendeeService', () => ({
  offlineAttendeeService: {
    getAttendeesByCompany: vi.fn()
  }
}));

vi.mock('../../transformers/attendeeTransformer', () => ({
  AttendeeTransformer: vi.fn().mockImplementation(() => ({
    transformArrayFromDatabase: vi.fn((data) => data) // Pass through for testing
  }))
}));

vi.mock('../../services/attendeeCacheFilterService', () => ({
  AttendeeCacheFilterService: {
    filterAttendeesArray: vi.fn((data) => Promise.resolve(data)) // Pass through for testing
  }
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('Attendee Filtering End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Data Flow: Settings Refresh → BioPage Display', () => {
    it('should prevent Bims from appearing after settings page refresh', async () => {
      // Arrange - Simulate the complete flow from settings refresh to BioPage display
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          is_active: true,
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
          bio: 'Test bio',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        },
        {
          id: '2',
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // Non-confirmed - should be filtered out
          is_active: true,
          email: 'bims@aws.com',
          title: 'Product Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Step 1: Simulate settings page refresh (pwaDataSyncService.syncAllData)
      const mockPWADataSyncService = vi.mocked(pwaDataSyncService);
      mockPWADataSyncService.syncAllData.mockResolvedValue({
        success: true,
        syncedTables: ['attendees'],
        errors: []
      });

      // Step 2: Process data through AttendeeDataProcessor (happens in sync services)
      const processingResult = await AttendeeDataProcessor.processAttendeeData(mockAttendees);
      
      // Step 3: Validate processed data
      const validationResult = DataValidationService.validateCachedAttendees(processingResult.data);
      
      // Step 4: Simulate BioPage company attendees fetch
      const mockOfflineAttendeeService = vi.mocked(offlineAttendeeService);
      mockOfflineAttendeeService.getAttendeesByCompany.mockResolvedValue({
        data: processingResult.data.filter(attendee => 
          attendee.company === 'Amazon Web Services'
        ),
        count: processingResult.data.filter(attendee => 
          attendee.company === 'Amazon Web Services'
        ).length,
        error: null,
        success: true
      });

      // Act - Simulate the complete flow
      const companyAttendees = await mockOfflineAttendeeService.getAttendeesByCompany('Amazon Web Services');

      // Assert - Bims should be completely filtered out
      expect(processingResult.success).toBe(true);
      expect(processingResult.originalCount).toBe(2);
      expect(processingResult.filteredCount).toBe(1);
      expect(processingResult.data).toHaveLength(1);
      expect(processingResult.data[0].first_name).toBe('John');
      expect(processingResult.data.some(a => a.first_name === 'Bims')).toBe(false);

      // Validation should pass
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Company attendees should not include Bims
      expect(companyAttendees.success).toBe(true);
      expect(companyAttendees.data).toHaveLength(1);
      expect(companyAttendees.data[0].first_name).toBe('John');
      expect(companyAttendees.data.some(a => a.first_name === 'Bims')).toBe(false);
    });

    it('should handle background refresh consistently', async () => {
      // Arrange - Simulate background refresh scenario
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'Confirmed',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'confirmed',
          is_active: true,
          email: 'confirmed@test.com',
          title: 'Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        },
        {
          id: '2',
          first_name: 'Pending',
          last_name: 'User',
          company: 'Test Company',
          registration_status: 'pending', // Should be filtered out
          is_active: true,
          email: 'pending@test.com',
          title: 'Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act - Process through AttendeeDataProcessor (simulates background refresh)
      const processingResult = await AttendeeDataProcessor.processAttendeeData(mockAttendees);
      
      // Assert - Background refresh should apply same filtering
      expect(processingResult.success).toBe(true);
      expect(processingResult.originalCount).toBe(2);
      expect(processingResult.filteredCount).toBe(1);
      expect(processingResult.data).toHaveLength(1);
      expect(processingResult.data[0].first_name).toBe('Confirmed');
      expect(processingResult.data.some(a => a.first_name === 'Pending')).toBe(false);
    });

    it('should detect and alert on filtering bypasses', async () => {
      // Arrange - Simulate corrupted cache with Bims included
      const corruptedData: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          is_active: true,
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
          bio: 'Test bio',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        },
        {
          id: '2',
          first_name: 'Bims',
          last_name: 'Daniells',
          company: 'Amazon Web Services',
          registration_status: 'pending', // This should trigger validation failure
          is_active: true,
          email: 'bims@aws.com',
          title: 'Product Manager',
          bio: '',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act - Validate corrupted data
      const validationResult = DataValidationService.validateCachedAttendees(corruptedData);
      const bypassDetected = DataValidationService.detectFilteringBypasses(corruptedData);

      // Assert - Should detect filtering bypass
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors.some(error => error.includes('Bims'))).toBe(true);
      expect(bypassDetected).toBe(true);
    });
  });

  describe('Performance and Reliability Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange - Create large dataset with mixed confirmed/pending attendees
      const largeDataset: Attendee[] = Array.from({ length: 1000 }, (_, index) => ({
        id: `attendee-${index}`,
        first_name: `User${index}`,
        last_name: 'Test',
        company: 'Test Company',
        registration_status: index % 2 === 0 ? 'confirmed' : 'pending', // Half confirmed, half pending
        is_active: true,
        email: `user${index}@test.com`,
        title: 'Manager',
        bio: '',
        photo: '',
        salutation: 'Mr',
        business_phone: '',
        mobile_phone: '',
        address1: '',
        address2: '',
        postal_code: '',
        city: '',
        state: '',
        country: '',
        country_code: '',
        check_in_date: '',
        check_out_date: '',
        hotel_selection: '',
        custom_hotel: '',
        registration_id: '',
        has_spouse: false,
        spouse_details: {
          email: '',
          lastName: '',
          firstName: '',
          salutation: '',
          mobilePhone: '',
          dietaryRequirements: ''
        },
        dining_selections: {},
        selected_breakouts: [],
        access_code: '',
        attributes: {
          ceo: false,
          apaxIP: false,
          spouse: false,
          apaxOEP: false,
          speaker: false,
          cLevelExec: false,
          sponsorAttendee: false,
          otherAttendeeType: false,
          portfolioCompanyExecutive: false
        },
        dietary_requirements: '',
        assistant_name: '',
        assistant_email: '',
        idloom_id: '',
        last_synced_at: '',
        created_at: '',
        updated_at: '',
        is_cfo: false,
        is_apax_ep: false,
        primary_attendee_id: null,
        is_spouse: false,
        company_name_standardized: ''
      }));

      // Act
      const startTime = performance.now();
      const processingResult = await AttendeeDataProcessor.processAttendeeData(largeDataset);
      const validationResult = DataValidationService.validateCachedAttendees(processingResult.data);
      const endTime = performance.now();

      // Assert
      expect(processingResult.success).toBe(true);
      expect(processingResult.originalCount).toBe(1000);
      expect(processingResult.filteredCount).toBe(500); // Half should be filtered out
      expect(validationResult.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should maintain data integrity across multiple operations', async () => {
      // Arrange
      const mockAttendees: Attendee[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Amazon Web Services',
          registration_status: 'confirmed',
          is_active: true,
          email: 'john@aws.com',
          title: 'Senior Solutions Architect',
          bio: 'Test bio',
          photo: '',
          salutation: 'Mr',
          business_phone: '',
          mobile_phone: '',
          address1: '',
          address2: '',
          postal_code: '',
          city: '',
          state: '',
          country: '',
          country_code: '',
          check_in_date: '',
          check_out_date: '',
          hotel_selection: '',
          custom_hotel: '',
          registration_id: '',
          has_spouse: false,
          spouse_details: {
            email: '',
            lastName: '',
            firstName: '',
            salutation: '',
            mobilePhone: '',
            dietaryRequirements: ''
          },
          dining_selections: {},
          selected_breakouts: [],
          access_code: '',
          attributes: {
            ceo: false,
            apaxIP: false,
            spouse: false,
            apaxOEP: false,
            speaker: false,
            cLevelExec: false,
            sponsorAttendee: false,
            otherAttendeeType: false,
            portfolioCompanyExecutive: false
          },
          dietary_requirements: '',
          assistant_name: '',
          assistant_email: '',
          idloom_id: '',
          last_synced_at: '',
          created_at: '',
          updated_at: '',
          is_cfo: false,
          is_apax_ep: false,
          primary_attendee_id: null,
          is_spouse: false,
          company_name_standardized: ''
        }
      ];

      // Act - Simulate multiple operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(AttendeeDataProcessor.processAttendeeData(mockAttendees));
      }
      
      const results = await Promise.all(operations);

      // Assert - All operations should produce consistent results
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.filteredCount).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].first_name).toBe('John');
      });
    });
  });
});
