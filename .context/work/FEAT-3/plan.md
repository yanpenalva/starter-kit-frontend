# Plan — FEAT-3 shared quality gates

- State: planned; no gate is complete by this record.
- FEAT-5 initial slice: Prettier formatting, ESLint, strict `vue-tsc`, Vitest/Vue Test Utils foundation tests, `npm ci`, production build. Use pinned lockfile and project-local Node 24/npm 12.2 toolchain.
- Keep thresholds honest: do not claim coverage/complexity targets unless configured and measured. No unrelated cleanup. FEAT-5 test scope covers real scaffold/provider components only; MSW is prepared for later synthetic journey tests, never real API evidence.
- Depends on FEAT-5; scope extensions require this item's preflight. Commands/results belong in execution evidence.
