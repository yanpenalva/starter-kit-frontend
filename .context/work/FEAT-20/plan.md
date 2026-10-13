# Plan — FEAT-20 W2 frontend integration

## Approved approach

Consume the successful official OpenAPI artifact for the API's current `main`, update the offline pin and receipt, then run the existing Orval wrapper. Implement only the requested page, selector, mock and creation behavior with the current components and MSW helpers.

## Confirmed touchpoints

- Contract: `openapi/{artifact.zip,contract-pin.json,openapi.json,receipt.json}`, `scripts/verify_contract.py`, generated `src/lib/api/generated/**`.
- Audit: `src/features/logs/{api, pages}`, `src/test/admin-handlers.ts`, `src/mocks/{mock-data.ts,mock-handlers.ts}` and audit tests.
- Roles and users: `src/shared/components/RoleMultiSelect.vue`, `src/features/roles/composables/useRoleOptions.ts`, `src/features/users/components/UserEditForm.vue`, `UserCreateForm.vue`, creation/assignment tests and mocks.
- Interfaces: API activity filters use `search` and `action`; role assignment stays a separate `PUT /api/v1/users/{user}/roles`.
- Dependencies: existing Vue Query, MSW, Orval and API artifact tools; no package changes planned.

## Execution order

1. Verify and install the current-main artifact, adjust the bounded contract-size cap only as required, generate the client and audit its diff.
2. Implement audit search and matching test/mock semantics; add multi-role fixture coverage.
3. Implement role catalog permission/error/retry behavior, empty-list guard and block-local feedback; test the delegated operator case.
4. Keep creation POST role-free, add the instruction and tests for the later assignment flow.
5. Run focused Vitest, complete frontend gates, CSD validation and review the staged diff.
6. Commit and push the named branch.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| A | senior-software-engineer | none | Provenance verification and generated diff audit | 1 | core, project, testing |
| B | senior-software-engineer | A | Debounced audit query, accurate mocks and multi-role fixture tests | 2 | architecture, security, testing |
| C | senior-software-engineer | A | Role catalog permission, retry, block feedback and empty PUT tests | 2 | architecture, security, testing |
| D | senior-software-engineer | C | Role-free creation POST and guidance tests | 3 | project, testing |
| E | senior-software-engineer | B, C, D | All requested gates and delivery evidence | 4 | core, testing |

Integration owner: Codex. Parallel execution is not used because the repository context has one active executor and shared files overlap.

## Test plan

- Focused Vitest for audit page/API and mock handlers; `useRoleOptions`, `RoleMultiSelect`, user edit and create tests.
- Full `npm test`, `typecheck`, `lint`, `format:check`, `build`, `contract:verify`, and `client:check`.
- CSD strict/examples validator, Python unit suite and project doctor.
- No browser checks, per user.

## Risks and rollback

- Risk: generated output or client size cap diverges from the artifact. Mitigation: exact producer identity/hash checks, bounded archive extraction, source-path review and deterministic client check. Rollback is reverting this branch commit.
- Risk: catalog permission and assignment permission are conflated. Mitigation: separate explicit guards and tests for both permission combinations.
- API source and deployment are not changed.

## Required approvals

- User decision recorded in the task: consume current complete API snapshot; commit and push this branch.
- No production or deployment approval applies. No new external issue or PR is requested.
