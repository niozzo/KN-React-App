# Product Requirements Document (PRD): Conference Companion PWA (MVP)

## 1) Overview
- **Objective**: Deliver a glanceable, privacy‑respecting PWA that helps ~250 exec attendees know what's next/where to be and who to meet, with minimal taps and battery impact.
- **Platform**: PWA with A2HS; Supabase as source of truth; iOS 16.4+ web push post‑install; offline caching.
- **Constraints**: Minimal spend; delivery by late October; GDPR and Apax privacy alignment.

## 2) Goals and KPIs
- **Adoption**: ≥50% of non‑Apax attendees use app >1×/day on both event days.
- **Install**: A2HS 40–60% of visitors.
- **Push**: 30–50% opt‑in among A2HS users.
- **Engagement**: ≥3 Now/Next views per user/day; ≥30% create a Meet List.
- **Broadcast reach**: ≥80% see key broadcasts.
- **Sponsor**: Track directory visits and badge impressions (no profiling).

## 3) Target Users
- **Primary**: C‑level executives from portfolio companies.
- **Secondary**: Sponsors; Apax investment professionals; event admins.

## 4) In‑Scope (MVP)
- **Now/Next** glance card with countdown, room, topic; cached offline.
- **Personalized schedule**: general agenda + breakouts + dinners + assigned seat.
- **Admin broadcast nudges**: real‑time timing changes; push (installed) + in‑app banners.
- **Seat finder**: main hall and dinner tables; static map image(s) + search/highlight.
- **Meet List (private)**: search/filter; add; overlap hints; click‑to‑email.
- **Sponsor visibility (basic)**: directory + contextual badges.
- **Auth**: Email OTP/magic link; SMS OTP optional when phone present.
- **PWA**: manifest, service worker, offline caching, A2HS UX.
- **Privacy**: consent for discoverability and notifications; opt‑out; link to Apax Privacy Policy.

## 5) Out of Scope (MVP)
- Rich chat/messaging, continuous location/proximity, heavy gamification, complex sponsor activations, full matchmaking.

## 6) User Stories and Acceptance Criteria

### 6.1 Now/Next Card
- As an attendee, I see my next item (title, room, start time, countdown) on the home screen in one tap.
- Acceptance:
  - Shows next upcoming item based on current time and personal assignments.
  - Displays countdown (min remaining), room, topic; updates on focus.
  - Works offline using cached data; revalidates on network.
  - Tapping opens full session detail; includes quick "Find my seat" if applicable.

### 6.2 Personalized Schedule
- As an attendee, I view a single combined schedule (general + my breakouts + dinner + seat).
- Acceptance:
  - Combines agenda with identity‑linked assignments from Supabase.
  - Indicates assigned seat/table; supports dynamic timing updates from admin.
  - Filter by day/track; minimal taps from home.

### 6.3 Admin Broadcast Nudges
- As an admin, I send "break ends in n minutes" and schedule change alerts.
- Acceptance:
  - Sends Web Push to installed users with what n should be; shows in‑app banners fallback to all.
  - Broadcast creation includes target audience: all or cohort (simple filters allowed later).
  - Delivery logged; impressions measured; respects user notification consent.

### 6.4 Seat Finder
- As an attendee, I can quickly find my main hall seat and dinner table.
- Acceptance:
  - Search by attendee name or my identity to highlight seat/table on static map image(s).
  - Works offline once assets cached; zoom/pan; highlight overlays.

### 6.5 Meet List (Private)
- As an attendee, I build a private list of people to meet; app hints at overlaps.
- Acceptance:
  - Search/filter attendees by name, company, role, interests (where available), or free text search of bio. 
  - Add/remove to private list; no sharing by default.
  - Shows overlap hints: shared sessions, dinner table, or break windows.
  - Click‑to‑email link; no in‑app chat; honor discoverability opt‑out.

### 6.6 Sponsor Visibility (Basic)
- As a sponsor, I'm discoverable via directory and contextual badges.
- Acceptance:
  - Directory: logo, blurb, URL; impressions/clicks tracked.
  - Badges on relevant sessions/dinners; no profiling or targeting beyond context.

