# ADR 0001 — Vue SPA architecture: Vue 3, Quasar, TypeScript, Tailwind 4 (independent SPA)

- State: ACCEPTED. Decision approved by yanpenalva on 2026-10-03 ("Aprovar pacote SPA", after the independent preflight conditions were resolved; record in `.context/work/FEAT-1/approval.md`). Implementation is NOT done: nothing is installed, no lockfile exists, no application source exists. The accepted proposal draft is retained as evidence at `.context/work/FEAT-1/adr-proposed.md`; this file is the canonical normative record and supersedes the draft's wording on any divergence.
- Scope note: the SPA transport/typed-client approach is accepted in this ADR as decision D10; its implementation waits for the API contract artifact and owns the guardrails recorded there.

## Context and evidence

Independent frontend repository (decision inherited from API ADR 0001: separate repos, releases, deploys). Greenfield at acceptance: HEAD `4c2d5b4` on `main`, no application files, no dependencies. Issue [#1](https://github.com/yanpenalva/starter-kit-frontend/issues/1) assigned rendering, router, state, HTTP client and structure decisions here; the user master roadmap (API repository `.context/project/roadmap.md`, read-only) gates scaffold (SPA #5) behind this architecture. Compatibility research (official documentation/registry, 2026-10-03) is recorded in `.context/work/FEAT-1/compatibility-matrix.md` and is explicitly researched evidence, not a lockfile: exact versions are pinned by the lockfile created at scaffold.

## Decisions

1. Rendering: client-side rendered SPA. No SSR, no SSG; immutable static build (deploy mechanics stay with SPA #19).
2. Build: plain Vite with `@quasar/vite-plugin` (not the Quasar CLI shell). Quasar contributes components, Sass variables, component CSS and normalize; Vite owns dev server and bundling.
3. Language: TypeScript strict mode via `@vue/tsconfig`, type-checked with vue-tsc on the TypeScript 6.x line (TS 7 excluded while Vue tooling requires programmatic APIs it does not expose; guards in the matrix).
4. Organization: feature folders `src/features/auth`, `src/features/users`, `src/features/roles`, `src/features/logs`; cross-feature code in `src/shared`, `src/lib/http`, `src/lib/api-types`. New domains extend the pattern; none is invented now.
5. Routing: hand-written Vue Router route modules composed centrally. No file-based/auto-route plugin.
6. State ownership: TanStack Query is the only owner of server state and cache, including the session profile; Pinia stores own UI-only state and never mirror or persist server profile data; UI reads the Query cache through composables. The SPA persists nothing sensitive: no tokens, no profile snapshots in localStorage/sessionStorage or SPA-authored cookies; the session lives in HttpOnly cookies owned by the API.
7. CSS coexistence: Quasar component CSS and normalize stay enabled; Tailwind 4 supplies theme tokens and utilities only, Preflight disabled, `tw` prefix on utilities, no global `!important`. Real interaction is smoke-tested at scaffold. Design tokens and actual UI styling stay with SPA #6 (designer lane); this ADR changes no visual design.
8. Toolchain and platform: npm with committed lockfile, installs via `npm ci`; npm pinned at 12.2.0; Node 24 LTS, at least 24.15 (jsdom floor). Accepted documented defaults for later gates: Vitest, @vue/test-utils, jsdom, MSW (local UI test mocks only, never presented as real API evidence), Playwright (real-API E2E from SPA #17), ESLint with eslint-plugin-vue and typescript-eslint, Prettier.
9. HTTP: one central client module (`src/lib/http`): always sends credentials, bootstraps CSRF via `GET /sanctum/csrf-cookie` before state-changing requests, sends `X-XSRF-TOKEN`, maps API statuses (401/403/404/409/419/429) to typed outcomes. Endpoint paths and payload shapes come only from the API canonical contract; no invented endpoints.
10. Transport and typed client (accepted "Aprovar transporte", 2026-10-03): the API publishes a pinned, durable OpenAPI artifact (versioned, not `latest`); the frontend consumes generated types derived from that pinned artifact through a trusted, separate synchronization path that requires no credentials in pull requests. Future frontend actions touching the artifact are read-only against the API, fail closed on missing or mismatched SHA/run/hash evidence, and never widen access. Generator choice (Orval / Hey API candidates) and implementation are SPA #7, after API #6/#11 publish and review the artifact. Credential provision for any private artifact access is wave 3 work with its own authorization.
11. Authorization UX and limited session: guards and UI conditions use effective roles/permissions from the profile only as user experience; the API enforces real authorization. The canonical `Profile` schema (API repository `openapi.yaml` lines 193–218) makes `email_verified_at` explicit (RFC 3339 UTC or `null` while pending): a 200 profile with `email_verified_at: null` is authenticated-limited — roles and permissions are empty by API contract; the UI permits only logout, minimal profile and verification guidance; business routes render limited/denied. The limited state is derived from the flag, never from empty permissions alone (a verified basic user may have none). An explicitly deactivated account stays blocked with 403 and is never reactivated by verification; the UI distinguishes 403 denied (action not allowed) from 403 blocked (account deactivated) with generic messaging and no client-side fake-reason heuristics. No concrete verification route exists yet (API #14 / SPA #10 own it); only flow guidance is recorded. Expired session is a first-class UI state from 401 responses.
12. Coupling: the SPA treats the pinned OpenAPI artifact as the single type source once published; until then hand-written types stay minimal and local, never a parallel contract. Breaking API changes follow the API compatibility rule (new major path or explicit migration plan).

## Session flow (decision level)

```text
Login:
  GET  /sanctum/csrf-cookie -> POST /api/v1/login (204) -> GET /api/v1/auth/my-profile (200)
  Query caches profile; router enters authenticated area

Reload / bootstrap:
  Query re-fetches my-profile once
  verified profile      -> authenticated session restored
  email_verified_at null -> authenticated-LIMITED: logout / minimal profile /
        verification guidance only; business denied
  401                   -> unauthenticated, redirect for guarded routes

Verification (no concrete route yet; API #14 / SPA #10 own it):
  signed email links from the API; next my-profile fetch activates the basic
  profile; blocked (deactivated) accounts are never reactivated by verification

Logout:
  POST /api/v1/logout (204) -> clear Query cache and UI stores (in-memory only)
```

## Alternatives (summary)

Quasar CLI shell, file-based routing, SSR/Nuxt, Tailwind Preflight with global overrides, Bearer tokens in the SPA, Pinia as server-state cache, immediate TypeScript 7, immediate generator choice — each rejected with rationale in the evidence draft (`.context/work/FEAT-1/adr-proposed.md`), which this ADR incorporates by reference as the recorded alternatives analysis.

## Impacts, pendencies and verification

- Impacts: scaffold (SPA #5), journeys (#2), gates (#3), client (#7) and state work (#8) inherit these boundaries; directory conventions and the no-duplicated-server-state rule become review criteria.
- Pendencies (`NOT FOUND` or owned elsewhere): production domains/CORS/session config (deploy); OpenAPI artifact publication and acquisition (API #6/#11, SPA #7; credentials wave 3); design tokens (SPA #6); CI (SPA #3/#18); lockfile and real CSS smoke (SPA #5); E2E (SPA #17).
- Verification: context validation of the FEAT-1 artifacts and independent preflight (oracle session `ses_f00b14f02ffecUjnB5Iz5v7Epb`: PASS conditional, conditions resolved; strict validation and the 6 adapter tests reproduced) — commands and results in `.context/work/FEAT-1/verification.md`. No install, build or CSS smoke is claimed.
- Rollback: revert the documentation; no runtime or data effect. After scaffold, changes to these decisions require a successor ADR.

## Integration record

- Accepted content materialized on branch `docs/issue-1-spa-architecture` (base `4c2d5b4` on `main`); commit SHA: NOT FOUND (integration owned by the orchestrator; no commit or PR exists at acceptance time). PR: NOT FOUND.

## FEAT-7 Stage B candidate (2026-10-05)

- Generator selected for this candidate: Orval `8.39.0`, Vue Query v5 client, Axios custom mutator delegated to `src/lib/http`.
- Input is the pinned API main artifact recorded in `.context/work/FEAT-7/orval-stage-b.md`; committed frontend verification is offline and requires no API credential. Generated schemas/endpoints are Orval-owned and never edited manually.
- Candidate review is pending on PR #26. This record does not claim integration, Wave 3 completion, auth-state wiring, UI delivery or real-browser cookie verification.
