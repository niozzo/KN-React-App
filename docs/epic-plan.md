# Conference Companion PWA - Epic Plan

**Version:** 1.1  
**Date:** December 19, 2024  
**Author:** Sarah (Product Owner)  
**Status:** ✅ **APPROVED** by Stakeholders  
**Last Updated:** Enhanced broadcast system, restored schedule management, added resource planning  
**Approval Date:** December 19, 2024  

## Overview

This document breaks down the Conference Companion PWA project into manageable epics following agile best practices and logical sequencing. Each epic delivers significant, end-to-end, fully deployable increments of testable functionality.

## Epic List (Logical Sequencing)

### Epic 1: Foundation & Core Infrastructure
*Establish project setup and basic PWA infrastructure*

### Epic 2: Core User Experience - Now/Next & Schedule  
*Deliver the primary glanceable interface and personalized schedule functionality*

### Epic 3: Networking & Discovery Features
*Enable meet list creation, attendee discovery, and overlap hints*

### Epic 4: Admin Tools & Real-time Communication
*Provide admin broadcast capabilities and real-time schedule updates*

### Epic 5: Sponsor Integration & Analytics
*Complete sponsor visibility features and analytics implementation*

### Epic 6: Polish, Privacy & Performance Optimization
*Finalize privacy controls, performance optimization, and A2HS onboarding*

### Epic 7: Conference Information & Support
*Provide essential conference information, feedback systems, and post-conference content access*

### Epic 8: Hardening the App
*Implement comprehensive testing, security hardening, and quality assurance measures to ensure production readiness.*

---

## Epic 1: Foundation & Core Infrastructure

**Goal:** Establish the foundational PWA infrastructure and basic project setup to support all subsequent features.

**Business Value:** Creates the technical foundation that enables all other features and ensures the application can be installed and work offline from day one.

**Stories:**

### Story 1.1: Project Setup & PWA Foundation
**As a** developer,  
**I want** to establish the basic PWA project structure with manifest, service worker, and offline caching,  
**so that** the application can be installed and work offline from day one.

**Acceptance Criteria:**
1. PWA manifest configured with proper icons, theme colors, and display mode
2. Service worker implemented with offline caching strategy
3. Basic offline page and error handling
4. A2HS (Add to Home Screen) functionality working
5. Project structure follows established patterns and includes CI/CD pipeline

### Story 1.2: Supabase Integration & Schema Setup
**As a** developer,  
**I want** to establish Supabase connection and define the core database schema,  
**so that** all subsequent features have a reliable data foundation.

**Acceptance Criteria:**
1. Supabase project configured with proper RLS policies
2. Core tables created: attendees, sessions, breakouts, dinners, seats, assignments
3. Authentication tables and user management setup
4. Database connection and basic CRUD operations working
5. Environment configuration for development/production

---

## Epic 2: Core User Experience - Now/Next & Schedule

**Goal:** Deliver the primary glanceable interface that shows current/next sessions and personalized schedule, providing the core value proposition.

**Business Value:** Provides the main value proposition - helping executives quickly know what's happening now and what's next with minimal taps.

**Stories:**

### Story 2.1: Now/Next Glance Card
**As an** attendee,  
**I want** to see my next session with countdown, room, and topic on the home screen,  
**so that** I can quickly know what's happening now and what's next.

**Acceptance Criteria:**
1. Shows next upcoming item based on current time and personal assignments
2. Displays countdown (minutes remaining), room, topic; updates on focus
3. Works offline using cached data; revalidates on network
4. Tapping opens full session detail with quick "Find my seat" if applicable
5. Handles edge cases: between sessions, last session of day, no assignments
6. Shows current session if active (Now card) + next session (Next card)
7. Countdown updates every minute; real-time updates on app focus
8. Integration with admin broadcast countdown timers

### Story 2.2: Personalized Schedule View
**As an** attendee,  
**I want** to view my combined schedule (general + breakouts + dinner + seat assignments),  
**so that** I have a complete view of my conference experience.

**Acceptance Criteria:**
1. Combines general agenda with identity-linked assignments from Supabase
2. Indicates assigned seat/table; supports dynamic timing updates from admin
3. Filter by day/track; minimal taps from home
4. Sticky day headers for navigation context
5. Progressive disclosure for seat maps and details

### Story 2.3: Seat Finder & Map Integration
**As an** attendee,  
**I want** to quickly find my main hall seat and dinner table,  
**so that** I can navigate the venue efficiently.

**Acceptance Criteria:**
1. Search by attendee name or my identity to highlight seat/table
2. Static map images with zoom/pan and highlight overlays
3. Works offline once assets cached
4. Integration with Now/Next card for quick access
5. Handles different session types (receptions, meals, presentations)

---

## Epic 3: Networking & Discovery Features

