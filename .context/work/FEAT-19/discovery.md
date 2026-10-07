# Product Discovery — FEAT-19 frontend scan findings

## Problem

- User/operator: authenticated users and operators responsible for access administration.
- Situation: the requested FE scan identified bootstrap reliability, permission alignment, logout feedback, and unfinished administration pages. User-provided scan findings define the baseline evidence.
- Impact: transient profile failures can discard usable session state; role access can diverge from API permissions; administrators cannot perform the supported user/role operations or inspect the audit feed from the FE.
- Confidence: high for the supplied findings and confirmed local client/page contracts.

## Hypothesis

If the session lifecycle is resilient, route checks follow effective permissions, and administration pages consume their existing API clients, then operators can reliably administer accounts, roles, and audit review without relying on role-name assumptions or placeholder screens.

## Success

- Bootstrap preserves sessions through a 500 and permits retry, clears on 401, hydrates on success, shares concurrent requests, and ignores stale post-logout responses.
- Users, roles, and audit pages display API-backed records with filters/pagination; user and role mutations are reachable from their pages.
- A user with `roles.view` and no `admin` role reaches `/roles`.
- Logout clears local state and navigates to login on both API success and failure, with failure feedback.
- Vitest/MSW, vue-tsc, ESLint, Prettier, build, and client generation checks pass without drift.

## Constraints

- Preserve existing API contracts and generated outputs.
- No PR is opened by this work; the orchestrator owns PR creation.
- GitHub issue reference: NOT FOUND in this environment; CLI unavailable and public issue endpoint returned 404.
