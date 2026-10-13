# Plan — SLICE-8 Conta self-service

## Approved approach

Extend the existing profile page and auth API module. Reuse the HTTP mutator and shared form feedback components. Add one protected route descriptor and MSW tests. The pinned generated snapshot lacks PATCH/PUT; define typed operations through the existing central `transportApi`, which preserves CSRF and error normalization, and leave generated output unchanged. This is a local, reversible implementation choice within the requested endpoints.

The account route sets `requiresAuth: true`. Limited sessions remain blocked from name/password updates because the project authentication contract limits them to verification, logout and minimal profile access; the request did not authorize broadening that boundary.

## Confirmed touchpoints

- Files/components: `src/features/auth/pages/ProfilePage.vue`, its test, `src/features/auth/api/auth.api.ts`, `src/features/auth/api/auth.types.ts`, and `src/app/router/descriptors.ts` plus route tests.
- Interfaces and data: the authenticated `MyProfileResource`; profile PATCH returns its updated `{ data }`; password PUT requires current password, new password and confirmation.
- Dependencies: existing Vue, Pinia, Vue Router, Vitest, MSW, shared form feedback and central HTTP transport. No dependency changes.

## Execution order

1. Add typed auth self-service calls using `transportApi` and cover the protected route.
2. Implement the account forms and reuse the shared feedback/field errors/retry.
3. Add MSW page tests for name update, password update, 422 errors and retry.
4. Run requested frontend gates, `client:check`, and CSD validation; inspect final diff.
5. Commit and push the recorded feature branch. Do not create a PR or merge.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| SLICE-8-S1 | Codex | None | Typed central-transport operations and protected account route | 1 | project,architecture,security |
| SLICE-8-S2 | Codex | SLICE-8-S1 | Minha Conta page and MSW/Vitest coverage for success, 422 and retry | 2 | project,security,testing |
| SLICE-8-S3 | Codex | SLICE-8-S2 | All requested gates, context validation, review and recorded Git finalization | 3 | project,security,testing |

Integration owner: Codex. Work is sequential; no parallel file ownership is needed.

## Test plan

- Run Vitest for `ProfilePage.test.ts`, `router.test.ts`, and `descriptors.test.ts`.
- Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run client:check`, and `npm run build` with the requested Node 24 toolchain.
- Run CSD strict/examples and Python unittest checks per project quality context.

## Risks and rollback

- Risk: the approved Orval snapshot lacks the two operations. Mitigation: use the central transport while preserving the pin, or regenerate only after receiving the authenticated upstream artifact.
- Risk: retry retains the submitted password payload in component memory. Mitigation: only capture it for the shared retry mechanism, clear form fields on success, and never persist or log it.
- Rollback: revert the feature commit; no API, data or infrastructure change is made.

## Required approvals

- User authorized the implementation and commit/push in this request; PR and merge are explicitly prohibited.
- Delivery record: branch `feat/account-self-service`, base `3f34b34` (`origin/main` after the final fetch/merge), target `main`, remote `origin`; EXC-0001 covers automatic commit/push. Do not create a PR or merge.
- GitHub issue linkage is NOT FOUND and will not be fabricated. The repository-owner request directly authorizes this bounded implementation and push.