**Goal:** Enable attendees to discover and connect with other participants through the meet list functionality and attendee search.

**Business Value:** Facilitates networking and relationship building, which is a key value proposition for C-level executives at conferences.

**Stories:**

### Story 3.1: Attendee Search & Discovery
**As an** attendee,  
**I want** to search and filter other attendees by various criteria,  
**so that** I can find people I want to meet at the conference.

**Acceptance Criteria:**
1. Search/filter by name, company, role, interests, or free text search of bio
2. Respect discoverability opt-out settings
3. Display attendee profiles with relevant information
4. Integration with sponsor attendee discovery
5. Performance optimized for large attendee lists

### Story 3.2: Meet List Management
**As an** attendee,  
**I want** to build and manage a private list of people to meet,  
**so that** I can organize my networking goals.

**Acceptance Criteria:**
1. Add/remove attendees to/from private meet list
2. Tabbed interface: "All Attendees" and "My Meet List"
3. No sharing by default; completely private
4. Click-to-email functionality for contacts
5. Integration with attendee search and discovery

### Story 3.3: Overlap Hints & Networking Intelligence
**As an** attendee,  
**I want** to see overlap opportunities with people on my meet list,  
**so that** I can identify the best times to connect.

**Acceptance Criteria:**
1. Shows overlap hints: shared sessions, dinner table, break windows
2. Displays overlap information in attendee profiles
3. Contextual hints in meet list view
4. Integration with schedule and seat assignments
5. Clear indication when no overlaps exist

---

## Epic 4: Admin Tools & Real-time Communication

**Goal:** Provide admin capabilities for managing the conference and communicating with attendees in real-time.

**Business Value:** Enables conference organizers to manage the event effectively and communicate important updates to attendees.

**Stories:**

### Story 4.1: Admin Broadcast System
**As an** admin,  
**I want** to send broadcast messages to attendees,  
**so that** I can communicate important updates and timing changes.

**Acceptance Criteria:**
1. Broadcast composer with title, message, optional link, optional countdown timer
2. Countdown timer allows setting specific minutes (5, 10, 15, 30, 60) for break reminders
3. Target audience: all attendees (cohorting for later)
4. Web Push to installed users; in-app banners fallback
5. Delivery logging and impression measurement
6. Respects user notification consent settings
7. Countdown broadcasts show live countdown in app until event occurs

### Story 4.2: Schedule Management & Real-time Updates
**As an** admin,  
**I want** to update session times and rooms,  
**so that** attendees receive real-time schedule changes.

**Acceptance Criteria:**
1. Schedule manager interface for updating session times/rooms
2. Triggers client refresh for all connected users
3. Audit trail of last broadcast and schedule sync timestamps
4. Integration with Now/Next cards for immediate updates
5. Graceful handling of schedule conflicts
6. Bulk update capabilities for multiple sessions

### Story 4.3: Admin Dashboard & Analytics
**As an** admin,  
**I want** to monitor conference engagement and broadcast effectiveness,  
**so that** I can optimize the conference experience.

**Acceptance Criteria:**
1. Minimal event dashboard with key metrics
2. Daily adoption, A2HS, push, Now/Next views tracking
3. Meet List usage analytics
4. Broadcast delivery and impression reporting
5. Real-time monitoring of system health

---

## Epic 5: Sponsor Integration & Analytics

**Goal:** Complete sponsor visibility features and implement comprehensive analytics for measuring success.

**Business Value:** Provides sponsor value and enables measurement of success against defined KPIs.

**Stories:**

### Story 5.1: Sponsor Directory & Visibility ✅ **COMPLETE**
**As a** sponsor,  
**I want** to be discoverable through the directory and contextual badges,  
**so that** attendees can learn about my company.

**Acceptance Criteria (Completed):**
1. ✅ Sponsor directory with logo, name, URL
2. 🔄 Integration with attendee discovery flow (deferred to future story)
3. ✅ Real-time search filtering by sponsor name
4. 🔄 TDD unit tests (deferred to testing sprint)
5. 🔄 Integration tests (deferred to testing sprint)
6. 🔄 PWA testing (deferred to testing sprint)
7. 🔄 Performance testing (deferred to testing sprint)

**Implementation Summary:**
- Professional sponsor cards with centered logos
- Real-time search functionality
- Back-to-top button
- Responsive design
- Cache-first data loading from kn_cache_sponsors
- Team approved by PO, Architect, Developer, and QA

### Story 5.2: Analytics Implementation
**As a** product owner,  
**I want** comprehensive analytics tracking,  
**so that** I can measure success against defined KPIs.

**Acceptance Criteria:**
1. A2HS prompt view/accept tracking
2. Push permission prompt/accept tracking
3. Home Now/Next impressions and taps
4. Meet List create/add/remove tracking
5. Broadcast deliveries and impressions
6. Sponsor directory views and link clicks

