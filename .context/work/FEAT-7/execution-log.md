# Execution Log — FEAT-7 typed HTTP client phase A

## Provenance and Identity

- Date: 2026-10-04
- Producer Agent: AGY Gemini 3.8 Flash (High) (headless Google AI Pro harness)
- Conversation UUID: `e2dea9a6-11ed-484f-a15d-f6ab2770cc7b`
- Execution PID: `NOT FOUND` (agent process PID not exposed directly by harness)
- Raw transcript log: `/home/hiyan/.gemini/antigravity-cli/brain/e2dea9a6-11ed-484f-a15d-f6ab2770cc7b/.system_generated/logs/transcript.jsonl`
- Worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree`
- Branch: `feat/wave-3-http-client`
- Base revision: `f59ba30d3c035059a08f73ee22e43233ab484f7f` (`origin/main`, verified clean)

## Former Fixer Adoption Baseline

- Handover baseline: the branch contained a dirty partial from a former fixer.
- Baseline git status:
  - Modified: `package.json`, `package-lock.json` (`axios: 1.20.0` dependency pinned).
  - Untracked: `.env.example`, `src/lib/http/` (`config.ts`, `csrf.ts`, `errors.ts`, `client.ts`, `index.ts`, `README.md`, `http-client.test.ts`, `debug.test.ts`), `src/test/http-handlers.ts`, `.context/work/FEAT-7/`.
- Former fixer defect analysis:
  1. Test mock CORS flaw: `http-handlers.ts` used wildcard `*` with credentials and missed CORS response headers, causing jsdom's XHR to fail every cross-origin request as a network error.
  2. `debug.test.ts`: temporary scratch file comparing raw axios and client with `expect(true).toBe(true)` and raw console logs; removed cleanly.
  3. Error re-mapping: `client.ts` remapped internal typed `HttpError` thrown during bootstrap into `unexpected` kind.
  4. Inflight reset race: `csrf.ts` lacked generation counter, allowing stale in-flight failures to wipe subsequent generations.
  5. Validation boundaries: `asRecord` accepted arrays; `isHttpError` checked only `kind` allowing forged malformed objects; HTTP status bounds allowed >599; Retry-After lacked IMF-fixdate validation and overflow protection; `createHttpClient` bypassed URL validation.
  6. Documentation inaccuracies: preflight and discovery falsely claimed sibling API documentation was `NOT FOUND`. Sibling `.context/project/api.md` and `openapi.yaml` exist as manually reviewed preimplementation draft contracts.

## Initial Producer Revision (`540577bc75f3a6ea8a087abd222f672a1b288875`)

- Executed initial refactor addressing items 1-6 above.
- Verified all 10 gates passed cleanly on pinned Node 24.15/npm 12.2.0 (48/48 tests passed).
- Committed and pushed as `540577bc75f3a6ea8a087abd222f672a1b288875`.

## Independent Review Intake & Remediation

User reported that independent review of commit `540577b` resulted in `FAIL` with 2 Medium findings and 2 Low findings:
1. **R1 (Medium Security)**: `client.ts` allowed foreign absolute URLs, protocol-relative escapes, and foreign `baseURL` overrides with credentials and XSRF headers attached.
2. **R2 (Medium Policy)**: `errors.ts` had 39 syntactic functions/methods/callbacks, exceeding the CSD $\le 15$ limit.
3. **L3 (Low Robustness)**: `buildHttpError` lacked fail-closed guards against malformed inputs and prototype pollution.
4. **L4 (Low Parsing)**: Missing backslash check in `parseApiBaseUrl`, calendar date rollover in `parseHttpDate`, and status bounds test assertion.

### Remediations Implemented:

1. **R1 Security Origin Invariant (`client.ts`)**:
   - Captured `trustedOrigin` and `trustedBaseUrl` immutably in `createHttpClient`.
   - Added `validateRequestOrigin` into request interceptor running *before* `attachCsrf` and adapter dispatch.
   - Rejects foreign absolute URLs, protocol-relative escapes (`//`, `\\`, `/\`, `\/`, `\`), and foreign `baseURL` overrides fail-closed with `HttpError` (`kind: "unexpected"`).
   - Added 7 regression tests asserting 0 MSW requests are dispatched (zero outbound traffic) and sensitive tokens are not leaked in errors.
2. **R2 CSD Function Decomposition (`src/lib/http/`)**:
   - Cohesively split `errors.ts` into cycle-free sub-modules:
     - `error-types.ts`: 0 functions, 67 lines.
     - `error-constants.ts`: 0 functions, 54 lines.
     - `error-parsers.ts`: 8 functions, 123 lines.
     - `error-guards.ts`: 11 functions, 164 lines.
     - `error-builders.ts`: 6 functions, 127 lines.
     - `errors.ts`: stable facade re-exporting all symbols (0 functions, 55 lines).
   - Replaced nested array callbacks with iterative loops.
   - AST script verified: every production file has $\le 14$ functions/callbacks (ceiling 15), $\le 3$ returns per function, 0 `else`/`else if`, and $\le 278$ lines (ceiling 500).
3. **L3 Robustness (`error-builders.ts`)**:
   - Hardened `buildHttpError(input: unknown)` to fail closed on non-objects, malformed shapes, and prototype pollution attempts (`KNOWN_KINDS_SET`).
   - Added unit tests for primitives, arrays, null, undefined, `{ kind: '__proto__' }`, `{ kind: 'toString' }`.
