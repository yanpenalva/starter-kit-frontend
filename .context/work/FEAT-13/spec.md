# Specification — FEAT-13 user and role forms integration

## Objective

Merge fetched origin/main into the forms integration branch, preserve the user and role form slice and current main behavior, verify the final UI, then commit and push the result.

## Scope

- Integrate origin/main into local branch feat/fe-layout-w4-forms-merge.
- Preserve the 25-file forms and shell slice: user create/edit modals, role create/edit modal, shared form-dismiss guard, user detail edit reuse, list mutations, and shell/manual presentation changes.
- Resolve conflicts by retaining compatible behavior from both parents; adjust implementation or tests only as required by the merged UI.
- Run the requested frontend gates and the repository-required CSD checks.
- Commit and push to origin/feat/fe-layout-w4-forms; the eventual PR is owned by the orchestrator and is outside this task.

## Out of scope

- Dependency installation, lockfile changes for environment setup, or tracking node_modules.
- Opening, approving, or merging a PR; changing issue or board state; deployment.
- API, OpenAPI, generated-client, or backend changes.
- Unrelated cleanup or additional form capabilities.

## Rules and contracts

- Keep the existing generated API and permission contracts; the API remains the authorization boundary.
- Preserve permission checks for user PII and permission assignment, including protection for the admin role.
- A pending mutation does not close a form; a dirty form requires explicit dismissal confirmation.
- User creation keeps its current required fields, password minimum, and initial status; edits retain partial updates and separate role assignment.
- Role creation remains name-based; role editing changes catalog permissions by group without adding rename or description behavior.
- Keep accessible dialog behavior, responsive shell behavior, and reduced-motion handling.
- Do not put sensitive values into logs or errors.

## Acceptance criteria

1. origin/main is an ancestor of the delivered branch, and the merge retains compatible behavior from both sides.
2. User creation and editing work in modals; user detail remains directly reachable and reuses the edit form.
3. Role creation and grouped permission editing work in a modal; the admin role remains protected on both action and submission paths.
4. A pending mutation blocks in-app modal dismissal. The native beforeunload listener is controlled by dirty state: it warns only while the form is dirty and is removed when clean or unmounted.
5. Tests assert the merged UI and cover the affected form, role, user-detail, and list interactions.
6. npm run typecheck, npm run lint, npm run format:check, npm test (Vitest), and npm run build pass.
7. Required CSD context validation, unit tests, and doctor checks pass where available without installing packages.
8. A Conventional Commit is pushed to origin/feat/fe-layout-w4-forms; no PR is opened or merged.
9. node_modules remains untracked and is absent from the commit.