### 6.7 Authentication
- As an attendee, I sign in securely with minimal friction.
- Acceptance:
  - Email OTP/magic link; optional SMS OTP when phone is on file.
  - Session persisted; sign‑out flows; rate limits on OTP sends.

### 6.8 PWA and A2HS
- As a user, I can "install" to my home screen and receive push (iOS post‑install).
- Acceptance:
  - Valid manifest and service worker; A2HS prompt timing tuned; clear benefits microcopy.
  - Offline caching for home, schedule, seat maps; cache refresh on focus.

### 6.9 Privacy and Consent
- As a user, I control discoverability and notifications; understand data use.
- Acceptance:
  - Consent banner on first run for discoverability and notifications (separate toggles).
  - Discoverability toggle in settings; opt‑out respected across features.
  - Link to Apax Privacy Policy; DSAR process reference; data minimization applied.

## 7) Data and Integration
- **Source of truth (Supabase)**: attendees, sessions, breakouts, dinners, seats, assignments; discoverability flag.
- **Key joins**: user identity → assignments → personalized schedule, seat/table.
- **Caching**: agenda, personalized schedule, seat maps; revalidate on focus and app resume.
- **Auth data**: minimum needed identifiers; no unnecessary profile fields.

## 8) Non‑Functional Requirements
- **Performance**: First contentful paint fast on hotel Wi‑Fi; <1.0s Now/Next update on resume.
- **Battery**: No continuous GPS; schedule‑driven timers only.
- **Reliability**: App usable offline; graceful degradation on push.
- **Security**: OTP rate limiting; secure storage for tokens; HTTPS enforced.
- **Accessibility**: Large touch targets; high contrast; voiceover labels for key UI.

## 9) Analytics and Measurement
- **Events**:
  - A2HS prompt view/accept; push permission prompt/accept.
  - Home Now/Next impressions and taps.
  - Meet List create/add/remove; overlap hint views.
  - Broadcast deliveries and impressions.
  - Sponsor directory views and link clicks.
- **Dashboards**: Minimal event dashboard (daily adoption, A2HS, push, Now/Next views, Meet List usage).

## 10) Admin Tooling (MVP)
- **Broadcast composer**: title, message, optional link; audience = all (cohorting later).
- **Schedule manager**: update session times/rooms; triggers client refresh.
- **Audit**: last broadcast, last schedule sync timestamps.

## 11) UX Notes
- **Home**: Now/Next card; optional static sponsor carousel below.
- **Nav**: Home, Schedule, Meet, Seat, Sponsors, Settings.
- **Microcopy**: A2HS benefits; privacy/consent strings concise and plain‑English.

## 12) Risks and Mitigations
- **Adoption risk (A2HS/push)**: Strong onboarding microcopy; QR + email distribution; in‑app banners fallback.
- **Data readiness**: Early validation of Supabase schema; dry‑run imports; admin rehearsal.
- **Privacy perception**: Clear consent; discoverability default‑on with explicit opt‑out; no profiling.

## 13) Assumptions
- Single timezone for event (use device local).
- Majority iPhone; web push only post‑A2HS on iOS 16.4+.
- No external attendee data beyond Supabase for MVP.

## 14) Open Questions
- Do we need any sponsor pages beyond directory and badges?
- Any venue‑specific map assets or legends to include?
- Confirm which roles get SMS OTP enabled (if phone present).

## 15) Timeline & Milestones (high‑level)
- Week 1: Supabase schema confirm; OTP auth; manifest/SW; Now/Next prototype.
- Week 2: Personalized schedule; admin broadcast MVP; seat maps integration.
- Week 3: Meet List + overlap hints; sponsor basics; analytics events.
- Week 4: Polish, privacy copy, A2HS onboarding; admin rehearsal; content load.

## 16) Definition of Done (MVP)
- All acceptance criteria in Section 6 met.
- KPIs instrumented; smoke dashboard available.
- Privacy consent + policy link live; DSAR contact path documented.
- Admin can broadcast and adjust schedule; attendees can use core features offline.
