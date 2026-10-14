# Plan — FEAT-92 frontend batch 2 polish

## Approach

Use existing Vue components, APIs and test conventions. Make the smallest shared additions: semantic toast helper, confirmation dialog and required marker. Keep existing guards and handlers as the source of business behavior.

## Subtasks and waves

| Subtask | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| A | senior-software-engineer | none | Inspect components, API shape and current behavior | 1 |
| B | senior-software-engineer | A | Remove misleading table selection; page and selector tests prove all catalog pages load | 2 |
| C | senior-software-engineer | A | Centralize toast colors and document palette; helper color tests pass | 2 |
| D | senior-software-engineer | A | Add confirmation dialog and migrate native confirmation use; workflow tests and grep | 2 |
| E | senior-software-engineer | A | Add create permissions and required markers; submission and marker tests | 2 |
| F | senior-software-engineer | A | Cursor, account link and logout style tests | 2 |
| G | senior-software-engineer | B, C, D, E, F | Run gates, review changes, commit and push | 3 |

## Decision

RoleMultiSelect select-all clears search and fetches every catalog page (`per_page=50`) according to response pagination before selecting returned profiles. Loading stops at the API's last page or a reported error; existing pending, cancellation, error, and retry states remain in place. Its multi-page test documents complete-catalog selection.

## Verification

Run focused tests during TDD, then the exact requested full Vitest command, vue-tsc, eslint, format check, build, and strict CSD examples validation. Record command, exit code, and short log tail for each.

## Risks and rollback

Role permission payload and selector pagination can be misunderstood; inspect existing generated API and query behavior before changing. Dialog migrations can bypass loading or permission state; tests assert callbacks remain gated. Rollback is a revert of the branch commit.

## Delivery

Branch `feat/ux-batch2-polish`, target `main`, remote `origin`. Commit with Conventional Commits and push the existing branch. Current orchestrator authorization covers PR creation and integration after independent review and green checks; this fixer does not open a PR or merge.
