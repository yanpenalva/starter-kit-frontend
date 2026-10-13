# Reproduction — BUG-72

## Observed behavior

`UsersPage.test.ts` assertions pass, but Vitest exits with unhandled rejections carrying `kind: network` and the service-connection error message. The latest test reported at rejection time is the 422 form validation test; the 429 countdown test also mounts the page without a roles handler.

## Expected behavior

Every API request initiated by a mounted UsersPage test has a deterministic MSW response. The complete Vitest run exits 0 with no unhandled errors.

## Steps and evidence

1. Run `npm test -- src/features/users/pages/UsersPage.test.ts` on `feat/role-selection` before the fix.
2. Observe 10 passing test assertions plus 43 unhandled network errors and process exit 1.
3. Inspect the 422 and 429 scenarios: each registers user handlers but omits `GET /api/v1/roles`; each visible `RoleMultiSelect` starts a role-list request.

Evidence links or identifiers (never secrets or personal data):

- Test file: `src/features/users/pages/UsersPage.test.ts`.
- Request owner: `useRoleOptions` inside `RoleMultiSelect.vue`.
- API handler fixture: `rolesListHandler` in the same test file.
