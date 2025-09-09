# ADR-002: Mobile Strategy — PWA-first with React Native Web, path to Native iOS (ActivityKit)

## Status
**ACCEPTED** — September 2025

## Context
We want to ship quickly on the web while keeping a clean path to a high-fidelity iOS experience. iOS 16.4+ enables Web Push for Home Screen-installed PWAs, but notifications are not live-updating (no ticking countdowns), there are no web-accessible Live Activities/Dynamic Island, and background execution is limited. Live, continuous countdowns on Lock Screen/Dynamic Island require a native iOS app using ActivityKit.

## Decision
Adopt a two-phase mobile strategy:

1) PWA-first using React + Material-UI to deliver a fast web app (with A2HS) and Web Push for installed iOS users.
2) When needed, ship a native iOS app (via React Native) and add ActivityKit-powered Live Activities/Dynamic Island for true live countdowns and richer notifications, migrating push to APNs.

## Rationale
- Speed to market: ship a functional PWA quickly.
- Material Design: Use Material-UI for consistent, professional design.
- Progressive enhancement: unlock native-only capabilities (Live Activities) later without rewriting core logic.
- Operational simplicity: web-first approach with clear path to native when needed.

## Scope
- PWA: Installed iOS PWAs (iOS 16.4+) can receive Web Push; service worker must show a user-visible notification for each push. No scheduled notifications (showTrigger) on iOS web; no Live Activities/Dynamic Island from web.
- Countdown behavior (PWA): Use push-driven replacements (same `tag`) and App Icon Badging API for coarse countdown steps (e.g., T-60/T-30/T-10/T-5/T-1/T-0). Show a true ticking timer only in-app when foregrounded.
- Native app: Use ActivityKit to present real-time, system-synced timers on Lock Screen/Dynamic Island and update via APNs.

## Implementation Plan
Phase 1 — PWA (Web + iOS A2HS)
- React + Material-UI for web-first PWA development.
- Service worker handles push and replaces notifications by `tag`.
- Badge remaining minutes with `navigator.setAppBadge()`.
- Server schedules coarse updates; avoid second-level precision.

Phase 2 — Native iOS (when features/time justify)
- Build iOS target with React Native from shared business logic.
- Integrate ActivityKit via native modules to render Live Activities.
- Migrate notifications to APNs; maintain Web Push for PWA users as needed.
- Keep business logic in shared TypeScript modules to minimize divergence.

## Constraints & Tradeoffs
- iOS PWA limitations: no silent pushes, no scheduled notifications API, no Live Activities/Dynamic Island, service worker short wake time.
- Push delivery is best-effort; design countdown updates at minute-level granularity.
- Native introduces build/distribution overhead but unlocks superior UX.

## Consequences
Positive
- Faster delivery with a PWA while keeping a native path.
- High code reuse across web and native.

Negative
- PWA notifications can’t tick live; experience is coarser than native.
- Additional work later to integrate ActivityKit/APNs and release to App Store.

## Risks & Mitigations
- Push delivery variability: schedule coarse intervals; reflect precise state in-app when opened.
- Fragmentation: enforce a shared core (TypeScript) and a design system that renders on both web and native.
- Platform policy changes: keep ADRs reviewed quarterly.

## Related Decisions
- ADR-003: Vercel Spike Solution - Authenticated Supabase API via Serverless Functions

## References
- Apple Web Push on iOS/iPadOS — search: "Apple Web Push iOS 16.4 developer"
- Badging API (MDN) — search: "MDN Badging API"
- ActivityKit (Apple) — search: "Apple ActivityKit Live Activities"
- Expo (React Native Web, EAS) — search: "Expo EAS React Native Web"

## Review Date
**Next Review**: December 2025 (Quarterly)
