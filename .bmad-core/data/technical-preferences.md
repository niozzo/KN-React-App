<!-- Powered by BMAD™ Core -->

# User-Defined Preferred Patterns and Preferences

## Mobile Strategy

- PWA-first using Expo + React Native Web; ship as PWA with Add to Home Screen (A2HS).
- iOS Web Push (iOS 16.4+): supported for installed PWAs; must show a visible notification per push; no scheduled notifications API; no Live Activities/Dynamic Island; no silent pushes.
- Countdown UX:
  - In-app (foreground): render a true ticking timer.
  - Background: server-scheduled pushes that replace prior notifications via the same `tag` at coarse intervals (e.g., 60/30/10/5/1/0 min) and update the app icon badge via `navigator.setAppBadge()`.
- Transition to native when Live Activities/Dynamic Island or deeper iOS integration is needed:
  - Build iOS app with Expo/EAS; integrate ActivityKit for live countdowns; migrate notifications to APNs; keep Web Push for PWA users.
- Code reuse:
  - Keep business logic and domain models in shared TypeScript modules.
  - Use a design system that renders on web and native (e.g., cross-platform components/NativeWind).
- Routing/stack:
  - Prefer Expo Router; consider Next.js + Expo if SSR/SEO is required.

## Authentication & Privacy Requirements

- **6-digit access codes**: Attendees receive personalized 6-digit codes from Supabase for personalized content access.
- **Feature gating**: Interactive features (e.g., "birds of a feather" matching) must be opt-in only and require explicit user consent.
- **Email OTP verification**: One-time email verification required for interactive features to ensure user identity and consent.
- **Privacy by design**: Default to read-only access; interactive features require additional authentication step.
- **Session management**: Distinguish between anonymous browsing (6-digit code) and authenticated interactive sessions (email OTP).

## UI Framework

- **Material Design**: Use Material-UI (MUI) as the primary UI framework.
- **Components**: `@mui/material` for core components, `@mui/icons-material` for icons.
- **Theming**: Material Design 3 theming system with custom brand colors.
- **Cross-platform compatibility**: MUI works well with React Native Web for PWA→Native transition.
- **Accessibility**: Built-in ARIA support and accessibility features.
- **TypeScript**: Full TypeScript support for type-safe component usage.

References:
- See `docs/architecture/ADR-002-react-native-pwa-to-native.md` for the full decision and rationale.
