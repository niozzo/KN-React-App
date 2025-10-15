/**
 * BioPage Component Tests
 * Testing Bio page enhancements: company card, collapsible bio, portrait size
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BioPage from '../../pages/BioPage';

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

// Mock components
vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children, ...props }) => <div data-testid="page-layout" {...props}>{children}</div>
}));

vi.mock('../../components/common/Card', () => ({
  default: ({ children, className, ...props }) => (
    <div data-testid="card" className={className} {...props}>{children}</div>
  )
}));

// Mock router
const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams]
  };
});

const mockAttendeeSearchService = vi.hoisted(() => ({
  searchAttendees: vi.fn()
}));

const mockCompanyNormalizationService = vi.hoisted(() => ({
  getInstance: vi.fn(() => ({
    initialize: vi.fn(),
    normalizeCompanyName: vi.fn()
  }))
}));

describe('BioPage Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set('id', 'test-attendee-id');
  });

  describe('Portrait Size', () => {
    it('should render portrait with 200x200px max dimensions', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        bio: 'Test bio content',
        photo: 'test-photo.jpg'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const avatar = screen.getByRole('img', { name: /john doe headshot/i });
        expect(avatar).toHaveStyle({
          maxWidth: '200px',
          maxHeight: '200px'
        });
      });
    });
  });

  describe('Bio Collapsible Functionality', () => {
    it('should render bio as collapsed by default', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        bio: 'This is a long bio that should be collapsed by default and show a show more button to expand the content when clicked.',
        photo: 'test-photo.jpg'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const bioText = screen.getByText(mockAttendee.bio);
        expect(bioText).toHaveClass('collapsed');
        expect(screen.getByText('Show more')).toBeInTheDocument();
      });
    });

    it('should toggle bio expansion when show more/less is clicked', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        bio: 'This is a long bio that should be collapsed by default and show a show more button to expand the content when clicked.',
        photo: 'test-photo.jpg'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const bioText = screen.getByText(mockAttendee.bio);
        expect(bioText).toHaveClass('collapsed');
      });

      // Click show more
      const showMoreButton = screen.getByText('Show more');
      fireEvent.click(showMoreButton);

      await waitFor(() => {
        const bioText = screen.getByText(mockAttendee.bio);
        expect(bioText).toHaveClass('expanded');
        expect(screen.getByText('Show less')).toBeInTheDocument();
      });

      // Click show less
      const showLessButton = screen.getByText('Show less');
      fireEvent.click(showLessButton);

      await waitFor(() => {
        const bioText = screen.getByText(mockAttendee.bio);
        expect(bioText).toHaveClass('collapsed');
        expect(screen.getByText('Show more')).toBeInTheDocument();
      });
    });
  });

  describe('Company Card', () => {
    it('should not show company card when no standardized company data', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: null,
        bio: 'Test bio',
        photo: 'test-photo.jpg'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      mockCompanyNormalizationService.getInstance().normalizeCompanyName.mockReturnValue(null);

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('card')).not.toHaveClass('sponsor-card');
      });
    });

    it('should show company card when standardized company data exists', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio',
        photo: 'test-photo.jpg'
      };

      const mockStandardizedCompany = {
        name: 'Test Company',
        logo: 'test-logo.jpg',
        website: 'https://testcompany.com',
        sector: 'Technology',
        subsector: 'Software',
        geography: 'US',
        description: 'Test company description'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      mockCompanyNormalizationService.getInstance().normalizeCompanyName.mockReturnValue(mockStandardizedCompany);

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const companyCard = screen.getByText(mockStandardizedCompany.name);
        expect(companyCard).toBeInTheDocument();
        expect(screen.getByText(mockStandardizedCompany.sector)).toBeInTheDocument();
        expect(screen.getByText(mockStandardizedCompany.subsector)).toBeInTheDocument();
        expect(screen.getByText(mockStandardizedCompany.geography)).toBeInTheDocument();
      });
    });

    it('should display sector and subsector badges correctly', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio',
        photo: 'test-photo.jpg'
      };

      const mockStandardizedCompany = {
        name: 'Test Company',
        logo: 'test-logo.jpg',
        website: 'https://testcompany.com',
        sector: 'Technology',
        subsector: 'Software',
        geography: 'US',
        description: 'Test company description'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      mockCompanyNormalizationService.getInstance().normalizeCompanyName.mockReturnValue(mockStandardizedCompany);

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check sector badge (should be first)
        const sectorBadge = screen.getByText(mockStandardizedCompany.sector);
        expect(sectorBadge).toBeInTheDocument();
        
        // Check subsector badge
        const subsectorBadge = screen.getByText(mockStandardizedCompany.subsector);
        expect(subsectorBadge).toBeInTheDocument();
      });
    });

    it('should handle company card expansion/collapse', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio',
        photo: 'test-photo.jpg'
      };

      const mockStandardizedCompany = {
        name: 'Test Company',
        logo: 'test-logo.jpg',
        website: 'https://testcompany.com',
        sector: 'Technology',
        subsector: 'Software',
        geography: 'US',
        description: 'This is a long company description that should be collapsed by default and show a show more button to expand the content when clicked.'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      mockCompanyNormalizationService.getInstance().normalizeCompanyName.mockReturnValue(mockStandardizedCompany);

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const companyDescription = screen.getByText(mockStandardizedCompany.description);
        expect(companyDescription).toHaveClass('collapsed');
        expect(screen.getByText('Show more')).toBeInTheDocument();
      });

      // Click show more for company description
      const showMoreButton = screen.getAllByText('Show more')[1]; // Second show more button (company)
      fireEvent.click(showMoreButton);

      await waitFor(() => {
        const companyDescription = screen.getByText(mockStandardizedCompany.description);
        expect(companyDescription).toHaveClass('expanded');
        expect(screen.getByText('Show less')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle attendee not found error', async () => {
      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: []
      });

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Attendee not found')).toBeInTheDocument();
      });
    });

    it('should handle company normalization service errors gracefully', async () => {
      const mockAttendee = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        title: 'CEO',
        company: 'Test Company',
        company_name_standardized: 'Test Company',
        bio: 'Test bio',
        photo: 'test-photo.jpg'
      };

      mockAttendeeSearchService.searchAttendees.mockResolvedValue({
        attendees: [mockAttendee]
      });

      mockCompanyNormalizationService.getInstance().normalizeCompanyName.mockImplementation(() => {
        throw new Error('Company normalization failed');
      });

      render(
        <BrowserRouter>
          <BioPage />
        </BrowserRouter>
      );

      // Should not crash and should not show company card
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Test Company')).not.toBeInTheDocument();
      });
    });
  });
});
