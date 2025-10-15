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
  });

  describe('Data Loading', () => {
    it('should load and display attendee data successfully', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        bio: 'Test bio content',
        photo: 'test-photo.jpg'
      };

      vi.mocked(attendeeSearchService.searchAttendees).mockResolvedValue({
        attendees: [mockAttendee]
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('CEO')).toBeInTheDocument();
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });
    });

    it('should handle attendee not found error', async () => {
      vi.mocked(attendeeSearchService.searchAttendees).mockResolvedValue({
        attendees: []
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Attendee not found/)).toBeInTheDocument();
      });
    });
  });

  describe('Company Integration', () => {
    it('should load company data when attendee has standardized company name', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio content',
        photo: 'test-photo.jpg'
      };

      const mockStandardizedCompany = {
        name: 'Test Company',
        logo: 'test-logo.png',
        website: 'https://testcompany.com',
        sector: 'Technology',
        subsector: 'Software',
        geography: 'North America',
        description: 'A test company description'
      };

      vi.mocked(attendeeSearchService.searchAttendees).mockResolvedValue({
        attendees: [mockAttendee]
      });

      vi.mocked(CompanyNormalizationService.getInstance).mockReturnValue({
        initialize: vi.fn(),
        normalizeCompanyName: vi.fn().mockReturnValue(mockStandardizedCompany)
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Technology • Software')).toBeInTheDocument();
        expect(screen.getByText('About Test Company')).toBeInTheDocument();
      });
    });

    it('should handle company normalization service errors gracefully', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio content',
        photo: 'test-photo.jpg'
      };

      vi.mocked(attendeeSearchService.searchAttendees).mockResolvedValue({
        attendees: [mockAttendee]
      });

      vi.mocked(CompanyNormalizationService.getInstance).mockReturnValue({
        initialize: vi.fn().mockRejectedValue(new Error('Service error')),
        normalizeCompanyName: vi.fn()
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Should still render attendee info even if company service fails
      });
    });

    it('should not display sector/subsector when values are "Not Applicable"', async () => {
      const mockAttendee = {
        id: 'test-attendee-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio content',
        photo: 'test-photo.jpg'
      };

      const mockStandardizedCompany = {
        name: 'Test Company',
        logo: 'test-logo.png',
        website: 'https://testcompany.com',
        sector: 'Not Applicable',
        subsector: 'Not Applicable',
        geography: 'North America',
        description: 'A test company description'
      };

      vi.mocked(attendeeSearchService.searchAttendees).mockResolvedValue({
        attendees: [mockAttendee]
      });

      vi.mocked(CompanyNormalizationService.getInstance).mockReturnValue({
        initialize: vi.fn(),
        normalizeCompanyName: vi.fn().mockReturnValue(mockStandardizedCompany)
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('About Test Company')).toBeInTheDocument();
        // Should NOT display "Not Applicable" values
        expect(screen.queryByText('Not Applicable')).not.toBeInTheDocument();
        expect(screen.queryByText('Not Applicable • Not Applicable')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle attendee search service errors', async () => {
      vi.mocked(attendeeSearchService.searchAttendees).mockRejectedValue(
        new Error('Search service error')
      );

      render(
        <BrowserRouter>
          <AuthProvider>
            <BioPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Search service error/)).toBeInTheDocument();
      });
    });
  });
});