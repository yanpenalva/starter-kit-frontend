# Review — FEAT-7 typed HTTP client phase A

## Status: PENDING — independent re-review required on updated candidate SHA

No independent review approval has been granted for this revision. Per the
delivery model (`.context/project/delivery.md`), independent agent review is a
separate gate owned by the reviewer lane. The author/producer cannot self-approve.
The work item remains active and not completed.

### Prior Independent Review Provenance — Commit `8684ae4` (Attribution Record)

- Revision: `8684ae4b9c9843750698173fb24139e47a2a5acf`
- Independent Review Verdict: PASS
- Test count reproduced: 100/100 tests (95 HTTP + 5 base)
- Recorded accurately as prior independent-review provenance, NOT as our own new independent review.
- The parent schedules independent review of the changed exact SHA; our producer role is to reproduce applicable gates ourselves, not substitute for independent review.

### Current FRONTEND-PREP Revision (Standing Convention Applied)

- Applies new standing user convention within scope:
  - Variables/identifiers strictly en-US.
  - User-facing return status, error, and request validation messages in pt-BR (`SAFE_MESSAGES` in `error-constants.ts` and test assertions in `http-client.test.ts`).
  - Useless source comments removed mechanically; machine/tool directives and legal notices preserved.
  - No PHPStan annotations in TypeScript.
- Hardening invariants remain unchanged and verified:
  - Immutable trusted origin.
  - Prebootstrap adapter.
  - Zero outbound traffic in negative cases.
  - BaseURL typechecks (resolveEffectiveBaseUrl).
  - Singleflight generation reset.
  - 419 never replay mutations.
  - Retry-After strict IMF handling/leap dates.
  - Null-prototype fieldErrors including `__proto__`/`constructor`.
  - No manually authored DTOs or generated DTOs.
  - No tokens/profile PII storage.
  - OpenAPI Stage B b0d explicitly NOT approved; parent waiting for corrected ACTUAL main publication + verified receipt.
  - No premature Orval generation or browser-cookie claims.
- Current review status: PENDING until parent independent review of the exact candidate SHA.

## Review History

### Revision 1 (`540577bc75f3a6ea8a087abd222f672a1b288875`) — FAIL (User-Reported Review)

An independent reviewer evaluated commit `540577bc75f3a6ea8a087abd222f672a1b288875` and reported a `FAIL` verdict with 2 Medium findings and Low findings:

1. **R1 (Medium - Security)**: `client.ts` permitted axios `allowAbsoluteUrls` default behavior. Requests targeting foreign origins (`https://foreign/x`), protocol-relative URLs (`//`, `\\`), or overriding `baseURL` to a foreign host could dispatch credentials (`withCredentials: true`) and XSRF headers to untrusted origins.
2. **R2 (Medium - Policy)**: `errors.ts` exceeded the CSD limit of $\le 15$ declared production functions/methods per file when counting all syntactic function/method nodes (named functions, arrow functions, and method callbacks; reviewer counted 15 named + 24 arrows = 39).
3. **L3 (Low - Robustness)**: `buildHttpError` lacked fail-closed validation against malformed, non-object, or prototype-polluting input structures (`__proto__`, `toString`, `constructor`).
4. **L4 (Low - Parsing / Lexical)**: User brief was initially truncated; producer applied preliminary hardening (backslash checks, calendar day check, bounds).

### Revision 2 (`55ba288af6406991a9894107f432d4034ea3bece`) — Producer Green, Review PENDING

- Remediated R1: captured immutable trusted origin in `createHttpClient` and added request interceptor validating URLs before CSRF bootstrap and network dispatch, ensuring zero outbound requests for blocked foreign targets.
- Remediated R2: cohesively split `errors.ts` into cycle-free sub-modules (`error-types.ts`, `error-constants.ts`, `error-parsers.ts`, `error-guards.ts`, `error-builders.ts`, and facade `errors.ts`). AST script verified $\le 14$ functions/file, $\le 3$ returns, 0 `else`.
- Remediated L3: hardened `buildHttpError` against prototype pollution and malformed shapes.
- Note on L4 attribution: Previous prompt brief truncated L4; producer implemented preliminary backslash/calendar/bounds hardening. The complete L4 specification had not yet been delivered by the parent user.

### Current Revision — Full L4 Lexical & Parsing Specification Remediation

The parent user explicitly provided the complete, precise L4 requirements:

1. **Lexical Controls Rejection**:
   - `resolveApiBaseUrl` runs lexical checks on the original raw input *before* `.trim()` is called.
   - Any raw ASCII control character (`[\x00-\x1F\x7F]`) including TAB (`\t`), CR (`\r`), LF (`\n`) is rejected fail-closed with a static safe message (`InvalidApiBaseUrlError: Invalid VITE_API_URL: control characters are not allowed`) without echoing raw input.
   - Ordinary outer spaces remain trimmed on valid URLs as documented.
2. **Explicit Authority Syntax**:
   - Requires explicit absolute `http://` or `https://` syntax followed immediately by authority (`^https?:\/\/[^\/\s?#\\]+`).
   - Rejects `http:example.com`, `https:example.com`, `http:/example.com`, `http:///example.com`, and malformed slash/backslash variants repaired by the WHATWG parser.
   - Uses `new URL` after lexical checks for syntactic host validation.
3. **Honest Test Table Labels**:
   - Fixed test cases to test truly malformed URLs: `["not a url plain text", "not a url"]` and `["missing host http://", "http://"]`.
   - Labeled `localhost:8000/api` accurately as missing scheme.
   - Added parameterized tests for TAB, CR, LF at leading, trailing, and within scheme, host, and path.
   - Added regression assertion verifying `InvalidApiBaseUrlError` never exposes raw input.
4. **Strict IMF-Fixdate Component Validation**:
   - `parseHttpDate` validates all calendar and time components (`day`, `month`, `year`, `hour`, `minute`, `second`) against original regex match groups.
   - Rejects impossible calendar dates (non-leap Feb 29, Feb 31, April 31) and time overflows (hours > 23, minutes > 59, seconds > 59).
   - Validates that valid leap days (e.g. Feb 29, 2028) parse cleanly in deterministic clock.

## Artifacts Submitted for Independent Re-Review

- Worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree`
- Delivery branch: `feat/wave-3-http-client`
- Pinned toolchain: Node `v24.15.0`, npm `12.2.0`, TypeScript `6.0.3`, Axios `1.20.0`.
- Automated test suite: 100 passed across 6 test files (95 in `http-client.test.ts`: 82 prior + 13 new M1/M2/minor regressions).
- AST compliance: All 10 production files strictly comply with CSD rules ($\le 15$ functions/file, $\le 3$ returns, $\le 7$ params, 0 `else`, $\le 297$ lines).
- Execution evidence: `.context/work/FEAT-7/verification.md`.
