/**
 * AttendeeCard Lazy Loading Tests
 * Tests for lazy loading behavior in AttendeeCard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AttendeeCard from '../../../components/attendee/AttendeeCard';
import * as useLazyImageModule from '../../../hooks/useLazyImage';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AttendeeCard - Lazy Loading', () => {
  const mockAttendee = {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    title: 'Software Engineer',
    company: 'TechCorp',
    photo: 'https://example.com/photo.jpg',
    sharedEvents: []
  };

  let mockUseLazyImage;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useLazyImage
    mockUseLazyImage = {
      ref: { current: null },
      isVisible: false,
      isLoading: false,
      hasLoaded: false,
      onLoad: vi.fn()
    };

    vi.spyOn(useLazyImageModule, 'useLazyImage').mockReturnValue(mockUseLazyImage);
  });

  describe('Image lazy loading behavior', () => {
    it('should not render image when not visible', () => {
      mockUseLazyImage.isVisible = false;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Image should not be in DOM
      const images = screen.queryAllByRole('img');
      expect(images.length).toBe(0);

      // Fallback icon should be visible
      const avatar = screen.getByText('👤');
      expect(avatar).toBeInTheDocument();
    });

    it('should render image when visible', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Image should be in DOM
      const image = screen.getByAltText('John Doe headshot');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockAttendee.photo);
    });

    it('should add loading="lazy" attribute to image', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      const image = screen.getByAltText('John Doe headshot');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should call onLoad when image loads', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      const image = screen.getByAltText('John Doe headshot');

      // Simulate image load
      image.dispatchEvent(new Event('load'));

      expect(mockUseLazyImage.onLoad).toHaveBeenCalledTimes(1);
    });

    it('should attach ref to avatar container', () => {
      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // useLazyImage should have been called
      expect(useLazyImageModule.useLazyImage).toHaveBeenCalled();

      // Verify it was called with correct options
      expect(useLazyImageModule.useLazyImage).toHaveBeenCalledWith({
        rootMargin: '200px',
        threshold: 0.01
      });
    });
  });

  describe('Loading states', () => {
    it('should show shimmer effect when loading', () => {
      mockUseLazyImage.isLoading = true;
      mockUseLazyImage.hasLoaded = false;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Check for shimmer div (has specific animation style)
      const shimmer = document.querySelector('[style*="shimmer"]');
      expect(shimmer).toBeInTheDocument();
    });

    it('should not show shimmer when loaded', () => {
      mockUseLazyImage.isLoading = false;
      mockUseLazyImage.hasLoaded = true;
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Shimmer should not be present
      const shimmer = document.querySelector('[style*="shimmer"]');
      expect(shimmer).not.toBeInTheDocument();
    });

    it('should not show shimmer when not loading', () => {
      mockUseLazyImage.isLoading = false;
      mockUseLazyImage.hasLoaded = false;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      const shimmer = document.querySelector('[style*="shimmer"]');
      expect(shimmer).not.toBeInTheDocument();
    });
  });

  describe('Fallback behavior', () => {
    it('should show fallback icon when no photo', () => {
      const attendeeNoPhoto = { ...mockAttendee, photo: null };

      renderWithRouter(<AttendeeCard attendee={attendeeNoPhoto} />);

      // Should show fallback icon
      const fallback = screen.getByText('👤');
      expect(fallback).toBeInTheDocument();

      // Should not try to render image
      const images = screen.queryAllByRole('img');
      expect(images.length).toBe(0);
    });

    it('should show fallback icon when image fails to load', async () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      const image = screen.getByAltText('John Doe headshot');

      // Simulate image error
      image.dispatchEvent(new Event('error'));

      // Image should be hidden
      await waitFor(() => {
        expect(image).toHaveStyle({ display: 'none' });
      });
    });

    it('should show fallback when photo is empty string', () => {
      const attendeeEmptyPhoto = { ...mockAttendee, photo: '' };

      renderWithRouter(<AttendeeCard attendee={attendeeEmptyPhoto} />);

      const fallback = screen.getByText('👤');
      expect(fallback).toBeInTheDocument();
    });
  });

  describe('Progressive loading simulation', () => {
    it('should transition from invisible to visible to loaded', async () => {
      const { rerender } = renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Initially not visible
      expect(screen.queryByRole('img')).not.toBeInTheDocument();

      // Becomes visible
      mockUseLazyImage.isVisible = true;
      mockUseLazyImage.isLoading = true;
      rerender(
        <BrowserRouter>
          <AttendeeCard attendee={mockAttendee} />
        </BrowserRouter>
      );

      // Image should now be present and loading
      expect(screen.getByAltText('John Doe headshot')).toBeInTheDocument();

      // Finishes loading
      mockUseLazyImage.isLoading = false;
      mockUseLazyImage.hasLoaded = true;
      rerender(
        <BrowserRouter>
          <AttendeeCard attendee={mockAttendee} />
        </BrowserRouter>
      );

      // Image should still be present, no shimmer
      expect(screen.getByAltText('John Doe headshot')).toBeInTheDocument();
    });
  });

  describe('Avatar container styling', () => {
    it('should have position relative for shimmer overlay', () => {
      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Find avatar container
      const avatar = screen.getByText('👤').parentElement;
      expect(avatar).toHaveStyle({ position: 'relative' });
    });
  });

  describe('Integration with other component features', () => {
    it('should preserve all attendee information display', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });

    it('should maintain card onClick behavior with lazy loading', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Card should still be clickable
      const card = screen.getByText('John Doe').closest('.attendee-card');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('should work with different attendee names', () => {
      const attendeeSpecialName = {
        ...mockAttendee,
        first_name: 'María José',
        last_name: "O'Brien-Smith"
      };

      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={attendeeSpecialName} />);

      const image = screen.getByAltText("María José O'Brien-Smith headshot");
      expect(image).toBeInTheDocument();
    });
  });

  describe('Performance considerations', () => {
    it('should only create one useLazyImage hook instance per card', () => {
      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      // Should be called exactly once
      expect(useLazyImageModule.useLazyImage).toHaveBeenCalledTimes(1);
    });

    it('should pass consistent options to useLazyImage', () => {
      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      expect(useLazyImageModule.useLazyImage).toHaveBeenCalledWith({
        rootMargin: '200px',
        threshold: 0.01
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper alt text for images', () => {
      mockUseLazyImage.isVisible = true;

      renderWithRouter(<AttendeeCard attendee={mockAttendee} />);

      const image = screen.getByAltText('John Doe headshot');
      expect(image).toHaveAttribute('alt', 'John Doe headshot');
    });

    it('should have proper fallback for screen readers when no photo', () => {
      const attendeeNoPhoto = { ...mockAttendee, photo: null };

      renderWithRouter(<AttendeeCard attendee={attendeeNoPhoto} />);

      // Fallback icon should still be present
      const fallback = screen.getByText('👤');
      expect(fallback).toBeInTheDocument();
    });
  });
});