### Story 5.3: Performance Monitoring & Optimization
**As a** developer,  
**I want** performance monitoring and optimization,  
**so that** the app meets all performance requirements.

**Acceptance Criteria:**
1. First contentful paint < 1.5s on 3G, < 1.0s on WiFi
2. Now/Next update < 1.0s on app resume
3. Battery efficiency monitoring
4. Offline functionality validation
5. Performance regression testing

---

## Epic 6: Polish, Privacy & Performance Optimization

**Goal:** Finalize privacy controls, complete A2HS onboarding, and ensure the application is production-ready.

**Business Value:** Ensures the application meets all quality, privacy, and performance requirements for production deployment.

**Stories:**

### Story 6.1: Privacy Controls & GDPR Compliance ✅ **COMPLETE**
**As a** user,  
**I want** to control my profile visibility and sign out securely,  
**so that** I have basic privacy controls over my information.

**Acceptance Criteria:**
1. ✅ Profile visibility toggle in Settings (default: visible)
2. ✅ Toggle disabled when offline with helpful message
3. ✅ Hidden profiles excluded from Bios page and never cached
4. ✅ Sign out functionality works
5. ✅ Changes sync to application database
6. ✅ Database changes via SQL script
7. ✅ Hidden profiles filtered at cache layer

**Status:** Deployed to production January 27, 2025

### Story 6.2: A2HS Onboarding & User Experience
**As a** user,  
**I want** clear guidance on installing the app and understanding its benefits,  
**so that** I can get the most value from the conference companion.

**Acceptance Criteria:**
1. A2HS prompt timing tuned for optimal conversion
2. Clear benefits microcopy explaining value
3. Onboarding flow for first-time users
4. Help documentation and troubleshooting
5. QR code and email distribution support

### Story 6.3: Final Polish & Production Readiness
**As a** stakeholder,  
**I want** the application to be production-ready with all quality gates met,  
**so that** it can be deployed for the conference.

**Acceptance Criteria:**
1. All acceptance criteria from previous epics met
2. KPIs instrumented and smoke dashboard available
3. Full test coverage and quality assurance
4. Performance benchmarks met
5. Security audit completed
6. Production deployment pipeline ready

---

## Epic 7: Conference Information & Support

**Goal:** Provide essential conference information, feedback systems, and post-conference content access to enhance the overall conference experience.

**Business Value:** Ensures attendees have access to critical information during the event, enables continuous improvement through feedback, and extends conference value beyond the live event.

**Stories:**

### Story 7.1: Basic Conference Information Hub
**As a** conference attendee,  
**I want** to access essential conference information like WiFi credentials, venue details, and emergency contacts,  
**so that** I can stay connected and informed throughout the event.

**Acceptance Criteria:**
1. WiFi information displayed with connection instructions
2. Venue floor plans and room locations accessible
3. Emergency contact information prominently displayed
4. Information accessible from main navigation menu
5. Basic information works offline
6. Push notification system for updates

### Story 7.2: Session Feedback System
**As a** conference attendee,  
**I want** to provide feedback on each session I attend,  
**so that** organizers can improve future events and I can help other attendees make informed choices.

**Acceptance Criteria:**
1. 1-5 star rating system for each session
2. Optional text field for detailed comments
3. Clear session identification
4. Anonymous feedback option
5. Feedback history accessible to users
6. Real-time submission with confirmation
7. Session context available during feedback

### Story 7.3: Post-Conference Content Hub
**As a** conference attendee,  
**I want** to access a centralized content hub after the conference,  
**so that** I can review session recordings, download presentations, access networking contacts, and continue learning from the conference content.

**Acceptance Criteria:**
1. Session recordings and slides accessible
2. Attendee directory with privacy controls
3. Resource library with sponsor materials
4. Search and filter functionality
5. Mobile responsive design
6. Offline download capability
7. Personal bookmarks system
8. Feedback system for future conferences

---

## Epic 8: Hardening the App

**Goal:** Implement comprehensive testing, security hardening, and quality assurance measures to ensure production readiness.

**Business Value:** Ensures the application meets all quality, security, and reliability standards for production deployment, providing confidence in system stability and user experience.

**Stories:**

### Story 8.1: Visual Regression Testing for UI Changes
**As a** developer,  
**I want** automated visual regression testing to catch unintended UI changes,  
**so that** the user interface remains consistent and functional across all updates.

