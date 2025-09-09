---
title: KnowledgeNow Branding & Visual Direction Spec
owner: UX
version: 0.1.0
status: draft
source: Apax OEP KnowledgeNow
reference: https://www.apax.com/create/operational-excellence/practice-overview/#KnowledgeNow
---

> Developer note: This file is the canonical source for front‑end implementation. Engineers should use these guidelines and the accompanying design tokens in `docs/ux/design-tokens.json` (forthcoming) when building UI.

## Executive Summary — Branding & Visual Direction (One‑Pager)
Reference: https://www.apax.com/create/operational-excellence/practice-overview/#KnowledgeNow

- **Brand essence**: Trusted, execution‑oriented partner delivering transformation through experience, data, and rigor.
- **Tone & voice**: Confident and concise; expert yet accessible; action‑oriented.
- **Visual language**: Clean, high‑contrast layouts; generous whitespace; subtle geometric structure; authentic photography; editorial metrics as hero elements.
- **Primary color**: Purple `#9468CE` (dominant). Use Ink/Navy `#0E1821` for body text; White `#FFFFFF` as primary surface; Light Gray `#C7C9CA` for structure.
- **Accents (sparingly)**: Coral `#D9776F` (alerts/emphasis), Lime `#7FB069` (success/data viz), Magenta `#A67DB8` (data viz highlight). One accent per view.
- **Typography**: Headlines with authority (Inter/IBM Plex Sans heavy) and body in Inter 400–600; tabular numerals for metrics; clear hierarchy.
- **Layout & spacing**: 12‑col grid desktop / 4‑col mobile; 4/8px rhythm; generous section spacing.
- **Iconography**: 24px grid, 2px strokes, minimal fills, rounded joins.
- **Motion**: Understated, purposeful; 200–300ms; standard material easing; honor reduced motion.
- **Accessibility**: Minimum contrast **≥ 4.5:1** for text and UI; visible focus rings; don’t use color alone for meaning.
- **Guardrails**: Purple dominates; accents never compete with primary. Favor authenticity in imagery. Keep interfaces uncluttered.

# Branding & Visual Direction

This document defines the palette, typography, spacing, components, states, iconography, accessibility, and motion guidelines for the KnowledgeNow experience. It is based on the approved brand colors with purple as the primary brand color and all other accents used sparingly.

## Brand Principles
- Authority through clarity: confident, precise, outcome‑driven.
- Human and global: real teams, authentic photography, inclusive design.
- Editorial impact: metrics and proof points as hero elements.
- Restraint: generous whitespace, measured accents, strong hierarchy.

## Color System

### Core Colors
- Primary Purple (brand): `#9468CE` (RGB 148, 104, 206)
- Ink / Navy (text on light): `#0E1821` (RGB 14, 24, 33)
- Light Gray (structure): `#C7C9CA` (RGB 199, 201, 202)
- White (surface): `#FFFFFF` (RGB 255, 255, 255)

### Accent Colors (sparingly)
- Coral (emphasis/alerts): `#D9776F` (RGB 217, 119, 111)
- Lime (success/data viz): `#7FB069` (RGB 127, 176, 105)
- Magenta (data viz highlight): `#A67DB8` (RGB 166, 125, 184)

### Shades & Tints (Accessibility‑ready)
Purpose: ensure ≥ 4.5:1 contrast for body text and UI controls.

- Purple Ramp
  - Purple‑900 (AA on white, text): `#5E35A5`
  - Purple‑700 (buttons/links on white): `#7C4CC4`
  - Purple‑500 (brand surfaces/large headings on white): `#9468CE`
  - Purple‑050 (tint surface): `#F2ECFB`

- Ink Ramp
  - Ink‑900 (primary text): `#0E1821`
  - Ink‑700 (secondary text): `#2A3745`
  - Ink‑500 (tertiary/meta): `#5A6A7A`

- Gray Ramp
  - Gray‑300 (borders): `#D9DBDC`
  - Gray‑200 (dividers): `#E6E7E8`
  - Gray‑100 (subtle bg): `#F5F6F7`

Contrast references:
- Ink‑900 on White: 14+:1 (AA/AAA)
- Purple‑700 on White: ≥ 5:1 (AA body)
- White on Purple‑700+: ≥ 4.5:1 (AA body) — prefer bold ≥ 16px or larger sizes.

## Typography

