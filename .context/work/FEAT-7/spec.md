# Specification — FEAT-7 typed HTTP client phase A (Issue #7)

## Objective

Deliver the transport foundation of ADR 0001 D9/D10 inside `src/lib/http`: one
central axios instance (credentials, XSRF wiring, named timeout), a deduplicated
`/sanctum/csrf-cookie` bootstrap before mutating requests with race-safe reset,
419-safe reset semantics without automatic retry, and a typed discriminated error
surface — fully tested with MSW request-level assertions.

## Scope

- `src/lib/http/config.ts`: fail-closed `VITE_API_URL` resolution (http/https only, no credentials/query/fragment, no fallback, array rejection in `asRecord`), named constants (`HTTP_TIMEOUT_MS`, CSRF names).
- `src/lib/http/csrf.ts`: deduplicated bootstrap coordinator (`createCsrfCoordinator`) with generation-tracked reset (`resetCsrfBootstrap`) ensuring in-flight reset races do not wipe newer generations.
- `src/lib/http/errors.ts`: discriminated `HttpError` union (401/403/404/409/419/422/429/500..599 server_error, network with boolean timedOut, cancel, unexpected with bounded status code), unknown-bound parsing of 422 field errors and `Retry-After` (delay-seconds + IMF-fixdate HTTP-date with overflow bounds), fixed safe messages, exhaustive structural type guards rejecting forged objects.
- `src/lib/http/client.ts`: factory boundary validation (`createHttpClient` validates `baseURL`), instance-scoped configuration (`withCredentials: true`, `withXSRFToken: true`, `xsrfCookieName`, `xsrfHeaderName`, `timeout: HTTP_TIMEOUT_MS`, `Accept: application/json`), request interceptor (bootstrap before POST/PUT/PATCH/DELETE), response interceptor (typed mapping, 419 reset, preservation of internal typed errors, no blind retry). No axios global mutation.
- `.env.example`: non-secret `VITE_API_URL=http://localhost:8000` with documentation.
- `package.json` / `package-lock.json`: exact `axios: 1.20.0` pin.
- `src/test/http-handlers.ts`: shared MSW handlers using `HttpResponse`, origin-reflecting CORS headers compatible with credentials (`Access-Control-Allow-Credentials: true`).
- `src/lib/http/http-client.test.ts`: comprehensive tests asserting real transport facts.
- CSD work item FEAT-7 with EXC-0001 reference, verification evidence, and execution log.

## Out of scope

- Typed client generation / Orval / DTOs (stage B; waiting on API #11 reviewed main artifact/provenance and API #13 implementations).
- Profile/Login DTOs, endpoint helpers, query composables, stores, router, pages, UI/design, auth flow wiring, real-API E2E (SPA #17).

## Module public interface contracts

- `createHttpClient(baseURL: string): HttpClient`:
  - Input: valid http/https base URL. Fails closed with `InvalidApiBaseUrlError` if missing, invalid scheme, containing credentials, or containing query/fragment.
  - Returns: `{ instance: AxiosInstance, ensureCsrfCookie: CsrfBootstrapper, resetCsrfBootstrap: () => void }`.
- `resolveApiBaseUrl(rawBase: unknown): string`: validates and normalizes base URL string.
- `apiBaseUrlFromEnv(env: unknown): string`: extracts and resolves `VITE_API_URL` from environment object.
- `createCsrfCoordinator(client: AxiosInstance): CsrfCoordinator`: coordinates single-flight bootstrap and generation-safe reset.
- `buildHttpError(input: HttpErrorInput): HttpError`: creates discriminated error from extracted transport facts.
- Type guards: `isHttpError(value: unknown): value is HttpError`, `isValidationHttpError`, `isRateLimitedHttpError`, `isCsrfMismatchHttpError`.

## Rules and contracts

- Session lives only in HttpOnly cookies owned by the API: no Bearer/PAT, no localStorage/sessionStorage.
- Raw response text never enters messages, logs or exceptions; only contract metadata (field errors, Retry-After) is parsed, via unknown-bound guards.
- Base URL is build-time env, never user-controlled input; validated at factory boundary.
- 419 resets bootstrap coordinator on the client for the subsequent request; never blindly replays non-idempotent mutations.

## Acceptance criteria

1. Full gate set green on pinned Node 24.15/npm 12.2.0 (`npm ci`, format:check, lint, typecheck, test, build).
2. Tests assert real request facts: bootstrap-before-mutation (POST/PUT/PATCH/DELETE), single-flight dedup, XSRF header mirroring, 419 reset without retry, every typed mapping, metadata parsing, safe messages, type guard negative tests.
3. Fail-closed env and factory validation demonstrated (missing/invalid/unsafe URL throws `InvalidApiBaseUrlError`).
4. No test claims real browser cookie issuance; that stays with real-API E2E (SPA #17).
