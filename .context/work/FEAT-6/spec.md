# Specification — FEAT-6 tokens and layouts

## Objective and scope

Define restrained, responsive public/authenticated layout foundations and design tokens for the Vue SPA. Own colors, typography, spacing, focus, keyboard and reduced-motion behavior; preserve Quasar normalize/component styles and Tailwind 4 `tw` utilities without Preflight or global important rules.

## Boundaries

Build composable `PublicLayout` and `AuthLayout` plus documented tokens. Auth layout is presentation only: no real session, auth flow, profile DTO, permission guard, fake API or protected-route claim. No legacy copy/data. FEAT-5 public placeholder remains valid until FEAT-6 separately preflighted and implemented.

## Acceptance

Responsive layouts; visible keyboard focus; usable native controls and transitions; verified Quasar/Tailwind computed-style coexistence. Test synthetic content only. FEAT-6 implementation is not authorized by this plan alone.
