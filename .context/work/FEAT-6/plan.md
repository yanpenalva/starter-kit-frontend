# Plan — FEAT-6 tokens and layouts

- State: planning complete; independent preflight and execution pending.
- Touchpoints: shared design-token stylesheet, `PublicLayout`, `AuthLayout`, synthetic component tests, responsive/focus/CSS smoke evidence.
- Sequence: independent preflight → tokens/layout components → focused tests and visual/keyboard smoke → parent review.
- Depends on FEAT-5 scaffold. No API dependency; no auth behavior. Rollback by reverting FEAT-6-only files.
- Acceptance follows `spec.md`; report computed styles and tested viewport/keyboard checks without claiming unrun validation.
- Delivery context: `feat/wave-1-spa-foundations` → `main`, `origin`, EXC-0001. This records routing only, not permission to execute.
