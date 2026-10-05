# Verification Evidence — FEAT-7 typed HTTP client phase A

## FRONTEND-PREP Validation & Independent Review PASS (2026-10-04)

- Status: all 10 gates green on pinned toolchain; independent review PASS received on exact source SHA `e0809113f332883dc5d2156e80159fb37c68ae3d` (reviewer conversation: `1a204823-1c83-496a-8a19-9ccb8a3a3bdb`, log: `/home/hiyan/.local/share/opencode/agy-logs/2026-10-04T21-38-11-709Z-bo3guu.ndjson`).
- Producer Executor: AGY Gemini 3.8 Flash (Medium), conversation UUID: `3520c0a0-4c5a-4552-9fe9-b2bdf154f8a3`.
- Changes applied in candidate:
  - Variables/identifiers strictly en-US.
  - User-facing return status, error, and request validation messages in pt-BR (`SAFE_MESSAGES` in `error-constants.ts` and test assertions in `http-client.test.ts`).
  - Useless source comments removed mechanically across hand-authored transport files (`config.ts`, `csrf.ts`, `error-types.ts`, `error-constants.ts`, `error-parsers.ts`, `error-guards.ts`, `error-builders.ts`, `errors.ts`, `client.ts`, `index.ts`, `http-handlers.ts`, `http-client.test.ts`).
  - No PHPStan annotations introduced in TypeScript.
  - Documented standing convention in `.context/project/conventions.md` and FEAT-7 artifacts.
  - Hardening invariants preserved unchanged.
- Parent-Provided Independent Review Provenance (`e080911`):
  - Reviewer conversation: `1a204823-1c83-496a-8a19-9ccb8a3a3bdb`.
  - Verdict: PASS (0 findings), reviewed exact source SHA `e0809113f332883dc5d2156e80159fb37c68ae3d` against baseline `8684ae4b9c9843750698173fb24139e47a2a5acf`.
  - Reviewer used source read-only, its own fresh volumes, pinned Node 24.15 / npm 12.2; all 10 gates exit 0.
  - Reviewer reproduced gate counts: ci 353 packages added / 354 audited / 0 vulnerabilities; format/lint/typecheck PASS; test 100 passed (95 HTTP + 5 base); build 118 modules; CSD strict PASS; examples PASS (NO examples declared; active work items validated); unit 6 OK; doctor healthy 1.2.1.
  - Independent reviewer log: `/home/hiyan/.local/share/opencode/agy-logs/2026-10-04T21-38-11-709Z-bo3guu.ndjson`.
  - Limitations: MSW/jsdom does NOT establish real browser cookies; browser E2E NOT run; original producer log was NOT treated as tested evidence; independent conversation under same account is NOT a GitHub approving review. PASS covers exact `e080911` source SHA; source remains untouched in doc follow-up commits.
- Prior independent-review provenance: commit `8684ae4b9c9843750698173fb24139e47a2a5acf` had prior independent PASS (100/100 tests reproduced: 95 HTTP + 5 base). Recorded as historical provenance, separate from the `e080911` PASS.

### Current-revision gate runs — Fresh Isolated Docker Volumes & Containerized CSD

Executed under isolated lane-only Docker volumes (`wave3-client-lane-fresh-nm` mounted over `/work/node_modules`, `wave3-client-lane-fresh-dist` mounted over `/work/dist`) so host `node_modules` was untouched. Both frontend and CSD gates executed inside pinned Docker image `node:24.15.0-bookworm` (Python 3.11.2, Node 24.15.0).

- Volume creation:
  - `docker volume create wave3-client-lane-fresh-nm`
  - `docker volume create wave3-client-lane-fresh-dist`

