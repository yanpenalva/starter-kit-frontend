# Verification Evidence — FEAT-7 typed HTTP client phase A

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
