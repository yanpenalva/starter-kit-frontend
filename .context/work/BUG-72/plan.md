# Plan — BUG-72 Eliminate unhandled role-list request rejections in user page tests

## Approved approach

Use the existing `rolesListHandler` in both UsersPage test cases that mount role selectors without a response for `GET /api/v1/roles`. This keeps test requests deterministic and avoids changing production behavior for a test-fixture omission.

## Confirmed touchpoints

- Files/components/services: `src/features/users/pages/UsersPage.test.ts`.
- Interfaces and data: No changes.
- Dependencies: Existing MSW fixture `rolesListHandler`.

## Execution order

1. Add `rolesListHandler` to the 422 and 429 test setups.
2. Rerun the UsersPage tests, then the complete Vitest suite, typecheck, lint, and formatting check.
3. Run required CSD validators and record exact outcomes.
4. Review the diff, commit, and push to the recorded PR branch.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| BUG-72.1 | Codex | None | Missing role requests are mocked; requested verification passes | 1 | core,project,testing |

Integration owner: Codex. No parallel work is needed for this local fixture correction.

## Test plan

- `npm test -- src/features/users/pages/UsersPage.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `python3 scripts/validate_context.py --strict`
- `python3 scripts/validate_context.py --strict --examples`
- `python3 -m unittest discover -s tests -v`
- `npx --yes @owlcodium/context-spec-develop@1.2.1 doctor --scope project`

## Risks and rollback

- Risk: low; a test fixture could mask an unrelated role-list issue if attached to the wrong scenario.
- Mitigation: use the existing handler and leave assertions and production code unchanged.
- Rollback: revert the small test setup change if the complete suite reveals a different cause.

## Required approvals

- None for a test-only correction. Commit and push are within the recorded EXC-0001 scope for this repository and branch.

## Delivery scope recorded before Git finalization

- Branch: `feat/role-selection`
- Target: `main`
- Remote: `origin` (`https://github.com/yanpenalva/starter-kit-frontend.git`)
- Pull request: #72, already open; do not merge.
