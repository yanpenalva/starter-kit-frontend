# Plan — FEAT-12 list query enhancements

## Approved approach

Merge the fetched `origin/main` commit into the current feature branch. Resolve conflicts in place, retaining both sides' compatible behavior, then update only tests or implementation necessary to match the final UI. Use the existing dependency tree without installing packages.

## Confirmed touchpoints

- Files/components: current slice changes 14 files: `src/features/logs/components/LogDetailModal.vue`, `src/features/logs/pages/LogsPage.{vue,test.ts}`, `src/features/roles/components/RoleDetails.{vue,test.ts}`, `src/features/roles/pages/RolesPage.{vue,test.ts}`, `src/features/roles/permission-groups.ts`, `src/features/users/components/UserDetails.{vue,test.ts}`, `src/features/users/pages/UsersPage.{vue,test.ts}`, and `src/shared/composables/usePageSelection.{ts,test.ts}`. Review-mandated decomposition adds `src/features/users/components/UserCreateForm.vue` and `UsersListToolbar.vue` so the users page stays under the CSD 500-line ceiling.
- Interfaces and data: preserve existing list, modal, API, and permission contracts; no API schema or generated-client change is planned.
- Dependencies: existing `node_modules` symlink points to `/opt/data/work/starter-kit-frontend/node_modules`; no package installation is authorized or needed.
- Delivery: local branch `feat/fe-layout-w3-lists-merge`, target `main`, remote `origin`, push ref `feat/fe-layout-w3-lists`; no PR creation or merge in this task.

## Execution order

1. Complete independent preflight on this specification, plan, and target/base evidence.
2. Merge `origin/main`; inspect any conflicts and compare the final code against both parents.
3. Re-fetch and merge any newer `origin/main` or remote feature-ref updates that arrive during execution; reconcile without force pushing or discarding either side.
4. Update only tests or source needed to preserve behavior and represent the final UI, including the CSD-required users-page decomposition.
5. Run frontend and CSD gates; record exact commands, results, and limitations.
6. Complete independent security/quality review, then commit and push the validated branch.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| A | quality-engineer — preflight review | none | Independent READY finding on request/spec/plan and recorded branch/remote scope | 1 | core,project,security,testing |
| B | senior-software-engineer — integrate and resolve | A | Merge commit includes `origin/main`; both-parent diff reviewed; final list behavior preserved | 2 | architecture,security |
| C | quality-engineer + security reviewer — verify and review | B | Requested frontend gates, CSD gates, and independent diff review recorded | 3 | security,testing |
| D | senior-software-engineer — Git delivery | C | Conventional commit pushed to existing origin feature ref; no PR/merge performed | 4 | core,project |

Integration owner: senior-software-engineer. The independent reviewer returns findings to this work item; the owner integrates any corrections before Git finalization.

## Test plan

- Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`.
- Run `python3 scripts/validate_context.py --strict`, `python3 scripts/validate_context.py --strict --examples`, `python3 -m unittest discover -s tests -v`, and `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project`.
- Confirm changed test coverage exercises page selection, detail modal interactions, permission grouping, and any conflict resolution that changes visible behavior.

## Risks and rollback

- Risk: integration can regress list or authorization behavior across multiple features; personal data display increases consequence.
- Mitigation: preserve both sides, retain permission checks, update targeted tests, run the full requested gates, and use an independent review.
- Rollback: revert the merge/delivery commit on the feature branch; no production operation or data migration is in scope.

## Required approvals

- User authorization for merge, test gates, commit, and push is explicit in this request.
- EXC-0001 covers automatic Git finalization for recorded roadmap delivery branches in this repository. No production release approval is requested or implied.
