# Plan — FEAT-5 scaffold (Issue #5)

## Approved approach

Single-owner scaffold in three waves: manifest+lockfile, configs+skeleton, providers+green build. The lockfile is the pin of record; peer conflicts are resolved toward the ADR constraints and recorded. This plan is also the shared foundation reference for FEAT-3/16/18 (tooling versions and commands), so those items stay compact and do not duplicate it.

## Confirmed touchpoints

- Files/components/services (all new): `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind` config via CSS-first v4 setup, `src/main.ts`, `src/App.vue`, `src/app/router/` (manual modules), `src/app/providers/` (Query, Pinia), `src/features/*/README.md` placeholders, `src/shared/`, `src/lib/`, `public/`, `.nvmrc`/Docker toolchain file for Node 24.
- Interfaces and data: none runtime (placeholder page only).
- Dependencies: preflight of this item; FEAT-2/FEAT-6 and the gates items consume this scaffold (cross-item, planned order — not row dependencies).

## Execution order

1. Preflight (independent reviewer) — no installs before it.
2. Designer implements S1–S3 in waves; lock resolution happens in S1.
3. Parent integrates per EXC-0001 (branch `feat/wave-1-spa-foundations`, target `main`, remote `origin` — already recorded).

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-5-S1 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | none | package.json + committed lockfile; clean `npm ci` on pinned Node 24 toolchain; resolved versions + any matrix deltas recorded | 1 | project,architecture |
| FEAT-5-S2 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | FEAT-5-S1 | Vite/TS strict/Quasar/Tailwind-no-Preflight configs; manual router + placeholder public page; feature skeleton per ADR decision 4 | 2 | project,architecture |
| FEAT-5-S3 | designer (ses_efce07101ffePWEDtqz3oNpqFD) | FEAT-5-S2 | Query + Pinia providers wired; `vue-tsc`, ESLint, production build green with recorded commands; no fake auth/CRUD present | 3 | project,testing |

Wave rule: single mutable owner (designer); each wave ends in a reviewable commit. Integrator: orchestrator.

## Test plan

- Foundation gates at S3: `npm ci` from clean checkout, `vue-tsc --noEmit` (strict), ESLint, `vite build` — exact commands, toolchain image and exit codes recorded in verification (not claimed in this plan).
- Manual check: placeholder route renders with Quasar component styles intact and a `tw`-prefixed utility applied.
- Defer: full harness (FEAT-18), CI workflows (FEAT-16), CSS computed-style smoke suite (FEAT-6).

## Risks and rollback

- Risk: peer-dependency conflicts (vite 8 × quasar plugin). Mitigation: resolve toward ADR constraints; record deltas in the matrix per its update policy. Rollback: revert scaffold commits; repo returns to docs-only state.
- Risk: host toolchain mismatch (Node 26/npm 12.0.2 workstation). Mitigation: project-local Docker/portable toolchain pinned to Node 24; no host-global change. Rollback: none needed (no host mutation).
- Risk: lockfile drift. Mitigation: committed lockfile + `npm ci` only; no ad-hoc installs after S1 without a recorded reason.

## Required approvals

- Preflight by independent reviewer; delivery under EXC-0001 (automatic, create-only PR). No production authorization involved.
