# Architecture Context

- Independent SPA using Vue 3, TypeScript and Quasar; independent deployment and versioning.
- Accepted architecture: [ADR 0001](../../docs/adr/0001-vue-spa-architecture.md) (accepted by yanpenalva 2026-10-03; implementation pending). Compatibility research: `.context/work/FEAT-1/compatibility-matrix.md` — researched from official documentation, NOT lock-tested or installed.
- Rendering: client-side SPA, no SSR; immutable static build.
- Build: plain Vite with `@quasar/vite-plugin`; Quasar keeps components, Sass variables, component CSS and normalize.
- Language: TypeScript strict via `@vue/tsconfig`, vue-tsc on the TypeScript 6.x line.
- Organization: feature folders `auth`, `users`, `roles`, `logs` plus `shared`/`lib`; hand-written Vue Router route modules (no auto-route plugin).
- State: TanStack Query owns server state/cache incl. the session profile; Pinia owns UI state only; no duplication, no tokens or profile data persisted client-side.
- CSS: Quasar component CSS + normalize; Tailwind 4 theme/utilities only, Preflight disabled, `tw` prefix, no global `!important`; real interaction smoke-tested at scaffold; design tokens and actual styling are SPA #6 (designer lane).
- HTTP: central client with credentials, CSRF bootstrap via `GET /sanctum/csrf-cookie`, `X-XSRF-TOKEN`, typed status mapping; endpoints only from the API canonical contract.
- Transport/typed client: pinned durable OpenAPI artifact + generated types via trusted separate sync, read-only API access, fail-closed SHA/run/hash, no `latest`, no credential in PRs; implementation deferred to SPA #7 (generator: Orval/Hey API candidates, not chosen); credential provision is wave 3.
- Authentication: first-party SPA session via Sanctum cookies/session/CSRF (API ADR 0002). Limited session: profile 200 with `email_verified_at: null` (API `openapi.yaml` lines 193–218) is authenticated-limited — empty roles/permissions by contract, logout/minimal profile/verification only; the limited state is never inferred from empty permissions alone; deactivated accounts stay blocked (403), never auto-reactivated by verification.
- UI authorization is user experience only; the API is the enforcement boundary.

Consume the independent REST API under `/api/v1`; first detailed contracts and runtime evidence arrive with API #13/#11 and SPA #7. Hosting, production URLs, CI and detailed screen requirements: `NOT FOUND`. Business module detail beyond the four roadmap features: `NOT FOUND`; revisit after the first scaffold.
