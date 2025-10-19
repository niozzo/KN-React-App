/**
 * Unit Tests for OfflineAwareImageService
 * Tests Supabase image optimization and offline fallback functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineAwareImageService } from '../../services/offlineAwareImageService';

// Mock navigator.onLine
const mockNavigator = {
  onLine: true
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

describe('OfflineAwareImageService', () => {
  let service: OfflineAwareImageService;

  beforeEach(() => {
    service = OfflineAwareImageService.getInstance();
    mockNavigator.onLine = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getHeadshotUrl', () => {
    it('should use Supabase render endpoint with default parameters', () => {
      const result = service.getHeadshotUrl('test-attendee-id');
      
      expect(result).toContain('storage/v1/render/image/public/attendee-headshots/test-attendee-id');
      expect(result).toContain('width=80&height=80&quality=80&resize=cover');
    });

    it('should use custom parameters when provided', () => {
      const result = service.getHeadshotUrl('test-attendee-id', undefined, 250, 250, 90);
      
      expect(result).toContain('width=250&height=250&quality=90&resize=cover');
    });

    it('should use provided photo URL when available', () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const result = service.getHeadshotUrl('test-attendee-id', photoUrl);
      
      expect(result).toBe(photoUrl);
    });

    it('should return fallback when offline', () => {
      mockNavigator.onLine = false;
      const result = service.getHeadshotUrl('test-attendee-id');
      
      expect(result).toBe('/assets/placeholder-avatar.png');
    });

    it('should return fallback when offline with custom photo URL', () => {
      mockNavigator.onLine = false;
      const photoUrl = 'https://example.com/photo.jpg';
      const result = service.getHeadshotUrl('test-attendee-id', photoUrl);
      
      expect(result).toBe('/assets/placeholder-avatar.png');
    });
  });

  describe('getLogoUrl', () => {
    it('should use Supabase render endpoint with default parameters', () => {
      const result = service.getLogoUrl('test-company-id');
      
      expect(result).toContain('storage/v1/render/image/public/company-logos/test-company-id');
      expect(result).toContain('width=120&height=60&quality=85&resize=contain');
    });

    it('should use custom parameters when provided', () => {
      const result = service.getLogoUrl('test-company-id', undefined, 200, 100, 90);
      
      expect(result).toContain('width=200&height=100&quality=90&resize=contain');
    });

    it('should use provided logo URL when available', () => {
      const logoUrl = 'https://example.com/logo.png';
      const result = service.getLogoUrl('test-company-id', logoUrl);
      
      expect(result).toBe(logoUrl);
    });

    it('should return fallback when offline', () => {
      mockNavigator.onLine = false;
      const result = service.getLogoUrl('test-company-id');
      
      expect(result).toBe('/assets/placeholder-logo.png');
    });
  });

  describe('getSponsorLogoUrl', () => {
    it('should use provided sponsor logo URL', () => {
      const sponsor = {
        logo: 'https://example.com/sponsor-logo.png',
        name: 'Test Sponsor'
      };
      const result = service.getSponsorLogoUrl(sponsor);
      
      expect(result).toBe('https://example.com/sponsor-logo.png');
    });

    it('should use default parameters for sponsor logo', () => {
      const sponsor = {
        logo: '',
        name: 'Test Sponsor'
      };
      const result = service.getSponsorLogoUrl(sponsor);
      
      expect(result).toContain('logo.clearbit.com/testsponsor.com');
    });

    it('should use custom parameters when provided', () => {
      const sponsor = {
        logo: 'https://example.com/sponsor-logo.png',
        name: 'Test Sponsor'
      };
      const result = service.getSponsorLogoUrl(sponsor, 200, 100, 90);
      
      expect(result).toBe('https://example.com/sponsor-logo.png');
    });

    it('should generate Clearbit URL with custom parameters for fallback', () => {
      const sponsor = {
        logo: '',
        name: 'Test Sponsor'
      };
      const result = service.getSponsorLogoUrl(sponsor, 200, 100, 90);
      
      expect(result).toContain('logo.clearbit.com/testsponsor.com');
    });

    it('should return fallback when offline', () => {
      mockNavigator.onLine = false;
      const sponsor = {
        logo: 'https://example.com/sponsor-logo.png',
        name: 'Test Sponsor'
      };
      const result = service.getSponsorLogoUrl(sponsor);
      
      expect(result).toBe('/assets/placeholder-logo.png');
    });
  });

  describe('getImageUrl', () => {
    it('should return original URL when online', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const result = service.getImageUrl(originalUrl);
      
      expect(result).toBe(originalUrl);
    });

    it('should return fallback URL when offline', () => {
      mockNavigator.onLine = false;
      const originalUrl = 'https://example.com/image.jpg';
      const fallbackUrl = '/assets/fallback.png';
      const result = service.getImageUrl(originalUrl, fallbackUrl);
      
      expect(result).toBe(fallbackUrl);
    });

    it('should return default fallback when offline and no fallback provided', () => {
      mockNavigator.onLine = false;
      const originalUrl = 'https://example.com/image.jpg';
      const result = service.getImageUrl(originalUrl);
      
      expect(result).toBe('/assets/placeholder-avatar.png');
    });
  });

  describe('offline detection', () => {
    it('should detect online status correctly', () => {
      mockNavigator.onLine = true;
      expect(service.isOffline()).toBe(false);
      
      mockNavigator.onLine = false;
      expect(service.isOffline()).toBe(true);
    });

    it('should provide appropriate status message', () => {
      mockNavigator.onLine = true;
      expect(service.getOfflineStatusMessage()).toContain('Online');
      
      mockNavigator.onLine = false;
      expect(service.getOfflineStatusMessage()).toContain('Offline');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OfflineAwareImageService.getInstance();
      const instance2 = OfflineAwareImageService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
