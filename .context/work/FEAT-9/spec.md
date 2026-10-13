# Specification — FEAT-9 MFA login challenge flow

## Request

- Source: user request in this conversation; related baseline: Issue #9.
- Requester: yanpenalva.
- Date: 2026-10-13.

## Objective

Let an MFA-enabled administrator finish login with a six-digit code or a recovery code without creating an authenticated frontend session before the API challenge succeeds.

## Scope

- Hand-written `loginUser` and `completeMfaChallenge` API operations using `transportApi`.
- `mfa_required` session status; skip profile hydration after an MFA-required login; complete challenge then hydrate profile.
- A guest-only `/mfa-challenge` page with TOTP and recovery-code modes.
- Login redirect and navigation guard behavior for pending MFA.
- Tests for transport, store, page and guard behavior; MSW challenge success and invalid-code scenarios.
- Auth feature documentation updates.

## Out of scope

- Backend changes, generated client output, token or challenge persistence, additional demo pages, and changes to role/permission guard rules.

## Evidence and context

- Repository evidence: login and profile currently use generated functions; profile update uses `transportApi`; form feedback supports `fieldErrors`; route access is centralized in `navigationGuard`.
- Product evidence: user-specified API response contracts and acceptance criteria.
- Relevant project context: Vue SPA, Pinia session store, Vue Router descriptors, Vitest/MSW, all quality commands in `.context/project/quality.md`.
- Unknowns (`NOT FOUND`): backend deployment/version and whether an MFA challenge survives a browser reload.

## Rules and contracts

- `POST /api/v1/login` returns `204` for direct login or `200 { requires_mfa: true }` for pending MFA.
- Pending MFA must not call `GET /api/v1/auth/my-profile` and must not set `isAuthenticated`.
- `POST /api/v1/auth/mfa/challenge` accepts `{ code }` or `{ recovery_code }`, returns `204` on success and `422` with field errors on invalid input.
- A successful challenge is followed by profile hydration and the existing authenticated/limited status calculation.
- While `mfa_required`, protected routes redirect to `/mfa-challenge`; that route requires `mfa_required`.
- Security impact: authentication and challenge input boundary; no credential is persisted or logged.

## Tests and acceptance criteria

1. Login transport handles `204` as `{}` and exposes `requires_mfa` from a `200` response.
2. Store test proves MFA-required login skips profile hydration; challenge success fetches profile and authenticates; `422` preserves pending challenge and typed field errors.
3. Page test covers six-digit submission, invalid field feedback, and switching to recovery-code input.
4. Guard tests cover protected-route redirect during MFA and rejection of `/mfa-challenge` without pending MFA.
5. MSW handler tests cover successful and invalid challenges.
6. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run client:check`, and `npm run build` pass; generated API output has no drift.

## Open decisions

- None for the requested client behavior.
