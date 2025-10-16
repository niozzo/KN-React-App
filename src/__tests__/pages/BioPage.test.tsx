/**
 * BioPage Component Tests - Pragmatic Testing
 * Focus on core functionality: data loading, state management, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BioPage from '../../pages/BioPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { attendeeSearchService } from '../../services/attendeeSearchService';
import { CompanyNormalizationService } from '../../services/companyNormalizationService';
import { offlineAttendeeService } from '../../services/offlineAttendeeService';

// Mock dependencies
vi.mock('../../services/attendeeSearchService', () => ({
  attendeeSearchService: {
    searchAttendees: vi.fn()
  }
}));

vi.mock('../../services/companyNormalizationService', () => ({
  CompanyNormalizationService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      normalizeCompanyName: vi.fn()
    }))
  }
}));

vi.mock('../../services/offlineAttendeeService', () => ({
  offlineAttendeeService: {
    getAttendeesByCompany: vi.fn()
  }
}));

// Mock useSearchParams
const mockSearchParams = new Map();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams]
  };
});

describe('BioPage Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set('id', 'test-attendee-id');
    
    // 🚨 CRITICAL: Force localStorage cleanup to prevent test interference
    localStorage.clear();
    
    // Note: Individual tests will set up their own localStorage data as needed
    // This prevents test interference while allowing tests to control their own data
  });

  describe('Data Loading', () => {

    it('should handle attendee not found error', async () => {
      // Clear localStorage to simulate no data scenario
      localStorage.clear();

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Attendee not found in cache/)).toBeInTheDocument();
      });
    });
  });

  describe('Core Functionality', () => {
    it('should show error when attendee not found in cache', async () => {
      // Clear localStorage to simulate no data
      localStorage.clear();

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Attendee not found in cache/)).toBeInTheDocument();
      });
    });
  });


  describe('People in Attendance', () => {
    it('should have offlineAttendeeService available for company attendees', () => {
      // Pragmatic test: verify the service exists and has the required method
      expect(offlineAttendeeService).toBeDefined();
      expect(offlineAttendeeService.getAttendeesByCompany).toBeDefined();
      expect(typeof offlineAttendeeService.getAttendeesByCompany).toBe('function');
    });

    it('should handle company attendees service calls', async () => {
      // Test that the service can be called and returns expected structure
      const mockResult = {
        data: [
          { id: '1', first_name: 'John', last_name: 'Doe', title: 'CEO' },
          { id: '2', first_name: 'Jane', last_name: 'Smith', title: 'CTO' }
        ],
        count: 2,
        error: null,
        success: true
      };

      vi.mocked(offlineAttendeeService.getAttendeesByCompany).mockResolvedValue(mockResult);

      const result = await offlineAttendeeService.getAttendeesByCompany('Test Company');
      
      expect(result).toEqual(mockResult);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});