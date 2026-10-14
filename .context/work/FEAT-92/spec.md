# Specification — FEAT-92 frontend batch 2 polish

## Objective

Complete the eight frontend UX improvements supplied by the user while preserving authorization, API behavior, accessibility and feedback contracts.

## Scope and acceptance criteria

1. Remove selection checkboxes and dead `usePageSelection` usage from Users and Roles. Inspect Logs and remove selection if it renders without an action; preserve `usePageSelection.ts` and RoleMultiSelect checkboxes. RoleMultiSelect select-all fetches every page in the finite API catalog and selects all returned profiles.
2. Document toast colors in `docs/design-color.md`; route all `Notify.create` calls through a shared helper with positive/negative/warning/info colors and preserved timeout, position and status role. No dark toast.
3. Replace native confirmation dialogs in user, role and session removal flows with an accessible reusable dialog, preserving permission guards, pending state and feedback. Production `src/` has no `confirm(` or `alert(`.
4. Create role form supports permission selection and submits name plus permissions through existing API contract. Admin safeguards and 422 feedback remain.
5. Add RequiredMark with red asterisk and hover/focus tooltip. Use it on all required labels, remove `(obrigatório)` wording.
6. Global pointer cursor for enabled buttons, links and role-button controls; disabled controls remain not-allowed. Fix uncovered menu actions and add a style smoke assertion where available.
7. Account menu includes a Person icon and “Minha Conta” link to `/profile`; do not change route guard.
8. Logout menu action has logout icon and aligned, visible hover styling while retaining loading/error behavior.

## Out of scope

API/schema changes, authorization changes, bulk actions, deployment and dependency additions. Builders may not create PRs or merge; the orchestrator owns integration.

## Decisions and contracts

- “Selecionar todos” clears selector search, fetches the catalog from its first page through its last page using the API pagination contract, then selects all returned profiles. The multi-page test verifies the second page is fetched.
- Existing session, user and role delete handlers remain the owners of deletion; confirmation UI only gates invocation.
- Toast helper centralizes semantic colors and preserves caller timeout/position and `role="status"` semantics.
- Delivery branch `feat/ux-batch2-polish`, target `main`, remote `origin`. This fixer is authorized to commit and push only; current orchestrator authorization covers PR creation and normal integration after review and green checks. The fixer does not perform PR, merge, or branch operations beyond pushing this recorded branch.
- GitHub issue: https://github.com/yanpenalva/starter-kit-frontend/issues/92.

## Unknowns

None. Role catalog pagination and the existing create-then-assign contract are confirmed by the current API client and tests.
