# Architecture Context

- Independent SPA using Vue 3, TypeScript and Quasar; independent deployment and versioning.
- Accepted architecture: [ADR 0001](../../docs/adr/0001-vue-spa-architecture.md) (accepted by yanpenalva 2026-10-03; implemented and covered by CI gates). Compatibility research: `.context/work/FEAT-1/compatibility-matrix.md` — researched from official documentation, NOT lock-tested or installed.
- Rendering: client-side SPA, no SSR; immutable static build.
- Build: plain Vite with `@quasar/vite-plugin`; Quasar keeps components, Sass variables, component CSS and normalize.
- Language: TypeScript strict via `@vue/tsconfig`, vue-tsc on the TypeScript 6.x line.
- Organization: feature folders `auth`, `users`, `roles`, `logs` plus `shared`/`lib`; hand-written Vue Router route modules (no auto-route plugin).
- State: TanStack Query owns server state/cache incl. the session profile; Pinia owns UI state only; no duplication, no tokens or profile data persisted client-side.
- CSS: Quasar component CSS + normalize; Tailwind 4 theme/utilities only, Preflight disabled, `tw` prefix, no global `!important`; real interaction smoke-tested at scaffold; design tokens and actual styling are SPA #6 (designer lane).
- HTTP: central client with credentials, CSRF bootstrap via `GET /sanctum/csrf-cookie`, `X-XSRF-TOKEN`, typed status mapping; endpoints only from the API canonical contract.
- Transport/typed client: committed OpenAPI/receipt/ZIP pin and generated Orval 8.39.0 types, verified offline against fixed source identity/hash; no `latest`, API credential or CI fetch. The FEAT-7 candidate implements the central mutator and Vue Query client; review remains pending. Artifact refresh uses the separately authorized read-only publication path.
- Authentication: first-party SPA session via Sanctum cookies/session/CSRF (API ADR 0002). Limited session: profile 200 with `email_verified_at: null` (API `openapi.yaml` lines 193–218) is authenticated-limited — empty roles/permissions by contract, logout/minimal profile/verification only; the limited state is never inferred from empty permissions alone; deactivated accounts stay blocked (403), never auto-reactivated by verification.
- UI authorization is user experience only; the API is the enforcement boundary.

Consume the independent REST API under `/api/v1`; detailed contracts arrive via the versioned OpenAPI pin with Orval-generated types. Hosting, production URLs and detailed screen requirements beyond the four roadmap features: see `docs/`. Business module detail beyond the four roadmap features: `NOT FOUND`; revisit after the first scaffold.
