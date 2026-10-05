# Plan — FEAT-7 typed HTTP client phase A (Issue #7)

Single lane (wave-3 client worktree). Phase A transport is established; this
continuation executes Stage B against the parent-approved artifact receipt.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | wave-3-client-lane | none | src/lib/http/config.ts + validation tests | 1 | none |
| S2 | wave-3-client-lane | none | src/lib/http/errors.ts + mapping tests | 1 | none |
| S3 | wave-3-client-lane | none | src/lib/http/csrf.ts | 1 | none |
| S4 | wave-3-client-lane | S2, S3 | src/lib/http/client.ts + src/lib/http/index.ts | 2 | none |
| S5 | wave-3-client-lane | S4 | src/test/http-handlers.ts + src/lib/http/http-client.test.ts | 3 | none |
| S6 | wave-3-client-lane | none | package.json/package-lock.json axios 1.20.0, .env.example | 1 | none |
| S7 | wave-3-client-lane | S1, S5, S6 | gate run on pinned toolchain recorded in verification.md | 4 | none |
| S8 | wave-3-client-lane | S7 | FEAT-7 records (this item) referencing EXC-0001 | 5 | none |
| S9 | wave-3-client-lane | S4, S5 | R1 origin invariant interceptor + zero-outbound tests | 6 | security |
| S10 | wave-3-client-lane | S2 | R2 error domain CSD decomposition + AST compliance audit | 6 | core |
| S11 | wave-3-client-lane | S9, S10 | L3/L4 robustness & date fixes + 10 pinned gate re-run | 7 | testing |
| S12 | wave-3-client-lane | S11 | M1/M2/minor fixes (resolveEffectiveBaseUrl, null-proto fields) + 13 tests (100 total) | 8 | testing |
| S13 | wave-3-client-lane | S12 | FRONTEND-PREP: standing convention (pt-BR safe messages, comments cleanup, en-US IDs) + 10-gate docker verification | 9 | project |
| S14 | wave-3-client-lane | S13 | exact Orval 8.39.0 pin, reviewed esbuild script allow, provenance verifier and committed source pin | 10 | security, testing, project |
| S15 | wave-3-client-lane | S14 | central mutator, Vue Query client generation, typed output and transport tests | 11 | architecture, testing |
| S16 | wave-3-client-lane | S15 | full pinned Docker gates, generation determinism, offline CI and exact-diff review | 12 | core, testing, project |

## Next Wave 3 Dependencies

- Stage B was authorized for this continuation only against API `main` commit `e646c34a280b851847676af290494e872edcaa9b` and receipt/artifact identities recorded in `orval-stage-b.md`; no draft or fallback snapshot is accepted.
- Real-browser cookie issuance and cross-origin CORS policy remain deferred to real-API E2E under SPA #17. MSW unit tests do not claim to prove browser cookies.

## Boundaries

- Stage B additions: `openapi/**`, `orval.config.ts`,
  `src/lib/api/generated/**`, `src/lib/http/orval-mutator*`,
  `scripts/verify_contract.py`, `scripts/generate-client.mjs`,
  `scripts/check-client-generated.mjs`, the narrowly scoped vendor verifier,
  package/lock, `.github/workflows/contract-client.yml`, and FEAT-7/project/ADR
  evidence plus `.env.example` root-origin clarification.
- No UI, styles/layout, router, providers, auth state/guards/screens, token
  persistence, external API calls in CI, or real-browser/E2E changes. Existing
  `src/test/server.ts`/`setup.ts` hooks stay untouched.
- Delivery is recorded in preflight.md before Git finalization (EXC-0001).
