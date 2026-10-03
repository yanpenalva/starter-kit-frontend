# Specification — FEAT-5 scaffold (Issue #5)

## Request

- Source: GitHub Issue #5 (board wave 1); ADR 0001 implementation start.
- Requester: yanpenalva.
- Date: 2026-10-03.

## Objective

Create the real application base on the accepted stack: dependency manifest with lockfile, Vite/TypeScript/Quasar/Tailwind/Router configs, feature-folder skeleton, a placeholder public page, and the Query/Pinia provider foundation — reproducible via `npm ci` on Node 24 LTS through a project-local portable toolchain (Docker/project-pinned; no host-global change).

## Scope

- `package.json` + committed `package-lock.json` (npm 12.2.0-compatible; installs via `npm ci`): vue 3, quasar 2, vue-router 5 (manual route modules), pinia 4, @tanstack/vue-query 5, vite 8 + @quasar/vite-plugin + @vitejs/plugin-vue, typescript 6.x strict + @vue/tsconfig + vue-tsc, tailwindcss 4 (theme+utilities, Preflight disabled, `tw` prefix), sass-embedded; dev tooling per FEAT-3/16/18 (ESLint, Prettier, Vitest, VTU, MSW — configs may land with those items, versions pinned here).
- Configs: Vite + Quasar plugin, strict TS, Tailwind v4 Vite integration without Preflight, aliasing for `features/`, `shared/`, `lib/`.
- Skeleton: `src/features/` (auth/users/roles/logs placeholder READMEs), `src/shared/`, `src/lib/`, manual router with a single placeholder public route, Query + Pinia providers wired in the app bootstrap.
- Placeholder public page (no auth, no CRUD, no fake data).

## Out of scope

- Auth/journey behavior (FEAT-2); layouts/tokens (FEAT-6); full test harness and CI configs (FEAT-3/16/18 own them; only versions are pinned here); typed client generation (SPA #7); deploy.

## Evidence and context

- Branch `feat/wave-1-spa-foundations` from `42f235ce8085375357570675d32db0972a78f3d8`, target `main`, remote `origin`; ADR 0001 + FEAT-1 matrix are the immutable decision base; peer resolution at install is expected and recorded (matrix update policy item 1).
- Unknowns (`NOT FOUND`): exact resolved versions (resolved by this item's lockfile); Docker image pin for the portable toolchain (chosen at execution, recorded in the plan evidence).

## Rules and contracts

- ADR/matrix decisions are not reopened; disagreement between lock resolution and the matrix updates the matrix in the same change with the reason.
- No sensitive defaults: no secrets, no telemetry keys; public assets only.
- Security impact: none (no auth boundary yet); supply-chain hygiene via pinned lockfile.

## Tests and acceptance criteria

1. Clean-checkout `npm ci` succeeds on the pinned Node 24 toolchain (exact command, toolchain image/versions recorded).
2. `vue-tsc` strict, ESLint, production build all green (commands + exit codes recorded at execution).
3. Placeholder public route renders; Quasar component CSS + Tailwind utility coexist on the page (manual + later FEAT-6 smoke).
4. Router is hand-written; feature-folder skeleton matches ADR decision 4.

## Open decisions

- None material: stack accepted; Docker image pin and exact resolved versions are `REVERSIBLE_AGENT_DECISION` for the designer owner, recorded at execution.
