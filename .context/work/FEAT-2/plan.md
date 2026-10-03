# Plan — FEAT-2 journey first slice (Issue #2)

## Approved approach

Smallest viable vertical slice on the accepted stack (ADR 0001): transport module, server-state session, three journey states (verified, limited, blocked), logout/reload — all against the current contract with synthetic tests. Single implementation owner after preflight (designer session); parent copies and reviews without flattening.

## Confirmed touchpoints

- Files/components/services (planned paths on the FEAT-5 scaffold): `src/lib/http/` (client + CSRF bootstrap), `src/features/auth/` (journey components, composables, Pinia UI store), `src/lib/api-types/` (minimal local types until SPA #7), `src/features/auth/tests/` (MSW fixtures).
- Interfaces and data: canonical API contract only (login 204, profile 200 with `email_verified_at`, logout 204, 401/403/419/429 semantics).
- Dependencies: FEAT-5 scaffold merged first (prerequisite — cross-item, not a row dependency); FEAT-6 layouts may land in parallel; API runtime is NOT a dependency (synthetic transport).

## Execution order

1. Preflight of this item (independent reviewer; no installs before it).
2. FEAT-5 scaffold merged to main (separate item).
3. Designer implements S1–S3 in waves below; parent integrates per EXC-0001 (branch/target/remote recorded before finalization).
4. Verification with recorded commands; independent review; human-visible journey demo.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-2-S1 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | none | HTTP module with credentials, CSRF bootstrap, typed status mapping; MSW contract fixtures; unit tests green | 1 | project,security,testing |
| FEAT-2-S2 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | FEAT-2-S1 | Journey components + Query/Pinia wiring; verified, limited (email_verified_at null) and blocked-403 renderings; no sensitive storage | 2 | project,security,testing |
| FEAT-2-S3 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | FEAT-2-S2 | Full journey component tests incl. reload restore; recorded command results; slice build green | 3 | project,testing |

Wave rule: single mutable owner (designer); waves gate review checkpoints. Integrator: orchestrator.

## Test plan

- Unit/component: MSW synthetic fixtures for contract shapes; assertions for limited-vs-verified rendering, blocked-403 messaging, reload single-refetch, storage emptiness.
- Foundation gates: `npm ci`, ESLint, `vue-tsc`, Vitest, production build (exact commands and results recorded at execution).
- Explicitly deferred: E2E against a real API (wave 3, SPA #17); real session/CORS/CSRF runtime evidence (API #13 runtime + wave 3).

## Risks and rollback

- Risk: contract drift before API runtime lands. Mitigation: fixtures generated from the canonical contract; drift caught at SPA #7 typed-client integration. Rollback: revert the slice commits; no runtime/data effect.
- Risk: limited/blocked UX misinterpretation. Mitigation: state logic derives solely from `email_verified_at` and status codes per ADR decision 11; reviewed in S2.

## Required approvals

- Preflight by independent reviewer before execution; delivery under EXC-0001 (automatic, create-only PR command); no production authorization involved.
