# HTTP client (`src/lib/http`)

Central transport for the SPA (ADR 0001, decisions D9/D10). One axios instance
owns credentials, CSRF flow, timeout and typed error mapping. No other module
may create axios instances.

## Contract status

- Phase A owns the transport foundation. Stage B consumes only the approved,
  pinned OpenAPI artifact under `openapi/`; generated operations and schemas
  live under `src/lib/api/generated` and are Orval-owned. No endpoint or DTO is
  authored by hand.
- Offline contract verification is `npm run contract:verify`; generation is
  `npm run client:generate`. Both fail closed without the verified committed
  artifact/receipt/ZIP and do not fetch from the API repository.

## Session/CSRF flow

```text
Mutating request (POST/PUT/PATCH/DELETE):
  ensureCsrfCookie() -> GET {VITE_API_URL}/sanctum/csrf-cookie  (deduplicated)
  axios mirrors cookie XSRF-TOKEN into header X-XSRF-TOKEN (withXSRFToken)
  request carries session cookie (withCredentials)

419 csrf_mismatch:
  bootstrap state reset; typed error returned
  no blind retry: re-auth/refresh decision belongs to the auth flow (later wave)

Logout (later wave):
  POST /api/v1/logout -> resetCsrfBootstrap() alongside cache/store clearing
```

## Configuration

- `VITE_API_URL` (see `.env.example`) is the primary source of the API base URL (`apiBaseUrlFromEnv`).
  The factory `createHttpClient(baseURL)` validates the URL fail-closed via `resolveApiBaseUrl`:
  explicit absolute `http://` or `https://` syntax with actual authority, strict lexical rejection
  of ASCII control characters (TAB, CR, LF) on the raw input before trimming, backslash rejection,
  no embedded credentials, no query/fragment, no permissive fallback. It is never taken from
  unvalidated or user-controlled input.
- The generated transport requires `VITE_API_URL` to resolve to the trusted
  root origin only. Contract paths already include `/api/v1`; do not add that
  prefix to `VITE_API_URL`. `/sanctum/csrf-cookie` remains root-relative.

## Errors

Every rejected request yields one typed `HttpError` (see `errors.ts`):
`unauthorized` 401, `forbidden` 403, `not_found` 404, `conflict` 409,
`csrf_mismatch` 419, `validation` 422 (with `fieldErrors` metadata),
`rate_limited` 429 (with parsed `retryAfterSeconds`), `server_error` 5xx,
`network` (with `timedOut`), `cancelled`, `unexpected`. Messages are fixed
safe strings; raw response bodies never reach messages or logs (no credential
or PII leakage). Consumers narrow with the exported type guards.

## Security boundaries

- Session lives in HttpOnly cookies owned by the API. No Bearer/PAT headers,
  no tokens in localStorage/sessionStorage, no profile snapshots.
- Immutable origin invariant: The factory captures `trustedOrigin` and `trustedBaseUrl` immutably. A request interceptor running before CSRF bootstrap and network dispatch verifies that target URLs and per-request `baseURL` overrides match `trustedOrigin`. Foreign absolute targets (`https://foreign/x`), protocol-relative escapes (`//`, `\\`, `/\`, `\/`), and unauthorized `baseURL` overrides fail closed with a safe `HttpError` (`kind: "unexpected"`), producing zero outbound network requests and preventing credential/cookie leakage.
- No mutation of axios global defaults; configuration is instance-scoped.
- The Orval mutator delegates to this module's central instance, captures the
  validated root origin once, passes `AbortSignal`, returns typed response
  data and preserves normalized `HttpError` failures. It does not rewrite
  generated paths or permit foreign `baseURL` overrides.
- No credentials, PII or raw error text is logged by this module.
- Cohesive module architecture: Error handling is factored into cycle-free sub-modules (`error-types.ts`, `error-constants.ts`, `error-parsers.ts`, `error-guards.ts`, `error-builders.ts`) unified under the backward-compatible facade `errors.ts`, strictly adhering to CSD quality rules ($\le 15$ functions/file, $\le 3$ returns/function, 0 `else` statements).

## Tests

`http-client.test.ts` uses MSW handlers to assert real request facts: header
`X-XSRF-TOKEN` mirroring, bootstrap-before-mutation ordering, deduplication
and 419 reset, plus every typed status mapping. Cookie _issuance_ by a real
browser and cross-origin behavior are covered later by real-API E2E (SPA
#17); these tests prove wiring, not browser cookie semantics.
