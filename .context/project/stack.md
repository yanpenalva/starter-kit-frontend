# Stack and Tooling

Accepted direction: [ADR 0001](../../docs/adr/0001-vue-spa-architecture.md). Exact versions are pinned by `package-lock.json`; the Node/npm lines are constrained by `engines` in `package.json`.

| Area | Technology | Accepted line | State |
| --- | --- | --- | --- |
| UI | Vue | 3 | Installed |
| Language | TypeScript | 6.x, strict (`@vue/tsconfig`, vue-tsc) | Installed |
| UI framework | Quasar | 2 | Installed; component CSS + normalize preserved |
| Build | Vite + @quasar/vite-plugin | Vite 8 | Installed |
| CSS utilities | Tailwind CSS | 4, Preflight disabled, `tw` prefix | Installed |
| Router | Vue Router | 5, hand-written modules | Installed |
| UI state | Pinia | 4 | Installed; UI state only |
| Server state | @tanstack/vue-query | 5 | Installed; owns server state and the session profile cache |
| Package manager | npm | committed lockfile, `npm ci` | Installed |
| Runtime | Node.js | 24 LTS, at least 24.15 (`engines.node`) | Installed |
| Unit/component tests | Vitest + @vue/test-utils + jsdom + MSW | v8 coverage thresholds in `vite.config.ts` | Installed; mocks never stand in for real API evidence |
| E2E | Playwright | Real-API E2E | Accepted default; not installed |
| Lint/format | ESLint (eslint-plugin-vue, typescript-eslint) + Prettier | Repository config files | Installed |
| API | Independent Laravel API | `/api/v1` | Consumed through the pinned contract; contract canonical in the API repository |
| Authentication | Sanctum SPA cookies/session/CSRF | HttpOnly session cookie | First-party session; no tokens in the SPA |
| API types | Generated from the pinned durable OpenAPI artifact | Orval | Installed; read-only sync, fail-closed SHA/run/hash, no `latest` |
| Context kit | @owlcodium/context-spec-develop | 1.2.1 | Installed in project scope |
| Context validator | Python 3 | No third-party Python dependencies | Tooling only |

Production images, hosting, deployment platform, observability and the owners of unresolved facts: `NOT FOUND`.
