# Review — FEAT-7 typed HTTP client phase A

## Status: PENDING — independent re-review required on updated commit

No independent review approval has been granted for this revision. Per the
delivery model (`.context/project/delivery.md`), independent agent review is a
separate gate owned by the reviewer lane. The author/producer cannot self-approve.

## Review History

### Revision 1 (`540577bc75f3a6ea8a087abd222f672a1b288875`) — FAIL (User-Reported Review)

An independent reviewer evaluated commit `540577bc75f3a6ea8a087abd222f672a1b288875` and reported a `FAIL` verdict with 2 Medium findings and 2 Low findings:

1. **R1 (Medium - Security)**: `client.ts` permitted axios `allowAbsoluteUrls` default behavior. Requests targeting foreign origins (`https://foreign/x`), protocol-relative URLs (`//`, `\\`), or overriding `baseURL` to a foreign host could dispatch credentials (`withCredentials: true`) and XSRF headers to untrusted origins.
2. **R2 (Medium - Policy)**: `errors.ts` exceeded the CSD limit of $\le 15$ declared production functions/methods per file when counting all syntactic function/method nodes (named functions, arrow functions, and method callbacks; reviewer counted 15 named + 24 arrows = 39).
3. **L3 (Low - Robustness)**: `buildHttpError` lacked fail-closed validation against malformed, non-object, or prototype-polluting input structures (`__proto__`, `toString`, `constructor`).
4. **L4 (Low - Parsing)**: `parseApiBaseUrl` did not explicitly reject backslash characters; `parseHttpDate` relied on `Date.parse` without detecting impossible calendar date rollovers (e.g. Feb 31); test label claimed `(>599 or <100)` but only asserted 650.

### Producer Remediations (Applied in Current Revision)

1. **R1 Security Invariant**:
   - `createHttpClient` immutably captures `trustedOrigin` and `trustedBaseUrl`.
   - A request interceptor running *before* CSRF bootstrap and network adapter dispatch validates the final merged request URL and `baseURL`.
   - Foreign absolute URLs, protocol-relative escapes (`//`, `\\`, `/\`, `\/`, `\`), and foreign `baseURL` overrides fail closed immediately with a safe `HttpError` (`kind: "unexpected"`).
   - Zero outbound requests: MSW request-start listener asserts 0 HTTP requests (neither preflight, CSRF bootstrap, nor target) are dispatched.
   - Seeded synthetic cookie token is never leaked in error serialization or error message.
2. **R2 CSD Function Count & Decomposition**:
   - `errors.ts` was cohesively decomposed into cycle-free sub-modules:
     - `error-types.ts`: pure types and interfaces (0 functions, 67 lines).
     - `error-constants.ts`: constants, status boundaries, safe messages, and maps (0 functions, 54 lines).
     - `error-parsers.ts`: field error, delay seconds, and HTTP date parsing (8 functions, 123 lines).
     - `error-guards.ts`: structural variant validation and type guards (11 functions, 164 lines).
     - `error-builders.ts`: fail-closed discriminated error construction (6 functions, 127 lines).
     - `errors.ts`: stable facade re-exporting the entire API for 100% backward compatibility (0 functions, 55 lines).
   - All modules use loop iterations instead of nested inline callbacks.
   - TypeScript AST audit confirms: all production files have $\le 14$ functions/callbacks (ceiling 15), $\le 3$ returns per function, 0 `else`/`else if` statements, and $\le 278$ lines (ceiling 500).
3. **L3 Robustness**:
   - `buildHttpError(input: unknown)` safely accepts `unknown`, checks `asRecord`, and validates `kind` against `KNOWN_KINDS_SET` before property access. Prototype properties and unknown kinds safely default to `unexpected` with bounded status without throwing `TypeError`.
4. **L4 Parsing & Bounds**:
   - `parseApiBaseUrl` rejects backslashes (`\`) before URL parsing.
   - `parseHttpDate` validates UTC day-of-month to prevent `Date.parse` calendar rollover.
   - Direct status bounds assertions (< 100 and > 599) added for both `buildHttpError` and `isHttpError`.

## Artifacts Submitted for Independent Re-Review

- Worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend-wave3-client-worktree`
- Delivery branch: `feat/wave-3-http-client`
- Pinned toolchain: Node `v24.15.0`, npm `12.2.0`, TypeScript `6.0.3`, Axios `1.20.0`.
- Automated test suite: 59 passed across 6 files (54 in `http-client.test.ts`), including zero-outbound-dispatch regression tests.
- Execution evidence: `.context/work/FEAT-7/verification.md`.