**Acceptance Criteria:**
1. Visual regression testing framework integrated (e.g., Percy, Chromatic, or Playwright Visual)
2. Automated screenshot comparison for all major UI components
3. Baseline images captured for all supported viewport sizes (mobile, tablet, desktop)
4. Integration with CI/CD pipeline to run on every PR
5. Visual diff reporting with clear pass/fail indicators
6. Support for dynamic content and responsive design testing
7. Ability to update baselines when intentional changes are made
8. Coverage of critical user flows and edge cases
9. Performance impact monitoring to ensure tests don't slow down builds
10. Clear documentation for developers on how to handle visual test failures

### Story 8.2: Security Hardening & Vulnerability Assessment
**As a** security-conscious developer,  
**I want** comprehensive security measures and vulnerability scanning,  
**so that** the application is protected against common security threats.

**Acceptance Criteria:**
1. Dependency vulnerability scanning with automated updates
2. OWASP security headers implementation
3. Content Security Policy (CSP) configuration
4. Input validation and sanitization across all forms
5. Rate limiting on API endpoints
6. Security audit of authentication flows
7. Penetration testing of critical user paths
8. Security monitoring and alerting setup
9. Regular security dependency updates
10. Security documentation and incident response procedures

---

## Epic Dependencies & Sequencing

### Critical Dependencies
- **Epic 1** must complete before any other epic (foundation)
- **Epic 2** depends on Epic 1 (data infrastructure)
- **Epic 3** depends on Epic 2 (schedule data for overlaps)
- **Epic 4** can start after Epic 1 (admin tools independent)
- **Epic 5** depends on Epic 3 (sponsor integration with networking)
- **Epic 6** depends on all previous epics (final polish)
- **Epic 7** can start after Epic 1 (basic info independent), but feedback system depends on Epic 2 (session data)
- **Epic 8** can be implemented in parallel with other epics as hardening measures are applied throughout development

### Parallel Development Opportunities
- **Epic 4** (Admin Tools) can develop in parallel with Epic 2-3
- **Epic 5** (Sponsor Integration) can start after Epic 3 begins
- **Epic 6** (Polish) can begin final stories while Epic 5 completes
- **Epic 7** (Conference Info) can start after Epic 1, with basic info independent of other epics
- **Epic 8** (Hardening) can be implemented in parallel with other epics as quality measures are applied throughout development

### Timeline Considerations
- **Epic 1-2**: Critical path for core functionality (Weeks 1-2)
- **Epic 3-4**: Can develop in parallel after Epic 2 starts (Weeks 2-3)
- **Epic 5-6**: Final integration and polish phase (Week 4)
- **Epic 7**: Can develop in parallel with other epics (Weeks 1-4)
- **Epic 8**: Can be implemented in parallel with other epics throughout development

### Resource Requirements
- **Epic 1**: 1 full-stack developer (foundation work)
- **Epic 2**: 1 frontend developer + 1 backend developer (core UX)
- **Epic 3**: 1 frontend developer (networking features)
- **Epic 4**: 1 full-stack developer (admin tools)
- **Epic 5**: 1 frontend developer + analytics support (sponsor features)
- **Epic 6**: 1 full-stack developer + QA (polish and testing)
- **Epic 7**: 1 frontend developer (conference information features)
- **Epic 8**: 1 full-stack developer + QA specialist (hardening and testing)

---

## Success Metrics & KPIs

### Epic-Level Success Criteria
- **Epic 1**: PWA installable, offline capable, basic infrastructure ready
- **Epic 2**: Now/Next card functional, personalized schedule working
- **Epic 3**: Meet list creation, attendee discovery, overlap hints
- **Epic 4**: Admin broadcasts working, real-time updates functional
- **Epic 5**: Sponsor visibility, analytics tracking, performance targets met
- **Epic 6**: Production ready, privacy compliant, A2HS optimized
- **Epic 7**: Conference info accessible, feedback system functional, post-conference content available
- **Epic 8**: Visual regression testing implemented, security hardening complete, production-ready quality standards met

### Overall Project KPIs (from PRD)
- **Adoption**: ≥50% of non-Apax attendees use app >1×/day on both event days
- **Install**: A2HS 40–60% of visitors
- **Push**: 30–50% opt-in among A2HS users
- **Engagement**: ≥3 Now/Next views per user/day; ≥30% create a Meet List
- **Broadcast reach**: ≥80% see key broadcasts
- **Performance**: First contentful paint < 1.5s on 3G, < 1.0s on WiFi

---

## Next Steps

1. ✅ **Review and Approve Epic Plan** - **COMPLETED** - Stakeholder approval received
2. **Story Refinement** - Detailed story creation with acceptance criteria
3. **Architecture Planning** - Technical architecture for each epic
4. **Development Planning** - Sprint planning and resource allocation
5. **Risk Assessment** - Identify and mitigate epic-level risks

---

**Document Status:** ✅ **APPROVED**  
**Next Review Date:** As needed during development  
**Approval Status:** ✅ **COMPLETED** - All stakeholders approved
