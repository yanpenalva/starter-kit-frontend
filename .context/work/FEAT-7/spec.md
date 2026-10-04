# Specification — FEAT-7 typed HTTP client phase A (Issue #7)

## Objective

Deliver the transport foundation of ADR 0001 D9/D10 inside `src/lib/http`: one
central axios instance (credentials, XSRF wiring, named timeout), an immutable
trusted origin invariant (rejecting foreign destinations and protocol-relative escapes
before network or bootstrap dispatch), a deduplicated `/sanctum/csrf-cookie` bootstrap
before mutating requests with race-safe reset, 419-safe reset semantics without
automatic retry, strict lexical base URL validation (rejecting control characters before
trimming and requiring explicit authority syntax), strict IMF-fixdate calendar parsing,
and a typed discriminated error surface — fully tested with MSW request-level assertions
and AST-verified CSD compliance.

## Scope

- `src/lib/http/config.ts`: fail-closed `VITE_API_URL` resolution (http/https only, strict lexical rejection of ASCII control characters `[\x00-\x1F\x7F]` on the raw string before trimming, explicit `http://` or `https://` syntax with actual authority, rejection of `http:example.com` and malformed slashes repaired by WHATWG, backslash rejection, no credentials/query/fragment, no fallback, array rejection in `asRecord`), named constants (`HTTP_TIMEOUT_MS`, CSRF names).
- `src/lib/http/csrf.ts`: deduplicated bootstrap coordinator (`createCsrfCoordinator`) with generation-tracked reset (`resetCsrfBootstrap`) ensuring in-flight reset races do not wipe newer generations.
- `src/lib/http/error-types.ts`: pure TypeScript types and discriminated union definitions for `HttpError`.
- `src/lib/http/error-constants.ts`: status boundaries, safe fixed messages, status maps, and known kinds set.
- `src/lib/http/error-parsers.ts`: unknown-bound parsing of 422 field errors and `Retry-After` (delay-seconds + strict IMF-fixdate HTTP-date with full calendar day/month/year/hour/minute/second component validation and overflow bounds).
- `src/lib/http/error-guards.ts`: exhaustive structural type guards rejecting forged objects, non-objects, and invalid shapes.
- `src/lib/http/error-builders.ts`: fail-closed discriminated error construction protecting against prototype pollution and unknown kinds.
- `src/lib/http/errors.ts`: stable backward-compatible facade re-exporting all sub-module symbols.
- `src/lib/http/client.ts`: factory boundary validation (`createHttpClient` validates `baseURL`), instance-scoped configuration (`withCredentials: true`, `withXSRFToken: true`, `xsrfCookieName`, `xsrfHeaderName`, `timeout: HTTP_TIMEOUT_MS`, `Accept: application/json`), immutable origin invariant interceptor running before CSRF bootstrap, request interceptor (bootstrap before POST/PUT/PATCH/DELETE), response interceptor (typed mapping, 419 reset, preservation of internal typed errors, no blind retry). No axios global mutation.
- `.env.example`: non-secret `VITE_API_URL=http://localhost:8000` with documentation.
- `package.json` / `package-lock.json`: exact `axios: 1.20.0` pin.
- `src/test/http-handlers.ts`: shared MSW handlers using `HttpResponse`, origin-reflecting CORS headers compatible with credentials (`Access-Control-Allow-Credentials: true`).
- `src/lib/http/http-client.test.ts`: comprehensive tests asserting real transport facts, origin invariant zero outbound dispatch, lexical control character rejection, honest test table labels, and error bounds.
- CSD work item FEAT-7 with EXC-0001 reference, verification evidence, and execution log.

## Out of scope

- Typed client generation / Orval / DTOs (stage B; waiting on API #11 reviewed main artifact/provenance and API #13 implementations).
- Profile/Login DTOs, endpoint helpers, query composables, stores, router, pages, UI/design, auth flow wiring, real-API E2E (SPA #17).

## Module public interface contracts

- `createHttpClient(baseURL: string): HttpClient`:
  - Input: valid http/https base URL. Fails closed with `InvalidApiBaseUrlError` if missing, invalid scheme, containing controls, containing credentials, or containing query/fragment.
  - Returns: `{ instance: AxiosInstance, ensureCsrfCookie: CsrfBootstrapper, resetCsrfBootstrap: () => void }`.
  - Invariant: enforces immutable trusted origin on every request before CSRF bootstrap and network dispatch.
- `resolveApiBaseUrl(rawBase: unknown): string`: validates and normalizes base URL string.
- `apiBaseUrlFromEnv(env: unknown): string`: extracts and resolves `VITE_API_URL` from environment object.
- `createCsrfCoordinator(client: AxiosInstance): CsrfCoordinator`: coordinates single-flight bootstrap and generation-safe reset.
- `buildHttpError(input: unknown): HttpError`: creates discriminated error from extracted transport facts, failing closed to `unexpected` on invalid input.
- Type guards: `isHttpError(value: unknown): value is HttpError`, `isValidationHttpError`, `isRateLimitedHttpError`, `isCsrfMismatchHttpError`.

## Rules and contracts

- Session lives only in HttpOnly cookies owned by the API: no Bearer/PAT, no localStorage/sessionStorage.
- Raw response text never enters messages, logs or exceptions; only contract metadata (field errors, Retry-After) is parsed, via unknown-bound guards.
- Base URL is build-time env, never user-controlled input; validated at factory boundary.
- Origin invariant: target URLs and `baseURL` overrides must match the factory's immutable trusted origin. Foreign targets produce 0 outbound network requests.
- 419 resets bootstrap coordinator on the client for the subsequent request; never blindly replays non-idempotent mutations.
- CSD rules: $\le 15$ declared implementation functions/methods per file (including arrow functions and callbacks), $\le 3$ returns per function, $\le 7$ parameters, 0 `else`/`else if` statements, $\le 500$ lines per file.

## Acceptance criteria

1. Full gate set green on pinned Node 24.15/npm 12.2.0 (`npm ci`, format:check, lint, typecheck, test, build).
2. Tests assert real request facts: bootstrap-before-mutation (POST/PUT/PATCH/DELETE), single-flight dedup, XSRF header mirroring, 419 reset without retry, every typed status mapping, metadata parsing, safe messages, type guard negative tests.
3. Origin invariant proven with zero outbound MSW dispatch for foreign targets, protocol-relative escapes, and baseURL overrides.
4. Lexical control character rejection proven before trimming (TAB, CR, LF rejected on leading, trailing, and internal positions).
5. Honest test table labels covering truly malformed URLs, missing scheme, and WHATWG repair variants (`http:example.com`, `http:/example.com`, `http:///example.com`).
6. Strict IMF-fixdate validation proven rejecting impossible dates (Feb 31, non-leap Feb 29, Apr 31, time overflows) and accepting valid leap days (Feb 29 2028).
7. AST audit verifies $\le 15$ functions/file, $\le 3$ returns, $\le 7$ params, 0 `else`, $\le 500$ lines for all production files.
8. Fail-closed env and factory validation demonstrated (missing/invalid/unsafe URL throws `InvalidApiBaseUrlError`).
9. No test claims real browser cookie issuance; that stays with real-API E2E (SPA #17).
