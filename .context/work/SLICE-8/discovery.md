# Product Discovery — SLICE-8 Conta self-service

## Problem

- User: an authenticated account holder.
- Situation: the current profile page is read-only and there is no self-service route.
- Opportunity: let account holders update their own name and password without an administrator.

## Evidence

- User request on 2026-10-13 specifies viewing/editing the account name, changing a password with confirmation, a protected route, shared feedback, Vitest and MSW.
- Existing `ProfilePage.vue` and its test are untracked in the starting worktree and currently implement read-only profile display.
- GitHub issue linkage: NOT FOUND. The frontend issue list currently ends at #20 and has no matching account self-service issue. This work item uses the user-provided slice label and does not invent an issue number.
- The API contract source has `PATCH /api/v1/auth/my-profile` and `PUT /api/v1/auth/password`. The frontend's approved Orval snapshot predates these operations; its authenticated artifact download returned HTTP 401, so the generated client cannot be refreshed with verified provenance in this environment.

## Hypothesis

If account holders can edit their own name and change their password in the authenticated app, they can maintain their account without administrator assistance.

## Success

- Primary signal: users can view the signed-in account, save a name change, and change a password with server-confirmed matching fields.
- Baseline: profile is read-only; password change is unavailable in the frontend.
- Target: acceptance tests cover both successful operations, 422 field errors, a retryable failure, and the protected route; all requested frontend gates pass.
- Product adoption metric and observation period: NOT FOUND; no analytics are in scope.

## Constraints and alternatives

- Use the existing auth/session state, `transportApi`, `FormFeedback`, `FieldErrors`, and `useFormFeedback`.
- Do not alter the approved OpenAPI pin or generated output without the authenticated upstream artifact.
- Why now: the API endpoints are available and the requested frontend slice is authorized.