- Display/Headlines: modern grotesk or high‑legibility serif. Recommended pairing: 
  - Headlines: "Inter" or "IBM Plex Sans" heavy weights for authority.
  - Alternate: "Source Serif Pro" for editorial titles in PDFs only.
- Body/UI: "Inter" (400–600). Numerals: tabular for metrics.
- Line height: 1.5–1.6 body, 1.2–1.3 headings.
- Scale (rem): 48, 36, 28, 22, 18, 16, 14, 12.
- Tracking: normal; avoid negative tracking below 20px.

Examples (web):
- H1 36/44, weight 700, Purple‑900 or Ink‑900
- H2 28/36, weight 700, Ink‑900
- Body 16/24, weight 400–500, Ink‑900
- Caption 14/20, weight 400, Ink‑700

## Spacing System

- Base unit: 4px; preferred step: 8px for most layout blocks.
- Scale (px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Container gutters: 24–32px mobile, 40–64px desktop.
- Section rhythm: 80–120px between major sections on desktop; halve on mobile.

## Components

### Buttons
- Primary Button: filled Purple‑700 text White; hover Purple‑900; active Purple‑900 with 4% inner shadow; focus 2px outline `#7C4CC4` + 2px offset.
- Secondary Button: outline Purple‑700 text Purple‑700 on White; hover bg Purple‑050.
- Tertiary Link: Purple‑700 text only; underline on hover; focus visible ring.
- Destructive/Alert: filled Coral text White; hover darken by ~8%.

### Inputs
- Background White; border Gray‑300; radius 8px; text Ink‑900.
- Focus: 2px ring Purple‑700 + 2px offset; border Purple‑700.
- Error: border Coral; helper text Coral‑700 (derived).

### Cards
- Background White; radius 12px; shadow `0 2px 6px rgba(14,24,33,0.08)`.
- Header band (optional): Purple‑050; title Ink‑900.

### Navigation
- Light theme: white app bar, Ink‑900 text, active indicator Purple‑700.
- Overflow states: use Purple‑700 underline to denote active route.

### Data Visualization
- Series A: Purple‑500
- Series B: Ink‑700
- Series C: Magenta
- Positive: Lime
- Negative: Coral

## States
- Hover: +4% luminosity for filled; Purple‑050 bg for outlined/ghost.
- Active: -6% luminosity; maintain contrast.
- Focus: 2px visible ring with Purple‑700 + 2px offset (always visible, not only on keyboard).
- Disabled: 40% opacity on text/icon; borders shift to Gray‑200.

## Iconography
- Stroke‑first, 2px stroke, 24px grid. Minimal fills; rounded joins for warmth.
- Color: default Ink‑700; interactive icons follow button/link states.
- Export: SVG, optimized; keep consistent bounding boxes for alignment.

## Accessibility
- Text and interactive elements meet **≥ 4.5:1** contrast (AA). Large text (≥ 24px regular or 18px bold) can target 3:1.
- Focus indicators must be visible at all times; not removed on mouse users.
- Provide motion‑reduced alternatives for prefers‑reduced‑motion.
- Link styles must include more than color (underline on hover or always in body copy).
- Avoid conveying meaning with color alone; pair with icon or text.

## Motion Guidelines
- Duration: 200–300ms standard; 120–160ms micro; 400ms page‑scale.
- Easing: cubic‑bezier(0.4, 0, 0.2, 1) for enter; (0.2, 0, 0, 1) for exit.
- Use: reinforce hierarchy (nav transitions), feedback (press/selection), and continuity (progress indicators). Avoid decorative motion.
- Respect reduced motion preference: substitute with fades and discrete state changes.

## Photography & Graphics
- Authentic leadership moments; avoid staged stock. Global settings and real workshops.
- Editorial numerics as hero: large stats (NPS, engagement counts) paired with concise proof text.
- Backgrounds: clean, light, or subtle geometric textures at <4% opacity.

## Usage Guardrails
- Purple is dominant. Use Coral/Lime/Magenta sparingly and semantically.
- Never place multiple accents within the same component. One accent per view when possible.
- Maintain generous whitespace; avoid over‑crowding hero metrics.

## Implementation Notes
- Provide design tokens in `docs/ux/design-tokens.json` (next step).
- PWA `theme_color` and `background_color` will be proposed based on Purple‑700 and White with verified contrast for URL and toolbar areas.