| # | Gate | Exit | Command | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `npm ci` | 0 | `docker run --rm --name wave3-client-lane-ci -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 ci` | added 353 packages, audited 354 packages, 0 vulnerabilities |
| 2 | `format:check` | 0 | `docker run --rm --name wave3-client-lane-formatcheck -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run format:check` | All matched files use Prettier code style! |
| 3 | `lint` | 0 | `docker run --rm --name wave3-client-lane-lint -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run lint` | 0 errors, 0 warnings (`eslint .`) |
| 4 | `typecheck` | 0 | `docker run --rm --name wave3-client-lane-typecheck -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run typecheck` | `vue-tsc --noEmit`, 0 errors |
| 5 | `test` | 0 | `docker run --rm --name wave3-client-lane-test -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 test` | 100 passed / 0 failed across 6 test files (95 `http-client.test.ts` + 5 base) |
| 6 | `build` | 0 | `docker run --rm --name wave3-client-lane-build -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -v wave3-client-lane-fresh-dist:/work/dist -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run build` | `vue-tsc --noEmit && vite build`, 118 modules transformed, built in 684ms |
| 7 | `validate_context.py --strict` | 0 | `docker run --rm --name wave3-client-lane-csd-strict -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm python3 scripts/validate_context.py --strict` | Context validation passed |
| 8 | `validate_context.py --strict --examples` | 0 | `docker run --rm --name wave3-client-lane-csd-examples -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm python3 scripts/validate_context.py --strict --examples` | Context validation passed (no example suite installed; work items validated) |
| 9 | `unittest discover -s tests` | 0 | `docker run --rm --name wave3-client-lane-csd-unittest -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm python3 -m unittest discover -s tests -v` | Ran 6 tests, OK |
| 10 | `csd@1.2.1 doctor --scope project` | 0 | `docker run --rm --name wave3-client-lane-csd-doctor -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -v wave3-client-lane-fresh-nm:/work/node_modules -w /work node:24.15.0-bookworm npx --yes @owlcodium/context-spec-develop@1.2.1 doctor --scope project` | CSD is healthy (1.2.1) |

### Prior Initial FRONTEND-PREP Gate Runs (Historical, Candidate `ca1851e`, Pre-Isolation)

- Status: all 10 gates green; frontend run mounted host `/work` without isolated `node_modules` volume; CSD ran on host Python/npx.
- Remediated above with isolated lane-only Docker volumes and containerized CSD in `node:24.15.0-bookworm`.


### Current-revision AST compliance (TypeScript compiler traversal, incl. callbacks)

| File | Lines (max 500) | Functions (max 15) | Max Returns (max 3) | Max Params (max 7) | Else (max 0) | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/lib/http/client.ts` | 264 | 14 | 3 | 3 | 0 | PASS |
| `src/lib/http/config.ts` | 90 | 5 | 2 | 1 | 0 | PASS |
| `src/lib/http/csrf.ts` | 40 | 5 | 2 | 1 | 0 | PASS |
| `src/lib/http/error-builders.ts` | 122 | 6 | 3 | 2 | 0 | PASS |
| `src/lib/http/error-constants.ts` | 50 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/error-guards.ts` | 159 | 11 | 3 | 2 | 0 | PASS |
| `src/lib/http/error-parsers.ts` | 150 | 8 | 3 | 1 | 0 | PASS |
| `src/lib/http/error-types.ts` | 56 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/errors.ts` | 44 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/index.ts` | 33 | 0 | 0 | 0 | 0 | PASS |

### Current-revision invariant spot-checks

