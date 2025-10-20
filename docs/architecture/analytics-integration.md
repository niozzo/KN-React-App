# Analytics Integration Documentation

## Overview

This document describes the Vercel Analytics integration implemented in the Conference Companion PWA. The analytics system tracks user behavior, PWA adoption metrics, and performance data to measure success against defined KPIs.

## Architecture

### Core Components

1. **Vercel Analytics Component** (`src/App.tsx`)
   - Automatically tracks page views and Core Web Vitals
   - Environment-aware (production vs development)
   - Integrated with React Router for navigation tracking

2. **Analytics Service** (`src/services/analyticsService.ts`)
   - Custom event tracking wrapper around Vercel Analytics
   - Unified tracking with existing monitoring service
   - GDPR-compliant (no PII, aggregate metrics only)
   - Offline event queuing for PWA compatibility

3. **Page-Level Tracking**
   - HomePage: Now/Next interactions, schedule CTA clicks
   - MeetPage: Attendee search, page views
   - SponsorsPage: Sponsor views, link clicks, profile interactions
   - SchedulePage: Session views, schedule interactions
   - InstallPrompt: A2HS prompts, conversions, dismissals

## Event Types

### PWA Events
- `a2hs_prompt_shown` - A2HS prompt displayed
- `a2hs_accepted` - User accepted A2HS prompt
- `a2hs_declined` - User declined A2HS prompt
- `a2hs_dismissed` - User dismissed A2HS prompt
- `push_permission_prompt_shown` - Push permission prompt displayed
- `push_permission_granted` - User granted push permission
- `push_permission_denied` - User denied push permission

### User Actions
- `now_next_tap` - Now/Next card interactions
- `now_next_impression` - Now/Next card views
- `schedule_item_view` - Schedule item interactions
- `schedule_cta_click` - Schedule CTA button clicks
- `attendee_search` - Attendee search queries
- `meet_list_create` - Meet list creation
- `meet_list_add` - Adding attendees to meet list
- `meet_list_remove` - Removing attendees from meet list

### Sponsor Interactions
- `sponsor_directory_view` - Sponsor directory page views
- `sponsor_profile_view` - Individual sponsor profile views
- `sponsor_link_click` - Sponsor website link clicks

### Conversions (KPIs)
- `a2hs_installed` - App installed via A2HS
- `push_opt_in` - Push notification opt-in
- `meet_list_created` - Meet list creation
- `first_sponsor_click` - First sponsor interaction

### Admin/Broadcast Events
- `broadcast_delivered` - Broadcast message delivery
- `broadcast_impression` - Broadcast message views
- `broadcast_action` - Broadcast message interactions

## Implementation Details

### Environment Configuration

```tsx
// Production: Full analytics tracking
<Analytics mode="production" />

// Development: Debug mode (console logs only)
<Analytics mode="development" />
```

### Event Tracking Examples

```typescript
import { analyticsService } from '../services/analyticsService';

// Track page view
analyticsService.trackPageView('home', {
  hasCurrentSession: true,
  hasNextSession: false,
  isOffline: false
});

// Track user action
analyticsService.trackUserAction('attendee_search', {
  searchTerm: 'john',
  resultsCount: 5,
  timestamp: Date.now()
});

// Track sponsor interaction
analyticsService.trackSponsorInteraction('sponsor_link_click', {
  sponsorId: 'sponsor_123',
  sponsorName: 'Acme Corp',
  linkType: 'website'
});

// Track conversion
analyticsService.trackConversion('a2hs_installed', {
  placement: 'home',
  isIOS: false,
  timestamp: Date.now()
});
```

### Development Testing

Enable analytics in development for testing:

```javascript
// In browser console
analyticsService.enableAnalytics();

// Check analytics summary
analyticsService.getAnalyticsSummary();

// Clear event queue
analyticsService.clearEventQueue();
```

## Data Privacy

### GDPR Compliance
- No personally identifiable information (PII) collected
- Aggregate metrics only
- Session IDs are randomly generated (not linked to user identity)
- Respects user privacy preferences

### Data Minimization
- Only essential metrics for KPI measurement
- No cross-site tracking
- No third-party data sharing beyond Vercel Analytics

## Available Analytics Data

### Automatic (Vercel Analytics)
- **Page Views**: Unique visitors, page views, session duration
- **Geographic Data**: Country/region breakdown
- **Device/Browser**: Device type, browser, screen resolution
- **Performance**: Core Web Vitals (LCP, FID, CLS)
- **Referrers**: Traffic sources

### Custom Events
- **PWA Adoption**: A2HS prompts, conversions, push opt-ins
- **User Engagement**: Feature usage, search patterns, interactions
- **Sponsor Effectiveness**: Directory views, link clicks, engagement
- **Admin Tools**: Broadcast delivery, message effectiveness

## Accessing Analytics

### Vercel Dashboard
1. Go to Vercel Dashboard → Your Project
2. Click "Analytics" tab
3. View real-time and historical data
4. Export reports for analysis

### Key Metrics to Monitor
- **A2HS Conversion Rate**: Target 40-60%
- **Push Opt-in Rate**: Target 30-50%
- **Now/Next Views**: Target ≥3 per user/day
- **Meet List Creation**: Target ≥30%
- **Sponsor Engagement**: Directory views and clicks

## Testing

### Local Development
```bash
# Enable analytics for testing
localStorage.setItem('analytics_enabled', 'true');

# Check console for debug logs
# Analytics events will show in console in development mode
```

### Production Verification
1. Deploy to Vercel
2. Check Vercel Analytics dashboard
3. Verify events are being tracked
4. Monitor real-time data

## Troubleshooting

### Common Issues

1. **Events not tracking in development**
   - Check if analytics is enabled: `analyticsService.getAnalyticsSummary()`
   - Enable with: `analyticsService.enableAnalytics()`

2. **Production events not appearing**
   - Verify Vercel Analytics is properly configured
   - Check network requests in browser dev tools
   - Ensure deployment is successful

3. **Performance impact**
   - Analytics service is optimized for minimal impact
   - Events are queued and batched
   - Offline events are stored and sent when online

### Debug Commands

```javascript
// Check analytics status
analyticsService.getAnalyticsSummary();

// Enable/disable analytics
analyticsService.enableAnalytics();
analyticsService.disableAnalytics();

// Clear event queue
analyticsService.clearEventQueue();
```

## Future Enhancements

### Planned Features
- Real-time analytics dashboard
- A/B testing integration
- Advanced conversion funnels
- User journey mapping
- Performance monitoring integration

### Story 5.2 Implementation
This analytics integration fulfills Story 5.2 requirements:
- ✅ A2HS prompt view/accept tracking
- ✅ Push permission prompt/accept tracking  
- ✅ Home Now/Next impressions and taps
- ✅ Meet List create/add/remove tracking
- ✅ Broadcast deliveries and impressions
- ✅ Sponsor directory views and link clicks

## Related Documentation

- [Story 5.2: Analytics Implementation](../stories/5.2.analytics-implementation.md)
- [PRD: Analytics and Measurement](../prd.md#9-analytics-and-measurement)
- [Monitoring Service](../src/services/monitoringService.ts)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
