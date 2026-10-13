# ADR 0002 — Authenticated session management and Query authority

- State: ACCEPTED. yanpenalva authorized this FE feature and its decision record in the request for the `feat/session-query-authority` branch on 2026-10-13.
- Scope: session profile ownership, the authenticated `/sessions` route and navigation entry, API integration, and user feedback for active-session revocation.

## Context and evidence

The API supports listing active sessions and revoking one session or all sessions other than the current one. Its list response identifies the current session and includes an opaque ID, IP address, user agent, nullable last-activity timestamp, and `is_current`. The frontend's approved FEAT-7 OpenAPI pin predates these operations, while the API's current source and feature tests include them. ADR 0001 already assigns server state, including the session profile, to TanStack Query and limits Pinia to UI state.

## Decisions

1. **Profile authority:** TanStack Query remains the only owner of the profile. `session.user` is a writable computed view over the generated profile query cache, so existing auth flows and guards keep their interface without a second profile copy in Pinia. Logout and session expiry clear the query cache; no sensitive browser storage is added.
2. **Session transport:** until the API publishes a newer approved contract artifact and receipt, the session endpoint wrapper uses the central HTTP mutator and a small local response type. The wrapper uses credentials and the existing CSRF coordinator for DELETE requests. Generated Orval files and the pinned contract are not edited by hand.
3. **Route descriptors:** `routeDescriptors` stays the single source for route registration and navigation. `/sessions` requires authentication and adds no invented permission. Existing guards keep limited sessions on their current restricted flow; the session page is not a dashboard shortcut.
4. **Session actions:** the page highlights the current session and does not offer an individual revoke action for it. Users may revoke one other session or all other sessions. The API remains responsible for ownership checks and actual authorization; UI hiding is not a security boundary.
5. **Feedback:** reuse `FormFeedback` and `useFormFeedback` for loading failures, retry, mutation outcomes, and rate limiting. Display safe `pt-BR` messages from the shared HTTP error mapper, confirm destructive actions with the browser's native confirmation, and refresh the session query after successful revocation.
6. **Descriptors and nullable fields:** show the API's browser/device string, IP address, and last activity as plain text; use a pt-BR date formatter and an explicit fallback for absent or invalid values. Vue text interpolation escapes the API-provided strings.

## Impacts and verification

- The route is available to any verified authenticated user; limited or unauthenticated access follows existing guard behavior.
- A later approved OpenAPI artifact may replace the local API wrapper with Orval-generated operations. That migration must preserve the session response and security behavior.
- Verification: Vitest/MSW covers listing, empty/error states, current-session emphasis, specific and bulk revocation, confirmation, feedback, route/nav descriptors, and Query-backed profile state. Frontend quality gates and Orval drift check are recorded in `.context/work/FEAT-21/verification.md`.
- Rollback: revert the feature commit. No backend, data, dependency, or deployment change is required.
