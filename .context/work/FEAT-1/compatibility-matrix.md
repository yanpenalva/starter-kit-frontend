# FEAT-1 Compatibility Matrix — proposed, research evidence only (Issue #1)

Status: DRAFT FOR REVIEW. Nothing in this file is installed, locked or build-tested. Exact versions are resolved by official documentation and the lockfile at implementation (roadmap instruction for SPA #5/#3). This matrix is decision-level; the lockfile is the pin of record.

Evidence basis: session registry/official-documentation research recorded 2026-10-03 (read-only). Sources are the official pages linked per row. No version resolution or build verification has been performed in this repository.

## Proposed stable matrix

| Area | Package | Proposed version | Key constraint observed | Source |
| --- | --- | --- | --- | --- |
| UI framework | vue | 3.5.43 | CSR SPA rendering only | https://vuejs.org |
| UI component library | quasar | 2.34.0 | Must stay; component CSS + normalize preserved | https://quasar.dev/start/vite-plugin |
| Vite integration | @quasar/vite-plugin | 2.0.2 | Peers: vite ^8, @vitejs/plugin-vue ^6.0.5, quasar ^2.24 | https://quasar.dev/start/vite-plugin |
| Bundler | vite | 8.3.2 | Peer of @quasar/vite-plugin 2.0.2 | https://quasar.dev/start/vite-plugin |
| Vue build plugin | @vitejs/plugin-vue | 6.0.9 | Peer of vite ^8 line | https://quasar.dev/start/vite-plugin |
| CSS utilities | tailwindcss | 4.3.3 | v4 Vite plugin usage; Preflight must be disabled for Quasar coexistence | https://tailwindcss.com/docs/installation/using-vite , https://tailwindcss.com/docs/preflight |
| Language | typescript | 6.0.3 | TS 7.0.2 (stable) lacks programmatic APIs needed by Vue tooling (vue-tsc), so 6.x line chosen; typescript-eslint 8.71.0 requires TS below 6.1 | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ |
| Type checking | vue-tsc | 3.3.12 | Pairs with typescript 6.0.3 | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ |
| TS base config | @vue/tsconfig | 0.9.1 | Strict baseline for app + tsconfig extends | https://vuejs.org |
| TS lint | typescript-eslint | 8.71.0 | Requires typescript below 6.1 — compatibility guard recorded | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ |
| Router | vue-router | 5.3.1 | v4-to-v5 migration guide applies when porting legacy patterns | https://router.vuejs.org/guide/migration/v4-to-v5.html |
| UI state | pinia | 4.0.3 | devtools-api 8.2.1 is a non-optional peer | https://github.com/vuejs/pinia/releases/tag/v4.0.0 |
| Server state/cache | @tanstack/vue-query | 5.104.1 | Owns remote server state incl. session profile cache | https://tanstack.com/query/latest/docs/framework/vue/overview |
| Unit test runner | vitest | 5.0.3 | Proposed default; configured at SPA #3 | https://vitest.dev/guide/ |
| Component tests | @vue/test-utils | 2.5.1 | With vitest + jsdom | https://vitest.dev/guide/ |
| DOM env | jsdom | 30.1.1 | Requires Node 24.15+ (or 22.22.2 line); drives Node floor | https://vitest.dev/guide/ |
| Network mocks | msw | 3.0.1 | Local UI test mocks only; never presented as real API evidence | https://vitest.dev/guide/ , roadmap SPA #3 note |
| E2E | playwright | 1.63.0 | Real-API E2E arrives with SPA #17 (not this wave) | https://playwright.dev/docs/intro |
| Sass | sass-embedded | 1.105.1 | Quasar Sass variables support | https://quasar.dev/start/vite-plugin |
| Lint core | eslint | 10.12.0 | With eslint-plugin-vue and TS config below | https://eslint.org |
| Vue lint | eslint-plugin-vue | 10.11.1 | Flat config with typescript-eslint | https://eslint.vuejs.org |
| TS+Vue lint config | @vue/eslint-config-typescript | 14.9.0 | Pairs with typescript-eslint 8.71.0 | https://eslint.vuejs.org |
| Formatter | prettier | 3.9.9 | Proposed default | https://prettier.io |
| Package manager | npm | 12.2.0 pinned proposal | Engine Node ^24.15 per jsdom floor; install via `npm ci` from lockfile | https://docs.npmjs.com |
| Runtime | Node.js | 24 LTS, at least 24.15 | jsdom 30.1.1 floor; LTS alignment | https://vitest.dev/guide/ |

## Known environment gap (recorded, not resolved here)

- Current host observed in session evidence: Node 26.8.2 with npm 12.0.2 — this is NOT the target LTS line (Node 24 >= 24.15, npm 12.2.0). Scaffold (SPA #5) must build against the Node 24 LTS baseline and verify the lockfile install; this lane changed nothing in any environment.

## Update policy (proposed)

1. This matrix records decision-level compatibility, researched from official documentation; the application lockfile created at SPA #5 is the exact pin of record. If the lockfile resolution disagrees with this matrix, the matrix is updated in the same PR with the reason.
2. Version bumps within a major line are routine maintenance at scaffold/feature time and do not need a new ADR; a major-version jump of vue, quasar, vite, tailwindcss, typescript, vue-router, pinia or @tanstack/vue-query is a material architecture decision and updates the ADR through review.
3. Before each major bump: check the official migration guide (e.g., router v4-to-v5 page) and the peer-dependency triangle quasar/@quasar/vite-plugin/vite/@vitejs/plugin-vue; never bump one corner alone.
4. TypeScript line guard: stay on 6.x while Vue tooling (vue-tsc) requires programmatic APIs that TS 7 does not expose; revisit when vue-tsc announces TS 7 support. typescript-eslint compatibility (<6.1) is a second guard.
5. Registry research is repeated at scaffold time; this matrix must not be cited as proof that any version was installed or tested.

## Explicitly not chosen here

- Typed-client generator (Orval, Hey API): both are compatible candidates for SPA #7 once API #6/#11 publish the OpenAPI artifact; private artifact acquisition details remain pending (API #6). No choice is made in this wave.
- Design tokens: deferred to SPA #6 (designer lane); only the extension point is reserved in the ADR.
