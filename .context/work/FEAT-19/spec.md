# Specification — FEAT-19 frontend scan findings

## Objective

Fix session bootstrap and logout behavior, align `/roles` authorization with API permission contracts, complete the user/role/audit pages using existing API clients, and extract the shared administrative page heading/card layout.

## Scope

- Bootstrap: only unauthorized (401) and CSRF mismatch (419) responses invalidate the session. Transient network/server failures retain current user state, leave initialization retryable, and expose a safe error. Bootstrap requests are shared; generation changes discard responses from before logout.
- Authorization: `/roles` and its navigation entry require `roles.view`, not a literal `admin` role.
- Logout: local session is cleared regardless of remote outcome; the navigation always routes to login and gives an accessible failure message.
- Users: list via `useUsersList`, support search/status/role filters, pagination, name updates, role assignment, and status transitions.
- Roles: list via a role query/mutation composable, support search/pagination and permission updates; immutable admin permissions remain protected.
- Audit: render the existing activity feed with event/subject filters and pagination.
- Shared layout: extract the repeated admin header/card structure without changing its presentation.

## Out of scope

- API/backend contract changes, user creation, new permission catalog values, visual redesign, PR creation, and generated client modifications.

## Acceptance criteria

1. MSW tests cover bootstrap 401 invalidation, 500 preservation plus retry, success hydration, concurrent request deduplication, and post-logout stale response discard.
2. Router test proves a non-admin user with `roles.view` can access `/roles`.
3. Logout success and failure clear local state and route to login; failure renders user-visible feedback.
4. Vitest/MSW page tests verify user listing/filtering/pagination/status mutation, role permission mutation/filtering, and audit feed filters.
5. Shared layout is used by users, roles, and logs pages, retaining existing header/card presentation.
6. `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, and `npm run client:check` pass; generated output has no drift.
