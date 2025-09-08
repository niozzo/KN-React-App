# Competitive Analysis Report: Conference Companion PWA (Professional Events)

## Executive Summary

Purpose: Identify table stakes, must‑have gaps, and differentiation opportunities for our PWA‑based conference companion app targeting professional events (~250 attendees; majority iPhone). Optimize for attendee utility, privacy, and low friction—not monetization.

Top Insights
- Table stakes: agenda, personalized schedules, reminders, venue/dinner maps, offline resilience.
- Differentiators for exec audiences: ultra‑glanceable Now/Next; identity‑linked personalization (breakouts, dinners, seats); admin broadcast nudges; private Meet List + overlap hints.
- Deprioritize for MVP: rich chat, continuous location/proximity, heavy sponsor gamification.
- Strategic fit: PWA with A2HS and Supabase enables fast delivery; privacy alignment with the Apax Privacy Policy ([apax.com/privacy-policy](https://www.apax.com/privacy-policy/)) and GDPR supports trust.

Recommendations
- Lead with “glanceability” + personalization; instrument A2HS and Now/Next usage.
- Ship admin broadcast early; design for dynamic schedule changes.
- Offer private Meet List; surface overlap hints; defer chat.
- Prepare stretch: ICS export, BoF clustering, push cohorting; consider native iOS later for Live Activities.

---

## Analysis Scope & Methodology

Scope
- Platforms: Cvent Attendee Hub, Webex Events (Socio), Whova, Sched, Bizzabo, Hopin.
- Networking‑centric comparators: Brella, Grip, Swapcard.
- Context: 2.5‑day professional event; budget‑conscious; PWA; GDPR‑aligned; Supabase as source of truth.

Method
- Capability scan (agenda, personalization, networking, notifications, offline, privacy posture).
- Synthesis into patterns to emulate vs defer.

---

## Competitive Landscape Overview

Market Structure (directional)
- Consolidated enterprise platforms (Cvent, Bizzabo) with rich admin and sponsor features.
- Mid‑market event apps (Whova, Sched, Hopin/Web) with quick deployment.
- Specialized networking (Brella, Grip, Swapcard) emphasizing matchmaking and meetings.

Priority Focus for Our Use Case
- Priority 1: Whova, Sched (speed, simplicity), Brella (networking ideas).
- Priority 2: Cvent, Bizzabo (enterprise patterns), Webex Events (Socio), Swapcard, Grip.

Key Patterns
- Broad parity on agenda/schedule/maps/push basics.
- Differ on networking depth (matchmaking, meetings, chat) vs simplicity.
- Privacy UX varies; consent and discoverability toggles are best‑practice.

---

## Individual Competitor Snapshots (Condensed)

Cvent Attendee Hub (Priority 2)
- Strengths: Enterprise‑grade features, sponsor visibility, analytics, integrations.
- Weaknesses: Heavyweight; longer setup; may be overkill for a 250‑person event.
- Relevance: Reference for admin workflows and stability expectations.

Webex Events (Socio) (Priority 2)
- Strengths: Solid event features; decent networking options; virtual/hybrid support.
- Weaknesses: Complexity, pricing; not optimized for minimal setup.
- Relevance: Patterns for notifications and session management.

Whova (Priority 1)
- Strengths: Quick setup; attendee engagement features; decent schedules.
- Weaknesses: Busy UI; engagement features can feel noisy.
- Relevance: Emulate simplicity where useful; avoid feature bloat.

Sched (Priority 1)
- Strengths: Lightweight schedules; easy publishing; quick attendee access.
- Weaknesses: Limited deep networking; modest personalization.
- Relevance: Keep friction low; layer identity‑linked features ourselves.

Bizzabo (Priority 2)
- Strengths: Robust enterprise suite; sponsor/partner tooling; analytics.
- Weaknesses: Complexity; longer implementation.
- Relevance: Sponsor basics; keep MVP scope focused.

Hopin (Priority 2)
- Strengths: Virtual/hybrid heritage; sessions and engagement.
- Weaknesses: Less fit for simple in‑person, smaller event PWA.
- Relevance: Limited; reference only.

Brella (Priority 1 — networking comparator)
- Strengths: Matchmaking and meeting scheduling; strong networking UX.
- Weaknesses: Requires attendee effort and data; setup overhead.
- Relevance: Borrow overlap ideas; defer full matchmaking.

Grip (Priority 2 — networking comparator)
- Strengths: AI matching; enterprise networking focus.
- Weaknesses: Heavier admin; privacy/consent demands.
- Relevance: Directional on “who to meet” features; adopt opt‑in approach.

Swapcard (Priority 2 — networking comparator)
- Strengths: Attendee discovery, meetings, expo support.
- Weaknesses: Complexity for our scale and timeline.
- Relevance: Inspiration for discoverability toggles and profiles.

---

## Comparative Analysis (Qualitative)

Table Stakes Achieved by Most
- Agenda, session details, basic reminders, venue info/maps, sponsor pages.

High‑Impact for Execs (Adopt)
- Now/Next at a glance (countdown, room): reduces taps, drives perceived value.
- Identity‑linked personalization (breakouts, dinners, seats): clarity in the moment.
- Admin broadcast nudges: real‑time adjustments ("break ends in 5").
- Private Meet List + overlap hints: targeted networking without heavy setup.

Lower Priority for MVP
- Rich chat/messaging; continuous location/proximity; gamification.
- Full matchmaking; complex sponsor engagement mechanics.

SWOT vs “Typical Event App”
- Strengths: Focused MVP; PWA low friction; privacy‑first; identity‑linked personalization; admin nudges.
- Weaknesses: No rich chat/matchmaking; push requires A2HS on iOS.
- Opportunities: ICS export; BoF clusters; push cohorting; native iOS for Live Activities later.
- Threats: Attendee adoption (A2HS, push opt‑in); data readiness in Supabase.

---

## Positioning & Strategic Recommendations

Positioning
- “The glanceable, personalized companion PWA that gets execs where they need to be—and helps them meet who matters—without noise.”

Recommendations
- Product: Ship Now/Next, identity‑linked schedule, admin broadcasts, Meet List + overlap hints.
- Privacy: Consent for discoverability and notifications; link policy; easy opt‑out.
- Adoption: QR + email onboarding; A2HS microcopy; measure install and Now/Next usage.
- Ops: Admin tools early; rehearsal for broadcast cadence; fallback banners for non‑push users.
- Stretch: ICS export; BoF suggestions; push cohorting; evaluate native iOS if Live Activities are desired.

---

## Monitoring & Intelligence Plan

What to Track
- Competitor updates to schedules, networking, privacy UX, and push/engagement patterns.
- A2HS best practices on iOS; PWA install flows; offline strategies.

Cadence
- Pre‑event review; post‑event debrief; quarterly scan for next year’s iteration.

Sources
- Vendor changelogs/docs; community forums; event tech roundups.

---

## Notes on Privacy & Compliance

- Align with GDPR principles and the Apax Privacy Policy: [apax.com/privacy-policy](https://www.apax.com/privacy-policy/).
- Consent for discoverability and notifications; data minimization; opt‑out; DSAR‑readiness.
- Battery‑safe: no continuous location; schedule‑driven updates and offline caching.
