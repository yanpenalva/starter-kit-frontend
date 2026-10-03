# ADR 0001 (PROPOSED) — Independent Vue SPA architecture: Vue 3, Quasar, TypeScript, Tailwind 4

- State: PROPOSED — draft retained as evidence. ACCEPTED via the human decision recorded below; the canonical normative record is now `docs/adr/0001-vue-spa-architecture.md`. This draft is no longer normative; nothing is implemented.
- Date: 2026-10-03 (proposed). Owner and approver: yanpenalva (acceptance pending). Author: technical-planner lane, FEAT-1. Evidence: Issue [#1](https://github.com/yanpenalva/starter-kit-frontend/issues/1), API canonical contract and ADRs 0001–0003 (read-only references), compatibility research in `compatibility-matrix.md`.

## Context and evidence

The frontend repository is greenfield: no application source, no dependencies, no ADRs. `project/architecture.md` leaves rendering mode, router conventions, state management, HTTP client and component structure to this decision. The roadmap makes SPA architecture acceptance an explicit gate before scaffold (SPA #5). Constraints inherited from canonical context: independent repositories and deployments (API ADR 0001), first-party Sanctum cookie/session/CSRF authentication (API ADR 0002), contract-first API under `/api/v1` (API ADR 0003 and `api.md`), and Quasar as a retained UI library (Issue #1). Frontend HEAD at proposal time: `4c2d5b4` on `main`, clean.

## Decisions

1. Rendering: client-side rendered SPA. No SSR, no SSG. Static hosting of an immutable build is the deployment shape (deploy mechanics stay with SPA #19).
2. Build: plain Vite with `@quasar/vite-plugin` (not the Quasar CLI app shell). Quasar contributes components, Sass variables, component CSS and normalize; Vite owns dev server and bundling. Proposed versions and the peer-dependency triangle live in `compatibility-matrix.md`.
3. Language: TypeScript strict mode via `@vue/tsconfig`; type checking with vue-tsc on the 6.x TypeScript line (TS 7 excluded for now: its stable release lacks programmatic APIs required by Vue tooling; see matrix guards).
4. Organization: feature folders `src/features/auth`, `src/features/users`, `src/features/roles`, `src/features/logs`, each owning its routes, components, composables and feature-local state; cross-feature code lives in `src/shared` (UI), `src/lib/http` (transport), `src/lib/api-types` (generated types, later). No business domain is invented beyond these four roadmap features; new domains extend the pattern.
5. Routing: hand-written Vue Router route definitions (route table modules per feature, composed centrally). No file-based/auto-route plugin.
6. State ownership (no duplication):
   - TanStack Query is the only owner of server state and cache, including the authenticated session profile (fetched from `GET /api/v1/auth/my-profile` after login and on reload).
   - Pinia stores own UI-only state (layout, feature UI flags, derived session UI signals such as "is menu visible for role X"). Pinia MUST NOT cache or mirror server profile data; UI needs read the Query cache through composables.
   - Nothing sensitive is persisted: no tokens, no server profile snapshot in localStorage/sessionStorage/cookies authored by the SPA. Session lives in HttpOnly cookies owned by the API.
7. CSS coexistence: Quasar component CSS and its normalize stay enabled. Tailwind 4 is used for theme tokens and utilities only, with Preflight disabled, a `tw` prefix on utility classes to avoid collisions, and no global `!important` overrides. Real Quasar+Tailwind interaction is smoke-tested at scaffold (matrix and lock validation are Wave 1 work, not claimed here).
8. Package management: npm with a committed lockfile; installs in CI/other machines use `npm ci`. Node 24 LTS (>= 24.15) baseline. Pin proposal: npm 12.2.0 (see matrix; host environment gap recorded there).
9. HTTP: one central client module (`src/lib/http`) that always sends credentials, bootstraps CSRF via `GET /sanctum/csrf-cookie` before state-changing requests, sends `X-XSRF-TOKEN`, and maps API error statuses (401/403/404/409/419/429) to typed client outcomes. Endpoint paths and payload shapes come only from the API canonical contract; no invented endpoints.
10. Typed client: deferred to SPA #7, after API #6/#11 publish the OpenAPI artifact; generator candidates (Orval, Hey API) are recorded but not chosen. Until then, hand-written types are limited and local, never a parallel contract.
11. Authorization UX and limited session: route guards and UI conditions use the effective roles/permissions from the profile only for user experience (hide/disable/redirect); the API remains the enforcement boundary. The canonical `Profile` schema (API repository `openapi.yaml` lines 193–218) makes `email_verified_at` explicit (RFC 3339 UTC timestamp or `null` while pending): a 200 profile with `email_verified_at: null` is authenticated-limited — roles and permissions are empty by API contract, and the UI permits only logout, the minimal profile display and verification guidance; business routes render a limited/denied state. The SPA MUST NOT infer "unverified" from empty roles/permissions alone: a verified basic user may legitimately have none; the flag is the only source for the limited-session state. An explicitly deactivated account stays blocked with 403; verification never reactivates a blocked account. Client error UX distinguishes 403 denied (action not allowed for this session) from 403 blocked (account deactivated) without inventing reasons client-side — the UI renders generic messaging per case, no fake-reason heuristics. The concrete verification route/path does not exist yet (API #14 and SPA #10 own it); this ADR records only the flow guidance above, no fabricated path. Expired session remains a first-class UI state, handled from 401 responses.
12. Testing defaults (routine, reviewable at SPA #3 without a new ADR): Vitest + @vue/test-utils + jsdom + MSW for unit/component tests with mocked transport; Playwright reserved for real-API E2E from SPA #17.

## Login / session bootstrap / logout flow (described, not implemented)

```text
Login:
  user submits credentials
  SPA: GET  /sanctum/csrf-cookie            (sets XSRF-TOKEN cookie)
  SPA: POST /api/v1/login                    (X-XSRF-TOKEN header, credentials: include) -> 204
  SPA: GET  /api/v1/auth/my-profile          -> 200 profile (identity + effective roles/permissions)
  Query caches profile as server state; router enters authenticated area

Reload / bootstrap:
  SPA boots, Query re-fetches my-profile once
  profile ok, email_verified_at set   -> authenticated session, restore UI state
  profile ok, email_verified_at null  -> authenticated-LIMITED session:
        roles/permissions empty by API contract; UI allows logout,
        minimal profile and verification guidance only; business routes denied.
        Limited state derives from the flag, never from empty permissions alone
        (a verified basic user may also have none).
  profile 401   -> unauthenticated state, redirect to login for guarded routes

Verification (planned, no concrete route yet):
  unverified session sees verification guidance; exact SPA route/payload
  is owned by API #14 + SPA #10 (email links come signed from the API;
  no path is invented here). Verification changes email_verified_at via
  the API; the next my-profile fetch activates the basic profile.
  A 403-blocked (deactivated) account is never reactivated by verification.

Logout:
  SPA: POST /api/v1/logout                   -> 204 (session invalidated, CSRF renewed server-side)
  SPA: clear Query cache and UI stores (in-memory only; nothing was persisted)

Errors:
  419 invalid/missing CSRF -> re-run csrf-cookie bootstrap once, then surface retry
  403 denied (action not allowed for this session) -> access-denied UI,
        generic messaging; 403 blocked (account deactivated) -> blocked UI,
        stay blocked, no re-verify offer, no client-side fake-reason heuristics
  429 -> honor Retry-After
```

Session cookie is HttpOnly and owned by the API; the SPA-readable XSRF cookie is not the session cookie (API ADR 0002). Production CORS origins, session domain/lifetime and TLS remain `NOT FOUND` and block production auth deployment, not this architecture.

## Alternatives considered

- Quasar CLI app mode instead of Vite plugin: rejected; Issue #1 and the roadmap target a standard Vite toolchain, and the official plugin path keeps Quasar compatible with the plain Vite ecosystem.
- File-based/auto route generation: rejected for greenfield simplicity; explicit route modules keep guard ownership and lazy-loading visible; revisitable via successor ADR if the route table grows unmanageably.
- SSR/Nuxt: rejected; independent static SPA is the registered direction (Issue #1, roadmap), and SSR would couple deployment to a Node server (SPA #19 expects an immutable static build).
- Tailwind with Preflight enabled and global overrides: rejected; Preflight resets would fight Quasar component styles; prefix + no-reset is the documented coexistence approach.
- Bearer token storage in the SPA: rejected; contradicts API ADR 0002 and the canonical contract (login issues no token) and enlarges the client-side attack surface.
- Pinia as server-state cache (mirroring profile): rejected; two owners for one state guarantees drift after reload/mutation; Query owns server state, Pinia owns UI.
- TypeScript 7 immediately: rejected; Vue tooling needs programmatic APIs TS 7 does not provide (per official announcement); guard recorded in the matrix.
- Generator choice now (Orval vs Hey API): deferred; no published OpenAPI artifact exists to generate from (API #6/#11 pending).

## Impacts, pendencies and verification

- Impacts: scaffold (SPA #5), journeys (#2), quality gates (#3), client (#7) and state work (#8) inherit these boundaries; directory conventions and the no-duplicated-server-state rule become review criteria.
- Pendencies (`NOT FOUND` or owned elsewhere): production domains/CORS/session config (deploy work); OpenAPI acquisition for the SPA (API #6/#11, SPA #7); design tokens (SPA #6); CI definition (SPA #3/#18); lockfile and real CSS smoke (Wave 1, SPA #5).
- Verification of this decision package: context validation of the FEAT-1 artifacts (commands and results recorded in `plan.md` evidence), independent review, then human acceptance. No build, install or test of the proposed versions is claimed anywhere in this ADR.
- Rollback: discard/revert the documentation; no runtime or data effect exists. After acceptance and scaffold, changes to these decisions go through a successor ADR.

## Acceptance record (filled by human decision)

- Decision (accept / reject / amend): ACCEPTED ("Aprovar pacote SPA", including the transport decision "Aprovar transporte"; full record in `approval.md`).
- Decided by: yanpenalva on 2026-10-03, after the independent preflight conditions (F1/F2) were resolved.
- Canonical materialization: `docs/adr/0001-vue-spa-architecture.md` (accepted state, limited-session semantics preserved); project context pointers updated in `project/architecture.md` and `project/stack.md`. This draft is preserved as the proposal-time evidence and alternatives analysis.
