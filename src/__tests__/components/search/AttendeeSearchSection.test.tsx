/**
 * AttendeeSearchSection Component Tests
 * Story 3.1: Attendee Search & Discovery
 * 
 * Tests for the main search section component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AttendeeSearchSection from '../../../components/search/AttendeeSearchSection';
import { Attendee } from '../../../types/database';

// Mock the search hook
vi.mock('../../../hooks/useAttendeeSearch', () => ({
  useAttendeeSearch: vi.fn()
}));

describe('AttendeeSearchSection', () => {
  const mockUseAttendeeSearch = vi.fn();
  let mockSearchHook: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSearchHook = {
      searchResults: [],
      totalCount: 0,
      isLoading: false,
      error: null,
      searchTime: 0,
      isCached: false,
      searchQuery: '',
      filters: {
        showSharedEventsOnly: false,
        sortBy: 'last_name',
        sortOrder: 'asc',
        includeSponsors: false
      },
      setSearchQuery: vi.fn(),
      setFilters: vi.fn(),
      clearSearch: vi.fn(),
      hasActiveFilters: false,
      hasResults: false
    };

    mockUseAttendeeSearch.mockReturnValue(mockSearchHook);
    
    const { useAttendeeSearch } = await import('../../../hooks/useAttendeeSearch');
    vi.mocked(useAttendeeSearch).mockReturnValue(mockSearchHook);
  });

  it('should render search toggle button', () => {
    render(<AttendeeSearchSection />);
    
    expect(screen.getByText('Find People to Meet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find people to meet/i })).toBeInTheDocument();
  });

  it('should toggle search section when button is clicked', async () => {
    render(<AttendeeSearchSection />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    
    // Initially collapsed
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(toggleButton);
    
    // Should show search input
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('should handle search query changes', async () => {
    render(<AttendeeSearchSection />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'John' } });
    });
    
    expect(mockSearchHook.setSearchQuery).toHaveBeenCalledWith('John');
  });

  it('should display search results when available', async () => {
    const mockAttendees: Attendee[] = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        company: 'TechCorp',
        title: 'CTO',
        email: 'john@techcorp.com',
        bio: 'Technology leader',
        salutation: 'Mr.',
        business_phone: '+1-555-0123',
        mobile_phone: '+1-555-0124',
        address1: '123 Main St',
        address2: '',
        postal_code: '12345',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        country_code: 'US',
        check_in_date: '2024-10-20',
        check_out_date: '2024-10-22',
        hotel_selection: 'hotel-1',
        custom_hotel: '',
        registration_id: 'REG001',
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
        registration_status: 'confirmed',
        access_code: 'ACCESS001',
        attributes: {
          ceo: false,
          apaxIP: false,
          spouse: false,
          apaxOEP: false,
          speaker: true,
          cLevelExec: true,
          sponsorAttendee: false,
          otherAttendeeType: false,
          portfolioCompanyExecutive: false
        },
        dietary_requirements: '',
        assistant_name: '',
        assistant_email: '',
        idloom_id: 'IDLOOM001',
        last_synced_at: '2024-10-19T10:00:00Z',
        created_at: '2024-10-19T10:00:00Z',
        updated_at: '2024-10-19T10:00:00Z',
        is_cfo: false,
        is_apax_ep: false,
        primary_attendee_id: null,
        is_spouse: false,
        company_name_standardized: 'TechCorp',
        photo: ''
      }
    ];

    mockSearchHook.searchResults = mockAttendees;
    mockSearchHook.totalCount = 1;
    mockSearchHook.hasResults = true;

    render(<AttendeeSearchSection />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('1 person found')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display loading state', async () => {
    mockSearchHook.isLoading = true;

    render(<AttendeeSearchSection />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('should display error state', async () => {
    mockSearchHook.error = 'Search failed';

    render(<AttendeeSearchSection />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Search Error: Search failed')).toBeInTheDocument();
    });
  });

  it('should handle attendee selection', async () => {
    const onAttendeeSelect = vi.fn();
    const mockAttendee: Attendee = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      company: 'TechCorp',
      title: 'CTO',
      email: 'john@techcorp.com',
      bio: 'Technology leader',
      salutation: 'Mr.',
      business_phone: '+1-555-0123',
      mobile_phone: '+1-555-0124',
      address1: '123 Main St',
      address2: '',
      postal_code: '12345',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      country_code: 'US',
      check_in_date: '2024-10-20',
      check_out_date: '2024-10-22',
      hotel_selection: 'hotel-1',
      custom_hotel: '',
      registration_id: 'REG001',
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
      registration_status: 'confirmed',
      access_code: 'ACCESS001',
      attributes: {
        ceo: false,
        apaxIP: false,
        spouse: false,
        apaxOEP: false,
        speaker: true,
        cLevelExec: true,
        sponsorAttendee: false,
        otherAttendeeType: false,
        portfolioCompanyExecutive: false
      },
      dietary_requirements: '',
      assistant_name: '',
      assistant_email: '',
      idloom_id: 'IDLOOM001',
      last_synced_at: '2024-10-19T10:00:00Z',
      created_at: '2024-10-19T10:00:00Z',
      updated_at: '2024-10-19T10:00:00Z',
      is_cfo: false,
      is_apax_ep: false,
      primary_attendee_id: null,
      is_spouse: false,
      company_name_standardized: 'TechCorp',
      photo: ''
    };

    mockSearchHook.searchResults = [mockAttendee];
    mockSearchHook.totalCount = 1;
    mockSearchHook.hasResults = true;

    render(<AttendeeSearchSection onAttendeeSelect={onAttendeeSelect} />);
    
    const toggleButton = screen.getByRole('button', { name: /find people to meet/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      const attendeeCard = screen.getByRole('button', { name: /view profile for john doe/i });
      fireEvent.click(attendeeCard);
    });
    
    expect(onAttendeeSelect).toHaveBeenCalledWith(mockAttendee);
  });

  it('should apply custom className', () => {
    render(<AttendeeSearchSection className="custom-class" />);
    
    const searchSection = screen.getByRole('button', { name: /find people to meet/i }).closest('.attendee-search-section');
    expect(searchSection).toHaveClass('custom-class');
  });
});
