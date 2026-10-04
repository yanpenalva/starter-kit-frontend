# Plan — FEAT-7 typed HTTP client phase A (Issue #7)

Single lane (wave-3 client worktree). Stages B (Orval/typed client generation)
and any auth-flow wiring are separate, later items and are not planned here.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | wave-3-client-lane | none | src/lib/http/config.ts + validation tests | 1 | none |
| S2 | wave-3-client-lane | none | src/lib/http/errors.ts + mapping tests | 1 | none |
| S3 | wave-3-client-lane | none | src/lib/http/csrf.ts | 1 | none |
| S4 | wave-3-client-lane | S2, S3 | src/lib/http/client.ts + src/lib/http/index.ts | 2 | none |
| S5 | wave-3-client-lane | S4 | src/test/http-handlers.ts + src/lib/http/http-client.test.ts | 3 | none |
| S6 | wave-3-client-lane | none | package.json/package-lock.json axios 1.20.0, .env.example | 1 | none |
| S7 | wave-3-client-lane | S1, S5, S6 | gate run on pinned toolchain recorded in verification.md | 4 | none |
| S8 | wave-3-client-lane | S7 | FEAT-7 records (this item) referencing EXC-0001 | 5 | none |

## Boundaries

- No changes outside `src/lib/http/**`, `src/test/http-handlers.ts`,
  `.env.example`, `package.json`/`package-lock.json` (axios pin) and
  `.context/work/FEAT-7/**`. Existing `src/test/server.ts`/`setup.ts` hooks
  stay untouched (empty server + global lifecycle preserved).
- Delivery is recorded in preflight.md before Git finalization (EXC-0001).
