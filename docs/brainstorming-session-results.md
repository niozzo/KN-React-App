# Brainstorming Session Results – AI-Powered Conference App (C‑Level Audience)

## Executive Summary

Purpose: Create a lightweight, high‑value conference companion app (PWA first) that helps busy C‑level attendees quickly know what’s next, where to be, and who to meet—without heavy phone use. The app demonstrates practical AI-enabled usefulness within a tight timeline and budget.

MVP focuses on two core pain areas:

- What’s Next/Where To Be: Personalized, glanceable schedule with dynamic nudges
- Networking/Meet List: Identify who to meet and when overlap windows occur

Delivery: PWA with Add to Home Screen, Supabase as source of truth, email/SMS OTP, offline caching, and battery-safe notifications. GDPR and Apax privacy alignment are first-class constraints.

Stretch: Web Push cohorting, ICS export, “Birds of a Feather” groups, and native iOS app for Live Activities.

Privacy: Link to and align with Apax Privacy Policy and GDPR requirements (consent, minimization, opt-out, DSAR readiness). Reference: [Apax Privacy Policy](https://www.apax.com/privacy-policy/).

Outcome: A pragmatic, low-friction app that attendees scarcely need, yet value when they do—achieving high perceived utility and showcasing meaningful AI progress.

---

## Context & Inputs

- Audience: ~250 C‑level executives from portfolio companies; annual event centered on AI
- Format: Networking evening; Day 1 plenary; hosted dinner + afterhours; Day 2 breakout sessions
- Data: Supabase (Seth’s schema) as the single source of truth (agenda, assignments)
- Constraints: Minimal budget; 4 solo efforts; late-October timeline; GDPR; privacy policy link
- Platform: PWA first (A2HS) to avoid App Store timing; possible native iOS later
- Notifications: Prefer schedule-driven nudges; avoid continuous location (battery-safe)

---

## Techniques Used

1) Five Whys – What’s Next/Where To Be
- Root causes (selected):
  - Lack of identity-linked personalization (breakouts, dinners, seats)
  - High-friction access (too many taps, scattered sources, not glanceable)
  - No real-time updates aligned to dynamic timing

2) Five Whys – Networking / Meet List
- Root causes (selected):
  - No low-friction “meet list” workflow with search/filter
  - Lack of identity-linked context (roles/interests/sessions/dinner tables)
  - No overlap computation and at-a-glance suggestions
- Privacy/GDPR flagged as a governing constraint

3) Morphological Analysis – Delivery & Notifications
- Platform: PWA (manifest + service worker) with A2HS
- Auth: Email OTP/magic link; optional SMS OTP if phone present
- Data: Supabase (identity-linked schedule/seating)
- Notifications: Web Push for installed users; in-app banners fallback; add-to-calendar optional
- Distribution: Pre-event email + QR signage/seat cards/monitors
- Offline: Cache agenda, seat maps, user’s schedule; revalidate on focus
- Maps: Static images with search/highlight for seat/table
- Networking: Discoverable-by-default within event (with opt-out), meet list is private to user

4) Impact × Effort – MVP vs. Stretch
- MVP: Core value delivery with minimal friction; stretch reserved for nice-to-haves

---

## MVP Feature Set (Final Cut)

- Now/Next glance card (home):
  - Personalized: shows your next item with countdown, room, topic
  - One-tap access; cached offline; quick “Find my seat” affordance

- Personalized schedule:
  - Combines general agenda + your breakouts + assigned dinner tables + seat
  - Reflects dynamic schedule adjustments (admin-controlled)

- Admin nudges (battery-safe):
  - “Break ends in 5,” “Session moved,” urgency nudges
  - Delivery via Web Push for installed users and in-app banners for others

- Seat finder:
  - Main room and dinner table lookup
  - Static map image(s) with search highlight

- Meet List (privacy-first):
  - Search/filter attendees (role/company/interests); add to private meet list
  - Overlap hints: shared sessions, dinner table, or break windows
  - Start contact via click-to-email; photos/LinkedIn omitted for MVP

- Access & distribution:
  - PWA with manifest/service worker; Add to Home Screen UX
  - Email and QR code distribution (flyers, seat cards, monitors)

- Authentication:
  - Email OTP/magic link; optional SMS OTP if phone present

- Battery & performance:
  - No continuous location; schedule-driven updates; offline caching of essentials

- Privacy & compliance:
  - Consent banner (discoverability and notifications)
  - Opt-out toggle for attendee discoverability
  - Data minimization; clear purpose; DSAR-ready posture
  - Link to [Apax Privacy Policy](https://www.apax.com/privacy-policy/)

---

## Stretch Items (Time Permitting)

- Web Push cohorting; richer segmentation; ICS export (“my items” bundle)
- “Birds of a Feather” (BoF) clusters and micro‑gatherings suggestions
- Native iOS app for Live Activities / advanced lock‑screen updates
- SMS OTP hardening (rate limiting, lockout flows); enhanced admin console

---

## Delivery & Architecture Choices

- PWA-first approach avoids App Store review timelines while enabling A2HS and Web Push (iOS 16.4+ after install)
- Supabase as source of truth; identity-linked assignments enable personalization
- Offline-first for agenda and seat maps; revalidate on focus for freshness
- Admin broadcast tools for just‑in‑time nudges; minimal dependency on location services

---

## Constraints & Policies

- Privacy & GDPR:
  - Consent for discoverability and notifications; clear purpose + opt-out
  - Data minimization, retention discipline, DSAR process readiness
  - App links to and aligns with the Apax Privacy Policy: [apax.com/privacy-policy](https://www.apax.com/privacy-policy/)

- Battery & UX:
  - No continuous GPS; schedule-driven updates; lightweight UI

- Operations:
  - Budget-conscious (free tiers where possible); simple deployment pipeline

---

## Idea Categorization

- Immediate Opportunities (MVP):
  - Now/Next card; personalized schedule; admin nudges; seat finder; meet list; OTP auth; PWA delivery; privacy banner

- Future Innovations (Near-term):
  - ICS export; push cohorting; BoF clustering; improved overlap UX

- Moonshots (Exploratory):
  - Computer-vision seating recognition; real-time proximity (opt-in, privacy-forward); live activity tiles via native app

---

## Action Plan

Top 3 priorities (Impact × Effort):
1) Personalized Now/Next + schedule (Supabase-identity linked)
2) Admin nudges + dynamic updates (push + in-app banners)
3) Meet List + overlap hints (sessions/tables/breaks) with email handoff

Immediate next steps:
- Confirm Supabase tables/fields for agenda, assignments, dinner tables, and attendees (incl. discoverability flag)
- Define OTP flows (email required; SMS optional where phone exists)
- Draft privacy/consent copy and add in-app link to [Apax Privacy Policy](https://www.apax.com/privacy-policy/)
- Prepare QR/email distribution plan; create A2HS guidance microcopy

Owner roles (suggested):
- Data & Auth: Supabase schema mapping + OTP setup
- Frontend PWA: Manifest, service worker, A2HS, offline caching, Now/Next UI
- Admin Console: Broadcast nudges and dynamic timing controls
- Compliance: GDPR review, consent flows, policy link and notices

---

## Reflection & Follow‑up

- Insight: High perceived value comes from “glanceability” + personalization + timeliness
- Risk: Data readiness and identity matching are critical path items
- Follow-up: Proceed to Market Research and Competitive Analysis to validate scope and positioning for exec audiences and conference app patterns


