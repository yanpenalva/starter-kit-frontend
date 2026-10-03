# Plan — FEAT-6 tokens and layouts

- State: planning complete; independent preflight and execution pending.
- Touchpoints: shared design-token stylesheet, `PublicLayout`, `AuthLayout`, synthetic component tests, responsive/focus/CSS smoke evidence.
- Sequence: independent preflight → tokens/layout components → focused tests and visual/keyboard smoke → parent review.
- Depends on FEAT-5 scaffold. No API dependency; no auth behavior. Rollback by reverting FEAT-6-only files.
- Acceptance follows `spec.md`; report computed styles and tested viewport/keyboard checks without claiming unrun validation.
- Delivery context: `feat/issue-6-spa-layouts` from `origin/main` at `384b968a98506868b501ed2199829035056e21cb` → `main`, `origin`, EXC-0001. This records routing only, not permission to execute.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-6-S1 | designer | none | Shared token layer and PublicLayout; landing page preserves existing visual treatment; synthetic tests pass | 1 | project,architecture,testing |
| FEAT-6-S2 | designer | FEAT-6-S1 | Presentation-only AuthLayout; synthetic slots and responsive/focus smoke pass; no auth behavior or route | 2 | project,testing |

Single implementation owner: designer. Parent integrates and reviews; phases remain subject to the existing CSD gates.
