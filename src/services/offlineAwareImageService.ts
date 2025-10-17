/**
 * OfflineAwareImageService - Centralized image loading with offline fallbacks
 * Handles offline-aware image loading for attendee headshots, company logos, and other assets
 */

export class OfflineAwareImageService {
  private static instance: OfflineAwareImageService;
  
  static getInstance(): OfflineAwareImageService {
    if (!OfflineAwareImageService.instance) {
      OfflineAwareImageService.instance = new OfflineAwareImageService();
    }
    return OfflineAwareImageService.instance;
  }
  
  /**
   * Get image URL with offline fallback
   * @param originalUrl - Original image URL
   * @param fallbackUrl - Fallback image URL when offline
   * @returns Image URL (original if online, fallback if offline)
   */
  getImageUrl(originalUrl: string, fallbackUrl?: string): string {
    if (!navigator.onLine) {
      console.log('📱 Offline mode: Using fallback image');
      return fallbackUrl || '/assets/placeholder-avatar.png';
    }
    return originalUrl;
  }
  
  /**
   * Get attendee headshot URL with offline fallback
   * @param attendeeId - Attendee ID
   * @param photoUrl - Optional photo URL from attendee data
   * @returns Headshot URL with offline fallback
   */
  getHeadshotUrl(attendeeId: string, photoUrl?: string): string {
    // If we have a photo URL, use it with offline fallback
    if (photoUrl) {
      return this.getImageUrl(photoUrl, '/assets/placeholder-avatar.png');
    }
    
    // Generate Supabase storage URL
    const originalUrl = `https://iikcgdhztkrexuuqheli.supabase.co/storage/v1/object/public/attendee-headshots/${attendeeId}`;
    return this.getImageUrl(originalUrl, '/assets/placeholder-avatar.png');
  }
  
  /**
   * Get company logo URL with offline fallback
   * @param companyId - Company ID
   * @param logoUrl - Optional logo URL from company data
   * @returns Logo URL with offline fallback
   */
  getLogoUrl(companyId: string, logoUrl?: string): string {
    // If we have a logo URL, use it with offline fallback
    if (logoUrl) {
      return this.getImageUrl(logoUrl, '/assets/placeholder-logo.png');
    }
    
    // Generate Supabase storage URL
    const originalUrl = `https://iikcgdhztkrexuuqheli.supabase.co/storage/v1/object/public/company-logos/${companyId}`;
    return this.getImageUrl(originalUrl, '/assets/placeholder-logo.png');
  }
  
  /**
   * Get sponsor logo URL with offline fallback
   * @param sponsor - Sponsor object with logo and name
   * @returns Logo URL with offline fallback
   */
  getSponsorLogoUrl(sponsor: any): string {
    // If we have a logo URL, use it with offline fallback
    if (sponsor.logo && sponsor.logo.trim()) {
      return this.getImageUrl(sponsor.logo, '/assets/placeholder-logo.png');
    }
    
    // Generate Clearbit fallback URL
    const domainPart = sponsor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clearbitUrl = `https://logo.clearbit.com/${domainPart}.com`;
    return this.getImageUrl(clearbitUrl, '/assets/placeholder-logo.png');
  }
  
  /**
   * Check if we're currently offline
   * @returns True if offline, false if online
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }
  
  /**
   * Get offline status message
   * @returns Status message for offline state
   */
  getOfflineStatusMessage(): string {
    return this.isOffline() ? '📱 Offline mode: Using cached data and fallback images' : '🌐 Online: Loading fresh images';
  }
}

// Export singleton instance
export const offlineAwareImageService = OfflineAwareImageService.getInstance();
