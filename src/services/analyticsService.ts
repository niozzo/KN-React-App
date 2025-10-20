/**
 * Analytics Service
 * Comprehensive analytics tracking with Vercel Analytics integration
 * Story 5.2: Analytics Implementation
 */

import { track as vercelTrack } from '@vercel/analytics';
import { monitoringService } from './monitoringService';

// Type definitions for analytics events
export interface PWAMetadata {
  sessionId?: string;
  timestamp?: number;
}

export interface UserActionMetadata {
  sessionId?: string;
  timestamp?: number;
  sessionType?: string;
  itemId?: string;
  attendeeCount?: number;
  resultsCount?: number;
  searchType?: 'name' | 'self';
}

export interface SponsorMetadata {
  sponsorId?: string;
  linkType?: string;
}

export interface ConversionMetadata {
  sessionId?: string;
  timestamp?: number;
}

export interface BroadcastMetadata {
  broadcastId?: string;
  deliveryMethod?: string;
  actionType?: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private isProduction: boolean;
  private eventQueue: Array<{ event: string; metadata?: any }> = [];

  private constructor() {
    this.isProduction = import.meta.env.MODE === 'production';
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track PWA events (A2HS, push notifications)
   */
  trackPWAEvent(event: string, metadata?: PWAMetadata): void {
    const fullMetadata = {
      ...metadata,
      timestamp: metadata?.timestamp || Date.now(),
      sessionId: metadata?.sessionId || this.generateSessionId()
    };

    this.trackEvent('pwa_event', { event, ...fullMetadata });
    
    // Also track with monitoring service for unified logging
    monitoringService.trackUserAction(`pwa_${event}`, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track user actions (clicks, interactions, searches)
   */
  trackUserAction(action: string, metadata?: UserActionMetadata): void {
    const fullMetadata = {
      ...metadata,
      timestamp: metadata?.timestamp || Date.now(),
      sessionId: metadata?.sessionId || this.generateSessionId()
    };

    this.trackEvent('user_action', { action, ...fullMetadata });
    
    // Also track with monitoring service
    monitoringService.trackUserAction(action, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track sponsor interactions
   */
  trackSponsorInteraction(action: string, metadata?: SponsorMetadata): void {
    const fullMetadata = {
      ...metadata,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };

    this.trackEvent('sponsor_interaction', { action, ...fullMetadata });
    
    // Also track with monitoring service
    monitoringService.trackUserAction(`sponsor_${action}`, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track conversion events (KPIs)
   */
  trackConversion(type: string, metadata?: ConversionMetadata): void {
    const fullMetadata = {
      ...metadata,
      timestamp: metadata?.timestamp || Date.now(),
      sessionId: metadata?.sessionId || this.generateSessionId()
    };

    this.trackEvent('conversion', { type, ...fullMetadata });
    
    // Also track with monitoring service
    monitoringService.trackUserAction(`conversion_${type}`, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track broadcast events
   */
  trackBroadcast(action: string, metadata?: BroadcastMetadata): void {
    const fullMetadata = {
      ...metadata,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };

    this.trackEvent('broadcast', { action, ...fullMetadata });
    
    // Also track with monitoring service
    monitoringService.trackUserAction(`broadcast_${action}`, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track page views (manual tracking for specific pages)
   */
  trackPageView(pageName: string, metadata?: Record<string, any>): void {
    const fullMetadata = {
      ...metadata,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };

    this.trackEvent('page_view', { page: pageName, ...fullMetadata });
    
    // Also track with monitoring service
    monitoringService.trackUserAction(`page_view_${pageName}`, 'AnalyticsService', true, undefined, undefined, fullMetadata);
  }

  /**
   * Track errors with analytics context
   */
  trackError(error: Error, context?: Record<string, any>): void {
    const fullContext = {
      ...context,
      timestamp: Date.now(),
      sessionId: this.generateSessionId(),
      errorMessage: error.message,
      errorStack: error.stack
    };

    this.trackEvent('error', fullContext);
    
    // Also track with monitoring service
    monitoringService.trackError(error, {
      component: 'AnalyticsService',
      action: 'error_tracking',
      severity: 'medium',
      metadata: fullContext
    });
  }

  /**
   * Core tracking method
   */
  private trackEvent(eventType: string, metadata: Record<string, any>): void {
    // Only track in production or when explicitly enabled
    if (!this.isProduction && !this.isAnalyticsEnabled()) {
      console.log(`[Analytics Debug] ${eventType}:`, metadata);
      return;
    }

    try {
      // Track with Vercel Analytics
      vercelTrack(eventType, metadata);
      
      // Queue for offline processing if needed
      this.eventQueue.push({ event: eventType, metadata });
      
      // Trim queue to prevent memory issues
      if (this.eventQueue.length > 100) {
        this.eventQueue = this.eventQueue.slice(-50);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      monitoringService.trackError(error as Error, {
        component: 'AnalyticsService',
        action: 'track_event',
        severity: 'low'
      });
    }
  }

  /**
   * Check if analytics is enabled (for development testing)
   */
  private isAnalyticsEnabled(): boolean {
    return localStorage.getItem('analytics_enabled') === 'true';
  }

  /**
   * Generate a session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analytics summary for debugging
   */
  getAnalyticsSummary(): {
    isProduction: boolean;
    eventQueueLength: number;
    recentEvents: Array<{ event: string; metadata?: any }>;
  } {
    return {
      isProduction: this.isProduction,
      eventQueueLength: this.eventQueue.length,
      recentEvents: this.eventQueue.slice(-10)
    };
  }

  /**
   * Clear event queue
   */
  clearEventQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Enable analytics in development (for testing)
   */
  enableAnalytics(): void {
    localStorage.setItem('analytics_enabled', 'true');
    console.log('Analytics enabled for development testing');
  }

  /**
   * Disable analytics in development
   */
  disableAnalytics(): void {
    localStorage.setItem('analytics_enabled', 'false');
    console.log('Analytics disabled');
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

// Export convenience functions
export const trackPWAEvent = (event: string, metadata?: PWAMetadata) => 
  analyticsService.trackPWAEvent(event, metadata);

export const trackUserAction = (action: string, metadata?: UserActionMetadata) =>
  analyticsService.trackUserAction(action, metadata);

export const trackSponsorInteraction = (action: string, metadata?: SponsorMetadata) =>
  analyticsService.trackSponsorInteraction(action, metadata);

export const trackConversion = (type: string, metadata?: ConversionMetadata) =>
  analyticsService.trackConversion(type, metadata);

export const trackBroadcast = (action: string, metadata?: BroadcastMetadata) =>
  analyticsService.trackBroadcast(action, metadata);

export const trackPageView = (pageName: string, metadata?: Record<string, any>) =>
  analyticsService.trackPageView(pageName, metadata);

export const trackError = (error: Error, context?: Record<string, any>) =>
  analyticsService.trackError(error, context);

export const getAnalyticsSummary = () => analyticsService.getAnalyticsSummary();
export const clearEventQueue = () => analyticsService.clearEventQueue();
export const enableAnalytics = () => analyticsService.enableAnalytics();
export const disableAnalytics = () => analyticsService.disableAnalytics();
