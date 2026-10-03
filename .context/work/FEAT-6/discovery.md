# Product Discovery — FEAT-6 layouts and design foundation (Issue #6)

## Problem

- User/operator: end users of every future screen (public and authenticated areas).
- Situation: designer session `ses_efce07101ffePWEDtqz3oNpqFD` returned layout/token proposals but no files; the board holds SPA #6 after the scaffold.
- Pain or opportunity: without concrete layout components and tokens, each screen invents chrome and spacing; without a known visual direction, implementation stalls.

## Evidence

- Designer proposals (session-recorded, to be materialized as files by the designer owner): Portuguese professional-restrained direction, PublicLayout + AuthLayout, responsive/keyboard/focus expectations; ADR 0001 CSS decisions (Quasar component CSS + normalize, Tailwind theme/utilities only, `tw` prefix, no Preflight); known-copy constraint: content in Portuguese, professional and restrained.
- Confidence: high on constraints; concrete token values arrive with the designer's files.

## Hypothesis

If we `implement the two layouts plus a small token layer as real components with isolated tests`, then `all later screens` will `share one consistent, accessible chrome` because `layout, spacing and focus behavior are owned once in a tested shared module`.

## Success

- Primary metric: layouts render the placeholder routes correctly and pass isolated component tests incl. responsive/focus checks; baseline: none; target: reusable layouts adopted by the journey slice; observation: review gates.

## Constraints and alternatives

- Constraints: designer implements all frontend files for this item (single owner); only the public landing route exists until auth wave 3 — no pretend route guards; tests use synthetic props/slots, never real users/data; no Preflight/global `!important`.
- Alternatives: per-screen chrome (rejected: duplication); waiting for final design system (rejected: SPA #6 is the token/layout foundation).
- Why now: journey slice (FEAT-2) consumes AuthLayout.
