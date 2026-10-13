# Specification — FEAT-20 W2 frontend integration

## Objective

Integrate the current verified API client snapshot and complete the requested W2 audit search, multi-role assignment feedback and separate user-creation flow.

## Scope

- Refresh the FE OpenAPI pin, receipt, archived artifact and committed contract from the successful producer artifact for API `main`; regenerate only through `scripts/generate-client.mjs` and review every generated change against that contract.
- Keep audit search server-side and debounced per input, combine it with API-supported event/action/entity filters, and align both MSW layers and fixtures with API semantics.
- Do not request the roles catalog without `roles.view`; keep selected chips visible, explain the restriction, and allow catalog retry without losing selection.
- Prevent empty role assignment before PUT; keep role-assignment 403/422 feedback within its block; allow an operator with `roles.view` and `users.assign-roles` without requiring the `admin` role.
- Keep account creation as POST without roles, then assign roles separately through the existing edit flow with clear user-facing guidance. The POST mock must not invent a role.

## Out of scope

- API implementation changes, adding API endpoints or parameters not present in the verified main artifact, assigning roles atomically during creation, browser checks, PR creation and deployment.

## API and security contracts

- Source: `yanpenalva/starter-kit-api` `main`, SHA `ec14bab9a24fe2641bb41b927f40365cf8a12af2`.
- Verified producer run: workflow `OpenAPI Contract`, run `38409872620`, attempt 1, completed/success; artifact `11821515121`.
- Audit `search` matches current actor name, event/description and action; `action` is a separate filter. Search is authorized by `logs.view` and does not add identity fields to the audit resource.
- `/roles` catalog requires `roles.view`; role assignment requires `users.assign-roles`. These permissions are independent of admin role name.
- Creation POST never includes or assigns roles; the dedicated role PUT remains a later action.

## Acceptance criteria

1. `contract:verify` passes for the current API-main artifact; `client:check` passes after deterministic generation; generated diff contains only operations/schemas in that OpenAPI file.
2. Logs tests prove each debounced term is sent server-side, preserves action/event filters, and mock results match actor + event/description + action semantics.
3. Mock fixtures include at least one user with multiple roles.
4. Role tests prove empty selection is rejected before PUT; 403/422 stays in role feedback; catalog errors expose retry and retain chips; missing `roles.view` sends no catalog request; the operator permission pair works without admin.
5. User creation tests prove POST omits `roles`, mock creation does not assign a default role, and the UI explains later assignment.
6. Focused Vitest, full Vitest, typecheck, lint, format check, build, contract verification and client check all exit 0. No browser run.
7. Commit and push `feat/fe-adj-w2-integracao` to `origin` with upstream tracking.

## Unknowns

- Separate open GitHub issue for this follow-up: NOT FOUND; existing audit issue #14 is closed. No new issue is created by this task.