4. **L4 Parsing Robustness (`config.ts`, `error-parsers.ts`, `http-client.test.ts`)**:
   - `parseApiBaseUrl`: added explicit check rejecting backslashes (`\`).
   - `parseHttpDate`: added UTC day-of-month check (`getUTCDate() === expectedDay`) to reject impossible calendar dates (e.g. Feb 31).
   - Direct status bounds assertions (< 100 and > 599) added for both `buildHttpError` and `isHttpError`.
5. **Prettier & Quality**:
   - Formatted all modified files with Prettier.
   - Re-verified all 10 gates (59/59 tests passed, 54 in `http-client.test.ts`).

## M1/M2/Minor Fix Revision (2026-10-04)

- Executor: native fixer lane, model `opencode-go/muse-spark-1.3-contributor` (user-selected; no AGY, no subagents). Native CLI session ID: NOT FOUND (not exposed to agent).
- Input: independent GLM review (`ses_ef7b986d3ffeWHKrJX05yvbMTI`) verdict PASS on `fd00a34` with 2 medium (M1 effective-empty-baseURL, M2 non-string-baseURL) + 1 minor (`__proto__` field record); old findings confirmed closed.
- Fixes: `resolveEffectiveBaseUrl` (primitive non-empty trusted-origin-only; unspecified option retains captured default and passes), non-string `url` rejection, null-prototype field record; 13 new regression tests (100/100 total); full 10-gate set green; AST PASS all files. Evidence in `verification.md` (M1/M2/Minor section).
- Current review: PENDING until new independent review. No reviewer approval claimed.

## Final Native Validation of `fd00a34` (2026-10-04, Historical)

- Validator: native fixer lane, model `opencode-go/muse-spark-1.3-contributor` (user-selected; AGY quota exhausted, Sol coordination only, no subagents). Native CLI session ID: NOT FOUND (not exposed to agent).
- Adopted 6 dirty AGY partials as instructed (no reset/stash/discard): `src/lib/http/config.ts`, `error-parsers.ts`, `http-client.test.ts`, `README.md`, `.context/work/FEAT-7/review.md`, `spec.md`.
- One in-scope fix: 2 eslint errors from L4 partial in `config.ts` (control-regex, useless-escape) resolved without suppressions via iterative `hasControlCharacters` + class-escape reduction. Behavior unchanged.
- Re-ran full 10-gate set on pinned toolchain via docker (`node:24.15.0-bookworm`, `npm@12.2.0`): all green, 87/87 tests, AST PASS on all 10 production files. Evidence in `verification.md` (Final Validation section).
- Independent re-review remains PENDING (reviewer lane owns that gate).

## FRONTEND-PREP Revision (Standing User Convention & Clean-up, 2026-10-04)

- Date: 2026-10-04
- Executor: AGY Gemini 3.8 Flash (Medium)
- Conversation UUID: `3520c0a0-4c5a-4552-9fe9-b2bdf154f8a3`
- Raw transcript log: `/home/hiyan/.gemini/antigravity-cli/brain/3520c0a0-4c5a-4552-9fe9-b2bdf154f8a3/.system_generated/logs/transcript.jsonl`
- Worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree`
- Branch: `feat/wave-3-http-client`
- Baseline revision: `8684ae4b9c9843750698173fb24139e47a2a5acf` (prior independent-review provenance: PASS, 100/100 tests)
- Actions executed:
  1. Applied standing user convention: variables/identifiers in en-US; user-facing return status, error, and request validation messages in pt-BR (`SAFE_MESSAGES` in `error-constants.ts`, assertions in `http-client.test.ts`).
  2. Removed useless source comments mechanically from hand-authored transport files (`config.ts`, `csrf.ts`, `error-types.ts`, `error-constants.ts`, `error-parsers.ts`, `error-guards.ts`, `error-builders.ts`, `errors.ts`, `client.ts`, `index.ts`, `http-handlers.ts`, `http-client.test.ts`).
  3. No PHPStan annotations introduced in TypeScript.
  4. Preserved all hardening invariants unchanged: immutable origin invariant, prebootstrap adapter, zero outbound traffic in negative cases, baseURL typechecks, singleflight generation reset, 419 never replay mutations, Retry-After strict IMF handling/leap dates, null-prototype fieldErrors including `__proto__`/`constructor`.
  5. Documented standing user convention in `.context/project/conventions.md` and FEAT-7 artifacts.
  6. Re-ran full 10-gate suite under pinned Docker toolchain (`node:24.15.0-bookworm`, `npm@12.2.0`) and host Python CSD tooling: 100/100 tests passed, AST PASS on all 10 production files.
  7. Independent re-review on the updated candidate SHA remains PENDING (parent schedules independent review).

## Blockers and Deferred Stages

- Stage B (typed client generation with Orval 8.39.0 custom-mutator integration and generated types) remains deferred and explicitly NOT approved (OpenAPI Stage B b0d not approved; parent waiting for corrected ACTUAL main publication + verified receipt). DO NOT generate Orval from draft/runtime candidate.
- Real-browser cookie issuance and cross-origin CORS policy remain deferred to real-API E2E under SPA #17; MSW tests do not claim to prove browser cookies.
