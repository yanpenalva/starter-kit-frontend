# Specification — FEAT-2 journey first slice (Issue #2)

## Request

- Source: GitHub Issue #2 (board In progress); roadmap wave 1 first slice.
- Requester: yanpenalva.
- Date: 2026-10-03.

## Objective

One vertical journey slice on the FEAT-5 scaffold: sign in, load the profile into the server-state cache, render authenticated-limited vs verified states, sign out, and restore state on reload — using the current API contract and the accepted ADR 0001 patterns.

## Scope

- `src/lib/http` central client: credentials always, CSRF bootstrap via `GET /sanctum/csrf-cookie` before state-changing calls, `X-XSRF-TOKEN` header, typed outcome mapping for 200/204/401/403/419/429.
- Session profile as TanStack Query cache; Pinia only for journey UI state; no tokens or profile data in any client storage.
- Login form → `POST /api/v1/login` (204) → `GET /api/v1/auth/my-profile` (200); limited state from `email_verified_at: null` (never inferred from empty permissions); business-denied rendering for the limited state; disabled 403 rendered blocked, never offered re-verification; logout `POST /api/v1/logout` (204) clears cache/stores; reload re-fetches profile once.
- Component and transport tests with MSW synthetic fixtures (contract shapes only).

## Out of scope

- Real auth runtime against a live API (wave 3); email verification/registration/CPF flows (API #14/#15, SPA #10); typed client generation (SPA #7); route guards beyond journey UX (SPA #9/#11); releases/deploy; E2E with a real API (SPA #17 wave 3); any invented endpoint.

## Evidence and context

- Repository: branch `feat/wave-1-spa-foundations` from `42f235ce8085375357570675d32db0972a78f3d8` (main, clean), target `main`, remote `origin`; no application source yet (FEAT-5 is the same-wave prerequisite, plan-referenced, not started before its preflight).
- Relevant context: ADR 0001 (decisions 4, 6, 9, 11); API canonical contract (current, read-only sibling); FEAT-1 compatibility matrix; PR #23 checkpoint governance (EXC-0001 automatic delivery).
- Unknowns (`NOT FOUND`): production origins/session config (deploy work); API runtime behavior (wave 3); exact visual design details (FEAT-6 designer proposals pending files).

## Rules and contracts

- Endpoints and payload shapes come only from the canonical API contract; authentication errors reveal nothing about account existence; no credentials or tokens in logs/errors.
- Authorization is API-enforced; the SPA renders UX states only.
- Security impact: relevant — session/CSRF client handling; no secrets in source, fixtures or logs; MSW fixtures are synthetic.

## Tests and acceptance criteria

1. HTTP module maps contract statuses to typed outcomes; CSRF bootstrap precedes state-changing calls (unit, MSW).
2. Login → profile → logout journey works in component tests with synthetic fixtures, including limited (`email_verified_at: null`) and disabled-403 renderings.
3. Reload restores session state from a single profile refetch; nothing sensitive persists in storage (assertion in tests).
4. `npm ci`, lint, `vue-tsc`, Vitest and build all green on the slice (commands recorded at execution, not claimed now).

## Open decisions

- None material: contract and architecture are accepted; visual details follow FEAT-6 designer files (routine defaults otherwise). Category check: all remaining choices `REVERSIBLE_AGENT_DECISION`/`ASSUMPTION_ALLOWED` for the designer owner within this spec.