- Origin invariant: `validateRequestOrigin` runs before CSRF bootstrap; foreign absolute URLs, protocol-relative escapes (`//`, `\\`, `/\`, `\/`, backslash paths), `allowAbsoluteUrls: true`, mutated `defaults.baseURL`, String-object/non-string URL/baseURL fail closed with 0 outbound MSW dispatch. Same-origin absolute URLs permitted.
- BaseURL validation: `resolveEffectiveBaseUrl` enforces non-empty string matching trusted origin; empty/whitespace/non-string values fail closed.
- No auto-replay on 419: response interceptor resets coordinator, maps typed error, never re-dispatches mutations.
- Singleflight generation race safety: generation counter prevents stale in-flight failures from resetting newer generations.
- Safe messages in pt-BR: safe fixed messages in pt-BR; raw response body never copied into safe message or exception (no PII/credential leaks).
- Null-prototype fieldErrors: JSON `__proto__` and `constructor` keys preserved as plain fields without prototype pollution.
- No `eslint-disable`, `@ts-`, `as any`, `console`, or TODO/FIXME in production code. Protected files (`src/test/server.ts`, `setup.ts`, `vite.config.ts`, router, providers, UI) untouched.
- At the Phase A verification checkpoint, Stage B had not been approved and no draft contract was generated. The later parent-authorized source pin is verified in the Stage B section below; no claim that E2E/MSW proves browser cookies.

## Prior Validation — M1/M2/Minor Revision (Historical, 2026-10-04)

- Status: all 10 gates green on pinned toolchain; independent review PASS at `8684ae4`.
- Validator: native fixer lane, model `opencode-go/muse-spark-1.3-contributor` (no AGY, no subagents). Native CLI session ID: NOT FOUND (not exposed to agent).
- Changes since `fd00a34`: `client.ts` (`validateBaseUrlOverride` → `resolveEffectiveBaseUrl`: every effective merged baseURL must be a primitive non-empty string matching trusted origin; non-string `url` rejected; `trustedBaseUrl` fallback removed so validated target equals dispatched target), `error-parsers.ts` (null-prototype field record), `http-client.test.ts` (+13 regressions), FEAT-7 docs.
- Prior gate run on `fd00a34` source (87/87) is preserved in the historical section below; the runs here are on the current revision.

### Prior gate runs on `8684ae4` (pinned `node:24.15.0-bookworm` + `npx --yes npm@12.2.0`)

| # | Gate | Exit | Evidence |
| --- | --- | --- | --- |
| 1 | `npm ci` | 0 | added 353, audited 354 packages, 0 vulnerabilities |
| 2 | `format:check` | 0 | All matched files use Prettier code style (2 files auto-formatted with prettier before re-run) |
| 3 | `lint` | 0 | 0 errors, 0 warnings |
| 4 | `typecheck` | 0 | `vue-tsc --noEmit`, 0 errors |
| 5 | `test` | 0 | 100 passed / 0 failed across 6 files (95 `http-client.test.ts` + 5 baseline) |
| 6 | `build` | 0 | `vue-tsc --noEmit && vite build` success |
| 7 | `validate_context.py --strict` | 0 | Context validation passed |
| 8 | `validate_context.py --strict --examples` | 0 | passed (no example suite installed; work items validated) |
| 9 | `unittest discover -s tests` | 0 | Ran 6 tests, OK |
| 10 | `csd@1.2.1 doctor --scope project` | 0 | CSD is healthy (1.2.1) |

## Prior Validation — `fd00a34` Revision (Historical, Preserved As Reported)

- Status: all 10 gates green on pinned toolchain; independent re-review PENDING.
- Validator: native fixer lane, model `opencode-go/muse-spark-1.3-contributor` (AGY quota exhausted; no AGY call, no subagents). Native CLI session ID: NOT FOUND (not exposed to agent).
- Historical sections below are the prior AGY producer's reports, preserved as reported (not re-attested except where re-run here).
- Lint fix applied by validator (in-scope, directly relevant): the L4 partial introduced 2 eslint errors in `src/lib/http/config.ts` (`no-control-regex` on `/[\x00-\x1F\x7F]/`, `no-useless-escape` on `[^\/...]`). Fixed without suppressions: control check is now iterative char-code helper `hasControlCharacters` (named constants `CONTROL_CHARACTER_MAX`, `DELETE_CHARACTER_CODE`); class escape reduced to `[^/\s?#\\]`. Behavior unchanged (87/87 tests, incl. TAB/CR/LF lexical tests).
- `node_modules/.bin` was root-owned from a prior docker gate run (host `npm ci` denied EACCES, no sudo); gates re-ran via the same pinned docker path as the producer (`node:24.15.0-bookworm` + `npx --yes npm@12.2.0`).

### Final gate runs (validator, pinned toolchain)

| # | Gate | Exit | Evidence |
| --- | --- | --- | --- |
| 1 | `npm ci` | 0 | added 353, audited 354 packages, 0 vulnerabilities |
| 2 | `format:check` | 0 | All matched files use Prettier code style |
| 3 | `lint` | 0 | 0 errors, 0 warnings (after 2-error fix above) |
| 4 | `typecheck` | 0 | `vue-tsc --noEmit`, 0 errors |
| 5 | `test` | 0 | 87 passed / 0 failed across 6 files (82 `http-client.test.ts` + 5 baseline) |
| 6 | `build` | 0 | `vue-tsc --noEmit && vite build`, built in 884ms |
| 7 | `validate_context.py --strict` | 0 | Context validation passed |
| 8 | `validate_context.py --strict --examples` | 0 | passed (no example suite installed; work items validated) |
| 9 | `unittest discover -s tests` | 0 | Ran 6 tests, OK |
| 10 | `csd@1.2.1 doctor --scope project` | 0 | CSD is healthy (1.2.1) |

### Final AST compliance (validator, TypeScript compiler traversal, incl. callbacks)

| File | Lines (max 500) | Functions (max 15) | Max Returns (max 3) | Max Params (max 7) | Else (max 0) | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/lib/http/client.ts` | 278 | 14 | 3 | 3 | 0 | PASS |
| `src/lib/http/config.ts` | 115 | 5 | 2 | 1 | 0 | PASS |
| `src/lib/http/csrf.ts` | 52 | 5 | 3 | 1 | 0 | PASS |
| `src/lib/http/error-builders.ts` | 127 | 6 | 3 | 2 | 0 | PASS |
| `src/lib/http/error-constants.ts` | 54 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/error-guards.ts` | 164 | 11 | 3 | 2 | 0 | PASS |
| `src/lib/http/error-parsers.ts` | 156 | 8 | 3 | 1 | 0 | PASS |
| `src/lib/http/error-types.ts` | 67 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/errors.ts` | 55 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/index.ts` | 43 | 0 | 0 | 0 | 0 | PASS |

### Final invariant spot-checks (validator, code + tests)

- Origin invariant: `validateRequestOrigin` runs before CSRF bootstrap; per-request `baseURL` override, foreign absolute URLs, protocol-relative escapes (`//`, `\\`, `/\`, `\/`, backslash paths), `allowAbsoluteUrls: true`, and mutated `instance.defaults.baseURL` all rejected fail-closed with zero MSW outbound dispatch (tests lines 126-268). Same-origin absolute URLs permitted.
- No auto-replay on 419: response interceptor only resets coordinator, maps typed error, never re-dispatches (client.ts `mapTransportError`/`mapAxiosError`; test line 430).
- CSRF single-flight/reset race: generation counter prevents stale in-flight failure from clearing newer generation (csrf.ts 23-51; test line 355).
- PII: no `console`, `localStorage`/`sessionStorage`, `as any`, `eslint-disable`, or TODO in `src/lib/http` production code; raw response text never enters messages (test line 706); `InvalidApiBaseUrlError` never echoes raw input (test line 795).
- Lexical base URL: control check on raw input before trim; explicit authority pattern rejects `http:example.com`, `http:/example.com`, `http:///example.com`; backslash rejection (config.ts; tests lines 722-824).
- IMF-fixdate: full day/month/year/hour/minute/second component validation; rejects Feb 31, non-leap Feb 29, Apr 31, time overflows; accepts Feb 29 2028 (error-parsers.ts 86-118; tests lines 620-643).

## Producer Reports (Historical, Preserved As Reported)

> The sections below are the prior AGY producer's (conversation `e2dea9a6-11ed-484f-a15d-f6ab2770cc7b`) evidence for revisions `540577b`/`55ba288` plus the dirty L4 partial. Preserved verbatim except this header.

## Summary

- Status: verify complete; producer checks passed cleanly on pinned toolchain; independent re-review PENDING.
- Date: 2026-10-04
- Executor: AGY Gemini 3.8 Flash (High) (headless Google AI Pro harness)
- Conversation UUID: `e2dea9a6-11ed-484f-a15d-f6ab2770cc7b`
- Worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree`
- Branch: `feat/wave-3-http-client`
- Base revision: `f59ba30d3c035059a08f73ee22e43233ab484f7f`
- Prior revision: `540577bc75f3a6ea8a087abd222f672a1b288875` (FAIL in user-reported review; remediated below)

## Toolchain & Runtime Environment

- Node.js: `v24.15.0` (pinned via `node:24.15.0-bookworm` container)
- npm: `12.2.0` (pinned via `npx --yes npm@12.2.0` under container)
- TypeScript: `6.0.3` (pinned in `package.json`)
- Axios: `1.20.0` (pinned in `package.json` and `package-lock.json`)
- Context checks: Python 3 on host system per `.context/project/quality.md`

## Producer Gate Runs (Remediated Revision)

### 1. Dependency installation (`npm ci`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 ci`
- Exit code: `0`
- Result summary: Added 353 packages, audited 354 packages in 8s. 0 vulnerabilities found.

### 2. Code formatting (`npm run format:check`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run format:check`
- Exit code: `0`
- Result summary: All matched files use Prettier code style!

### 3. Static analysis & linting (`npm run lint`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run lint`
- Exit code: `0`
- Result summary: `eslint .` completed with 0 errors and 0 warnings.

### 4. TypeScript type checking (`npm run typecheck`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run typecheck`
- Exit code: `0`
- Result summary: `vue-tsc --noEmit` completed with 0 errors.

### 5. Automated tests (`npm test`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 test`
- Exit code: `0`
- Test count: 59 passed | 0 failed (59 total across 6 test files)
  - `src/lib/http/http-client.test.ts`: 54 passed:
    - transport configuration (withCredentials, withXSRFToken, timeout, headers, no global pollution)
    - origin invariant & zero outbound dispatch (foreign absolute URL GET/POST, protocol-relative `//` and `\\`, foreign baseURL override, allowAbsoluteUrls override, defaults mutation, same-origin absolute allowance)
    - CSRF bootstrap flow (mutating vs GET, all mutating methods, single-flight dedup, caching, inflight reset race, header mirroring, 419 reset without retry)
    - typed error mapping (401, 403, 404, 409, 500, 502, 503, 504, 418, 650, network, timeout abort, cancelled, Retry-After delay-seconds & IMF-fixdate & overflow bounds & impossible calendar date rejection, 422 field errors, PII protection)
    - api base url validation & factory boundary (missing, empty, blank, not-a-url, ftp, embedded credentials, query, fragment, backslash rejection, normalization, factory boundary, env resolution)
    - type guards and structural variant validation (narrowing genuine vs rejecting malformed, specific guards, buildHttpError fail-closed handling on malformed/primitives/prototype pollution, out-of-bounds status codes <100 and >599)
  - `src/app/router/router.test.ts`: 1 passed
  - `src/app/providers/providers.test.ts`: 1 passed
  - `src/shared/layouts/PublicLayout.test.ts`: 1 passed
  - `src/shared/layouts/AuthLayout.test.ts`: 1 passed
  - `src/features/auth/pages/PublicHomePage.test.ts`: 1 passed

### 6. Production build (`npm run build`)
- Command: `docker run --rm -v /home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree:/work -w /work node:24.15.0-bookworm npx --yes npm@12.2.0 run build`
- Exit code: `0`
- Result summary: `vue-tsc --noEmit && vite build` completed; 118 modules transformed, client assets rendered cleanly in 625ms.

### 7. Context specification validator (`validate_context.py --strict`)
- Command: `python3 scripts/validate_context.py --strict`
- Exit code: `0`
- Result summary: All structural, schema, links, governance, exception, and work-item checks passed.

### 8. Context examples validator (`validate_context.py --strict --examples`)
- Command: `python3 scripts/validate_context.py --strict --examples`
- Exit code: `0`
- Result summary: Validation passed.

### 9. Python adapter unit tests (`unittest discover`)
- Command: `python3 -m unittest discover -s tests -v`
- Exit code: `0`
- Result summary: 6 adapter tests passed (OK).

### 10. Upstream CSD project doctor (`@owlcodium/context-spec-develop@1.2.1 doctor`)
- Command: `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project`
- Exit code: `0`
- Result summary: Project context validated successfully.

## CSD Code Quality Policy Compliance (AST Audit)

Audited with TypeScript compiler AST traversal counting all declared functions, arrow functions, and method declarations:

| File | Lines (max 500) | Functions (max 15) | Max Returns (max 3) | Else statements (max 0) | Status |
| --- | --- | --- | --- | --- | --- |
| `src/lib/http/client.ts` | 278 | 14 | 3 | 0 | PASS |
| `src/lib/http/config.ts` | 91 | 4 | 2 | 0 | PASS |
| `src/lib/http/csrf.ts` | 52 | 5 | 2 | 0 | PASS |
| `src/lib/http/error-builders.ts` | 127 | 6 | 3 | 0 | PASS |
| `src/lib/http/error-constants.ts` | 54 | 0 | 0 | 0 | PASS |
| `src/lib/http/error-guards.ts` | 164 | 11 | 3 | 0 | PASS |
| `src/lib/http/error-parsers.ts` | 123 | 8 | 3 | 0 | PASS |
| `src/lib/http/error-types.ts` | 67 | 0 | 0 | 0 | PASS |
| `src/lib/http/errors.ts` | 55 | 0 | 0 | 0 | PASS |
| `src/lib/http/index.ts` | 43 | 0 | 0 | 0 | PASS |

## Protected File Integrity Verification

SHA-256 checksums demonstrate that protected test hooks and sibling API files were unmodified:

| File path | Baseline SHA-256 | Final SHA-256 | Status |
| --- | --- | --- | --- |
| `src/test/server.ts` | `2d3f8b9f6a0c4645c73de5b86eb38a7adbf92dcd62d638eee3e9addfcc03b631` | `2d3f8b9f6a0c4645c73de5b86eb38a7adbf92dcd62d638eee3e9addfcc03b631` | MATCH |
| `src/test/setup.ts` | `c8d122f9cb3760bbcee6372481e7a46ac55b587b5b61d796f9d56edf43456fa3` | `c8d122f9cb3760bbcee6372481e7a46ac55b587b5b61d796f9d56edf43456fa3` | MATCH |
| `vite.config.ts` | `d57d6be66367f09e98c5bfc75ec5e3240bfd24365f8838a3c1bf5a266d59a8d0` | `d57d6be66367f09e98c5bfc75ec5e3240bfd24365f8838a3c1bf5a266d59a8d0` | MATCH |
| `starter-kit-api/.context/project/api.md` | `814ed58c76655f7b9fcee17c4243c4fc5b9e93fd09fa08bb3c997b3e80c6bdbc` | `814ed58c76655f7b9fcee17c4243c4fc5b9e93fd09fa08bb3c997b3e80c6bdbc` | MATCH |
| `starter-kit-api/.context/project/openapi.yaml` | `88bd0197ca53c15ad6cc54d739da8c3d7c8179e6030412676784d70a6971a894` | `88bd0197ca53c15ad6cc54d739da8c3d7c8179e6030412676784d70a6971a894` | MATCH |

## Orval Stage B Candidate — Fresh Docker Verification (2026-10-05)

- Container: `node:24.15.0-bookworm`; npm `12.2.0`; fresh named volumes `wave3-feat7-ci-nm` and `wave3-feat7-ci-dist`; source mounted from this worktree. `node_modules` on host was not used or modified. Python ran with `PYTHONDONTWRITEBYTECODE=1`.
- Complete gate command log: `/tmp/opencode/luna-frontend-generation/wrapper-logs/full-gates-attempt.log` and `/tmp/opencode/luna-frontend-generation/wrapper-logs/remaining-gates.log`; CSD/doctor log: `/tmp/opencode/luna-frontend-generation/wrapper-logs/csd-doctor.log`. First/second generated-tree hash manifests are in the same scratch log directory.

| Gate | Command in pinned container | Result |
| --- | --- | --- |
| Install | `npm ci` | PASS; 414 added, 415 audited, 0 vulnerabilities |
| Dependency pin | `npm ls orval esbuild @esbuild/linux-x64 --depth=2` | PASS; Orval 8.39.0; esbuild and Linux binary 0.28.2 |
| Audit | `npm audit --audit-level=low` | PASS; 0 vulnerabilities |
| Format | `npm run format:check` | PASS |
| Lint | `npm run lint` | PASS; 0 errors/warnings |
| Types | `npm run typecheck` | PASS |
| Offline source/provenance | `npm run contract:verify` | PASS; no remote API access |
| Generation | `npm run client:generate` twice | PASS; both runs generated 24 files; all per-file SHA-256 entries identical |
| Generated diff | `git diff --exit-code -- src/lib/api/generated` and `git ls-files --others --exclude-standard -- src/lib/api/generated` | PASS after staging; no unstaged or untracked generated output |
| Vitest | `npm test` | PASS; 105/105 across 7 files (95 existing HTTP + 5 existing base + 5 new mutator tests) |
| Build | `npm run build` | PASS; 118 modules, 869 ms |
| Context strict | `python3 scripts/validate_context.py --strict` | PASS |
| Context examples | `python3 scripts/validate_context.py --strict --examples` | PASS; no example suite installed; active work items validated |
| Python unit | `python3 -m unittest discover -s tests -v` | PASS; 14/14 (6 existing validator tests + 8 new contract verifier tests) |
| Doctor | `npx --yes @owlcodium/context-spec-develop@1.2.1 doctor --scope project` | PASS; CSD healthy 1.2.1 |

The first external hash-comparison one-liner failed due its own `str`/`bytes` mismatch after both Orval runs had completed. Correct comparison read both manifests and files as bytes: 24/24 generated files are byte-identical. The initial strict-context run also caught placeholder-like syntax in the new prose; the wording was corrected and strict/examples then passed.

### CSD structural review of hand-authored additions

TypeScript compiler AST counted declarations and inline callbacks; generated Orval output is excluded because generator owns it and regeneration is deterministic. Python AST review covered verifier and tests.

| File | Lines | Functions/callbacks | Max returns/function | Max params | Else | Non-null assertion | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `orval.config.ts` | 31 | 1 | 0 | 0 | 0 | 0 | PASS |
| `src/lib/http/orval-mutator.ts` | 57 | 4 | 1 | 2 | 0 | 0 | PASS |
| `src/lib/http/orval-mutator.test.ts` | 161 | 12 | 1 | 3 | 0 | 0 | PASS |
| `scripts/generate-client.mjs` | 27 | 0 | 0 | 0 | 0 | 0 | PASS |
| `scripts/check-client-generated.mjs` | 24 | 0 | 0 | 0 | 0 | 0 | PASS |
| `scripts/verify_contract.py` | 203 | 5 | 3 | 4 | 0 | N/A | PASS |
| `tests/test_contract_verifier.py` | 83 | 8 | 0 | 1 | 0 | N/A | PASS |

SHA-preserved upstream verifier files were also AST-counted: `contract_cli.py` 185 lines/4 functions/max 3 returns/1 parameter; `contract_core.py` 390/15/1/5; `contract_extract.py` 182/6/1/3. All have zero `else` branches and satisfy the same ceilings.

### Artifact and dependency reconciliation

- `openapi/artifact.zip`: 2,044 bytes, SHA-256 `0d019b1adfc1d9d3f3fb65f0544d15fcc0d51a7361e23508204c8e2a5646a6fe`.
- `openapi/openapi.json`: 21,323 bytes, SHA-256 `ed772d267e56784b9a847743575a242b049697ffe35369c541913903c0b24914`.
- `openapi/contract-pin.json`: SHA-256 `7eb4157b25e9c9fdaf34ecac2d15e3f3771d3fff30945bffd7c2bcabee89f41f`.
- `orval`: manifest, lockfile and installed version all `8.39.0`; SRI `sha512-QHMA1sYzmUCAh5CJN3t/s+/JfphIM8JUjShi1oRhhX4YDk59nAnl/lDXMSMWprw0kFmZJs3HTnYBInLW4CafyQ==`.
- `esbuild`: lockfile SRI `sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==`, matching public registry metadata and audited tarball. Exact-version script allow only.
- Lock delta versus starting HEAD: 86 new package records, 0 removed, 0 existing package-version changes.

Generation is validated offline against the externally pinned parent policy. No generated output was edited manually; no DTO was authored by hand. Tests use local Axios adapter fixtures only; no MSW/browser/network/cookie evidence is claimed.
