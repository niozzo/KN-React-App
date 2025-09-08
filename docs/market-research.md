# Market Research Report: Conference Companion PWA (Professional Events, US)

## Executive Summary

Goal: Ensure the MVP is truly useful and identify any must‑have gaps or wow opportunities by learning from leading event and networking apps. Optimize for attendee utility (not monetization) for a 2.5‑day, ~250‑person professional event, majority iPhone, with Supabase as source of truth, PWA delivery, and GDPR compliance aligned with the Apax Privacy Policy ([apax.com/privacy-policy](https://www.apax.com/privacy-policy/)).

Key Findings (draft):
- Baseline table stakes: agenda, personalized schedule, reminders, simple maps, offline access, and push/banners.
- High‑value differentiators for exec audiences: Now/Next at a glance, identity‑linked personalization (breakouts, dinners, seats), admin broadcast nudges, low‑friction Meet List with overlap hints; clear privacy posture.
- Potential wow (low/med effort): A2HS install UX, ICS export for “my items,” Birds‑of‑a‑Feather suggestions (privacy‑respecting), cohort‑targeted nudges.
- Deprioritize for MVP: rich chat, heavy gamification, continuous location/proximity.

KPIs to validate impact: ≥50% of non‑Apax attendees install and use >1×/day on both event days; strong A2HS and push‑opt‑in rates.

---

## Research Objectives & Methodology

Objectives
- Validate MVP feature set vs industry norms; surface must‑have gaps and 1–2 wow opportunities.
- Optimize for usefulness and adoption (not monetization) with battery‑safe, privacy‑first delivery.
- Define measurement plan (A2HS, push opt‑in, usage of Now/Next and Meet List) for event success.

Key Questions
- What do leading event/networking apps provide that we might be missing?
- What drives the fastest path to value for time‑constrained execs (1–2 taps max)?
- How do we encourage install (A2HS), return usage, and responsible notifications?

Methodology
- Desk scan of conference/event platforms: Cvent Attendee Hub, Webex Events (Socio), Whova, Sched, Bizzabo, Hopin.
- Networking‑centric comparators: Brella, Grip, Swapcard; consumer ideation comparator: Lunchclub.
- Synthesize patterns into MVP/stage‑2 features; map to constraints (budget, timeline, privacy).

Limitations
- Event‑specific context; short timeline; no external attendee research in scope pre‑event.

---

## Market Overview

Definition & Scope
- Category: Conference companion PWA for professional events.
- Geography: US event (reusable yearly; venue rotates).
- Value chain: Attendee experience (primary), sponsor visibility (secondary), admin orchestration.

Adoption Focus (event‑specific, not revenue TAM)
- Target A2HS install rate: 40–60% of visitors.
- Push opt‑in among A2HS users: 30–50%.
- Daily active usage triggers: ≥3 Now/Next views per user/day.

Trends & Drivers (relevant)
- PWA maturity on iOS (16.4+ web push) enabling “install without App Store.”
- Privacy expectations rising; preference for opt‑in networking and minimal tracking.
- Event ops need real‑time flexibility (broadcast nudges, dynamic timing).

---

## Customer Analysis

Primary Segment: C‑level executives (portfolio company leaders)
- Jobs‑to‑be‑Done: “Tell me quickly what’s next and where,” “Help me discreetly meet the right people,” “Don’t waste my time.”
- Pain points: Printed agendas inaccessible in the moment; generic schedules; tight timelines; social friction; crowd size.

Secondary Segments
- Sponsors: Visibility basics (brand, presence), light discovery by attendees.
- Apax investment pros: Same needs; additional desire for orchestration and broadcast capabilities.

Usage Context
- Nearly all mobile; majority iPhone.
- Venue Wi‑Fi typical of conference hotels; design for intermittent connectivity.

---

## Competitive Landscape

Common Capabilities across event apps
- Agenda & personalized schedules; push reminders; session and map info; sponsor pages.
- Networking: search/filter attendees, meeting requests, matchmaking, chat.

Patterns to Emulate (exec‑optimized)
- Glanceable Now/Next card with countdown and room.
- Identity‑linked personalization (breakouts, dinners, assigned seats) from source of truth.
- Low‑friction Meet List (search/filter; private list; overlap hints like shared sessions/tables).
- Admin broadcasts for timing adjustments and “break ending soon.”
- Offline caching and minimal taps to common actions.

Patterns to Deprioritize for MVP
- Rich chat/messaging, heavy gamification, continuous location/proximity tracking.
- Complex sponsor gamification; expo hall booth scheduling (not in scope).

Comparator Set (for directional reference)
- Event platforms: Cvent Attendee Hub, Webex Events (Socio), Whova, Sched, Bizzabo, Hopin.
- Networking‑centric: Brella, Grip, Swapcard.
- Consumer ideation: Lunchclub (match intent and discovery cues).

---

## Constraints & Policies

- Budget & Timeline: Minimal spend; late‑October; 4 solo efforts.
- Platform: PWA first (manifest + service worker), Supabase as source of truth.
- Privacy & GDPR: Consent for discoverability and notifications; data minimization; opt‑out; DSAR readiness; align with and link to the Apax Privacy Policy: [apax.com/privacy-policy](https://www.apax.com/privacy-policy/).
- Battery: No continuous location; schedule‑driven updates; offline caching.

---

## Opportunity Assessment

Immediate Opportunities (MVP‑aligned)
- Now/Next card on home (countdown, room, topic) with one‑tap access.
- Personalized schedule (general + breakouts + dinners + assigned seats).
- Admin nudges (broadcasts) and dynamic schedule shifts.
- Seat finder (main hall + dinner tables) with static map image and search.
- Meet List (private): search/filter; add; overlap hints (shared sessions/tables/breaks); click‑to‑email.
- A2HS UX, email OTP (SMS optional), offline caching.

Potential Wow (within constraints)
- ICS export for “my items.”
- Birds‑of‑a-Feather suggestions (privacy‑respecting clustering on titles/companies/interests).
- Push cohorting (installed users) + banners fallback.

Out‑of‑Scope for MVP
- In‑app chat, proximity features, rich sponsor gamification.

---

## Strategic Recommendations

- Stay ruthless on “glanceability” and minimal taps; design Now/Next to be the primary entry point.
- Implement identity‑linked personalization via Supabase (assignments drive value perception).
- Ship admin broadcast tooling early; test timing nudges in controlled windows.
- Make A2HS a first‑session goal with clear benefits; provide microcopy and QR onboarding.
- Treat privacy as a UX feature: concise consent copy; easy discoverability opt‑out; link policy.
- Plan stretch scope only after MVP telemetry confirms adoption (ICS export, BoF, cohort pushes).

---

## KPIs & Measurement Plan

Primary Event KPIs
- Install/adoption: ≥50% of non‑Apax attendees use app >1×/day on both days.
- A2HS install rate: target 40–60% of visitors.
- Push opt‑in: 30–50% of A2HS users.
- Feature engagement: ≥3 Now/Next views per user/day; ≥30% create a Meet List.
- Broadcast reach: ≥80% of attendees see key broadcasts.

Instrumentation Notes
- Track A2HS prompt views/accepts, push permission prompts, Now/Next impressions/actions, Meet List creations, broadcast impressions, and schedule syncs.

---

## Appendices

Data Sources
- Internal: Supabase (attendees, sessions, breakouts, dinners, seats; identity‑linked assignments).
- External desk research: Platform docs and public materials for Cvent, Webex Events (Socio), Whova, Sched, Bizzabo, Hopin; networking comparators Brella, Grip, Swapcard; ideation comparator Lunchclub.

Assumptions
- Event timezone standardized in app; iOS baseline 16.4+ targeted for web push where feasible.
- No additional attendee data beyond Supabase for MVP.

Planned Reuse
- The PWA is intended for yearly reuse with venue rotation.
