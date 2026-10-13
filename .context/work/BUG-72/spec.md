# Specification — BUG-72 Eliminate unhandled role-list request rejections in user page tests

## Request

- Source: User report in the coding session; regression observed in open PR #72.
- Requester: yanpenalva
- Date: 2026-10-13

## Objective

Make the UsersPage tests provide deterministic responses for all requests initiated by the mounted page, so Vitest has no unhandled network rejections.

## Scope

- Add the existing `rolesListHandler` fixture to UsersPage scenarios that currently omit it while mounting role selectors.
- Verify the UsersPage test file and the complete frontend quality gates requested for this delivery.

## Out of scope

- Changes to production retry, countdown, or feedback behavior.
- Changes to the role-list composable or API client.
- Changes to branches, PR merge state, or production deployment.

## Evidence and context

- Repository evidence: The 422 and 429 tests register user route handlers but omit `rolesListHandler`; role selectors call `useRoleOptions`, whose initial role request is fire-and-forget.
- Product or incident evidence: No active production impact was reported or observed.
- Relevant project context: `.context/project/quality.md`, `.context/project/delivery.md`, and `.context/project/conventions.md`.
- Unknowns (`NOT FOUND`): No separate GitHub issue is linked to PR #72.

## Rules and contracts

- Business or operational rules: API calls in tests use deterministic MSW handlers.
- Interfaces, data and permissions: No production interface or payload changes.
- Security and privacy impact: None; test fixture only.

## Tests and acceptance criteria

- The UsersPage test file passes without unhandled rejections.
- The full Vitest suite exits 0.
- `npm run typecheck`, `npm run lint`, and `npm run format:check` pass.
- Required CSD context validation passes before handoff.

## Open decisions

- None.
