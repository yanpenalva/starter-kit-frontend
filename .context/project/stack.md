# Stack and Tooling

Accepted direction ([ADR 0001](../../docs/adr/0001-vue-spa-architecture.md)); nothing is installed yet. Exact versions are resolved by official documentation and the lockfile at scaffold (SPA #5); the researched proposal lives in `.context/work/FEAT-1/compatibility-matrix.md` and is explicitly researched evidence, not a lockfile.

| Area | Technology | Accepted line | State |
| --- | --- | --- | --- |
| UI | Vue | 3 | Accepted decision; not installed |
| Language | TypeScript | 6.x, strict (`@vue/tsconfig`, vue-tsc) | Accepted decision; not installed |
| UI framework | Quasar | 2 | Accepted decision; component CSS + normalize preserved |
| Build | Vite + @quasar/vite-plugin | Vite 8 | Accepted decision; not installed |
| CSS utilities | Tailwind CSS | 4, Preflight disabled, `tw` prefix | Accepted decision; smoke test at scaffold |
| Router | Vue Router | 5, hand-written modules | Accepted decision; not installed |
| UI state | Pinia | 4 | Accepted decision; UI state only |
| Server state | @tanstack/vue-query | 5 | Accepted decision; owns server state/profile cache |
| Package manager | npm | 12.2.0 pinned proposal, committed lockfile, `npm ci` | Accepted decision; lockfile created at scaffold |
| Runtime | Node.js | 24 LTS, at least 24.15 | Accepted decision; host env gap recorded in matrix |
| Unit/component tests | Vitest + @vue/test-utils + jsdom + MSW | Documented defaults | Accepted defaults; configured at SPA #3, mocks never stand in for real API evidence |
| E2E | Playwright | Real-API E2E from SPA #17 | Accepted default; later wave |
| Lint/format | ESLint (eslint-plugin-vue, typescript-eslint) + Prettier | Documented defaults | Accepted defaults; configured at scaffold |
| API | Independent Laravel API | /api/v1 | Integration planned; contract canonical in the API repository |
| Authentication | Sanctum SPA cookies/session/CSRF | HttpOnly session cookie | First-party integration planned (API #13); no tokens in the SPA |
| API types | Generated from pinned durable OpenAPI artifact | Generator: Orval/Hey API candidates, not chosen | Deferred to SPA #7; read-only sync, fail-closed SHA/run/hash, no `latest`; credentials wave 3 |
| Context kit | @owlcodium/context-spec-develop | 1.2.1 | Installed in project scope |
| Context validator | Python 3 | No third-party Python dependencies | Tooling only |

Design tokens, production images, hosting, deployment platform, PostgreSQL/Redis versions for the frontend (none needed client-side), CI provider and observability: `NOT FOUND` until their owning features.
