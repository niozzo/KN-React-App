# Project Brief: Conference Companion PWA

## Executive Summary

Create a lightweight, high‑value conference companion PWA for ~250 professional attendees (majority iPhone) that makes it effortless to know what’s next/where to be and who to meet, while respecting privacy and battery. Data comes from Supabase; delivery is PWA with Add to Home Screen (A2HS). MVP focuses on glanceability, identity‑linked personalization, admin nudges, Meet List, and basic sponsor visibility. Align to the Apax Privacy Policy ([apax.com/privacy-policy](https://www.apax.com/privacy-policy/)) and GDPR.

## Problem Statement

Attendees struggle to quickly find personalized, just‑in‑time information (their next session, room, seat, dinners) and to connect with the right people during a crowded, tightly scheduled event. Printed agendas get lost; generic schedules aren’t personalized; and timing shifts. Existing tools are heavyweight or too clicky for in‑the‑moment needs.

## Proposed Solution

A glanceable, personalized companion PWA that:
- Surfaces Now/Next with countdown, room, and topic in one tap.
- Personalizes schedules using identity‑linked data (breakouts, dinners, seats).
- Provides admin broadcast nudges for “break ends in 5,” timing changes.
- Offers a private Meet List with overlap hints (shared sessions/tables/breaks) and click‑to‑email.
- Adds basic, unobtrusive sponsor visibility (directory, badges, optional home carousel).

## Target Users

- Primary: C‑level executives from portfolio companies.
- Secondary: Sponsors (attendees without booths); Apax investment professionals; event admin staff.

## Goals & Success Metrics

- Adoption: ≥50% of non‑Apax attendees use the app >1×/day on both event days.
- A2HS install rate: 40–60% of app visitors.
- Push opt‑in: 30–50% of A2HS users.
- Engagement: ≥3 Now/Next views per user/day; ≥30% create a Meet List.
- Broadcast reach: ≥80% of attendees see key broadcasts.
- Sponsor: Directory visits and badge impressions tracked (no profiling).

## MVP Scope

- Now/Next glance card (home): countdown, room, topic; offline cached.
- Personalized schedule: general + your breakouts + dinners + assigned seat.
- Admin nudges: broadcast messages for timing; push (installed users) + in‑app banners fallback.
- Seat finder: main hall and dinner tables; static map image(s) with search.
- Meet List (private): search/filter; add; overlap hints; click‑to‑email.
- Sponsor visibility (basic): directory (logo, blurb, URL), badges on relevant sessions/dinners, optional static home carousel below Now/Next.
- Platform: PWA with manifest + service worker; A2HS; offline caching.
- Auth: Email OTP/magic link; SMS OTP when phone available.

Out of scope for MVP: rich chat, continuous location/proximity, heavy gamification, complex sponsor activations.

## Post‑MVP Vision

- ICS export for “my items.”
- Birds‑of‑a‑Feather (BoF) suggestions and micro‑gatherings.
- Push cohorting/segmentation; sponsor enhancements.
- Native iOS app for Live Activities/advanced lock‑screen updates.

## Technical Considerations

- Data: Supabase as source of truth (attendees, sessions, breakouts, dinners, seats; identity‑linked assignments).
- PWA: manifest, service worker, offline caching, A2HS UX; iOS 16.4+ for web push (post‑install).
- Notifications: Web Push for installed users; in‑app banners fallback; add‑to‑calendar optional.
- Maps: static images with searchable highlights.
- Performance/battery: schedule‑driven updates; no continuous GPS.

## Constraints & Assumptions

- Budget/timeline: minimal spend; delivery by late October; 4 solo efforts.
- Privacy/GDPR: consent for discoverability and notifications; data minimization; opt‑out; DSAR‑ready; link to Apax Privacy Policy: [apax.com/privacy-policy](https://www.apax.com/privacy-policy/).
- Distribution: pre‑event email + QR signage/seat cards/monitors; A2HS guidance.
- Device mix: primarily iPhone; intermittent venue Wi‑Fi expected.
- Timezone: all attendees effectively share the same local timezone (use device current location); align reminders accordingly.

## Risks & Open Questions

- Adoption risk: A2HS and push opt‑in rates may be lower than targets.
- Data readiness: accuracy/timeliness of assignments in Supabase.
- Privacy perception: ensure clear, concise consent and easy opt‑out.
- Sponsor assets: confirm logos/blurbs/URLs; no tiers (all sponsors at same level).

Open Questions
- Any required sponsor pages beyond directory and badges?

## Appendices

- Inputs: brainstorming results, market research, competitive analysis.
- KPI instrumentation: A2HS prompt, push permission, Now/Next impressions, Meet List creation, broadcast impressions, sponsor directory visits.

## Next Steps

- Confirm Supabase table fields and identity links for personalization.
- Implement OTP auth (email first; SMS optional).
- Build Now/Next, schedule, admin broadcast, Meet List, seat finder, sponsor basics.
- Draft consent copy; add privacy link; ship A2HS onboarding microcopy.

PM Handoff
- This brief provides full context for PRD generation. Proceed to PRD creation, validating stories and acceptance criteria section‑by‑section with the user.
