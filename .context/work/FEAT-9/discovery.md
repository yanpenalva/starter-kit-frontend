# Product Discovery — FEAT-9 MFA login challenge flow

## Problem

- User/operator: account holders who sign in with an administrator account protected by MFA.
- Situation: the API's login endpoint can request a second factor, but the SPA currently assumes every successful login immediately creates an authenticated session.
- Pain or opportunity: without a challenge route, MFA-enabled administrators cannot complete login and protected pages risk being treated as available before the second factor succeeds.

## Evidence

- Observation: user-provided API contract says login returns `204` for direct login or `200 { requires_mfa: true }` for MFA; profile remains `401` until challenge completion.
- Related issue: [Issue #9 — login, session bootstrap, logout and navigation guards](https://github.com/yanpenalva/starter-kit-frontend/issues/9), closed; this request adds the explicit MFA follow-up behavior.
- Confidence and gaps: high for requested frontend contract; backend implementation is outside this repository and was not inspected.

## Hypothesis

If the SPA holds an unauthenticated `mfa_required` state until a TOTP or recovery code succeeds, then MFA-enabled administrators can finish login while protected pages remain unavailable before verification.

## Success

- Primary signal: tests prove no `my-profile` request occurs after `requires_mfa`, and a successful challenge is followed by profile hydration and authenticated status.
- Target: all requested functional scenarios and repository quality gates pass.
- Observation period: local verification for this delivery.

## Constraints and alternatives

- Constraints: preserve generated Orval output; use hand-written auth transport through `transportApi`; keep MFA challenge state in memory.
- Alternatives considered: call generated `authLogin` (rejected because it is typed as `void` and cannot expose `requires_mfa`); persist the challenge (not requested and unnecessary for this flow).
- Why now: the user requested the complete MFA login journey and direct commit/push delivery.
