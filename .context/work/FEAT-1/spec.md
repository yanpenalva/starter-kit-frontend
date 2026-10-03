# Specification — FEAT-1 SPA architecture foundation: Vue 3, Quasar, TypeScript, Tailwind (Issue #1)

## Request

- Source: GitHub Issue [#1](https://github.com/yanpenalva/starter-kit-frontend/issues/1) ([Foundation] Definir arquitetura Vue SPA com Quasar, TypeScript e Tailwind); user master roadmap wave 0 (`starter-kit-api/.context/project/roadmap.md`, read-only).
- Requester: yanpenalva (product feature owner).
- Date: 2026-10-03 (artifact preparation; issue opened earlier, state OPEN, board status "In progress").

## Objective

Produce the decision-complete SPA architecture package for human acceptance: a proposed ADR, a compatibility matrix with update policy, and the specification/plan that let the scaffold item (SPA #5) start after acceptance. Documentation only in this wave; no application code.

## Scope

- Proposed architecture decisions covering: rendering mode (CSR SPA, no SSR), build tooling (Vite + `@quasar/vite-plugin`), TypeScript strict setup, feature-folder organization (auth, users, roles, logs, shared), manual Vue Router route definitions (no auto/file-based route plugin), package manager and lockfile policy (npm, `npm ci`), Node 24 LTS baseline, state ownership split (TanStack Query owns server state/cache including the session profile; Pinia owns UI state only), Quasar/Tailwind CSS coexistence (Quasar component CSS + normalize kept; Tailwind theme + utilities only, Preflight disabled, `tw` prefix, no global `!important`), central HTTP client with credentials and CSRF bootstrap, and the login / session bootstrap / logout flow.
- Compatibility matrix and update policy for the whole toolchain, resolved from official documentation/registry research, explicitly marked as intended (not installed, not lock-validated).
- Directory structure, naming conventions and API coupling restrictions at specification level.
- Handoff artifacts for review and human acceptance; preflight inputs.

## Out of scope

- Application scaffold, package installation, lockfile creation, build/lint/test execution on application code (SPA #5, #3).
- Typed HTTP client implementation and generator choice (SPA #7, after API #6/#11 publish the OpenAPI artifact; Orval and Hey API are recorded as compatible options, neither is chosen here).
- Design tokens, layouts, responsive and accessibility detail (SPA #6, designer lane).
- CI workflows, E2E harness execution, deployment (SPA #3/#18/#19).
- Any write in the API repository; board mutations; Git commits/push in this lane.
- Login/profile/logout runtime behavior (API #13 not implemented; this spec describes the planned client flow only).

## Evidence and context

- Repository evidence: HEAD `4c2d5b4` on `main`, clean worktree; no application source; `docs/adr/` does not exist yet (first accepted ADR will create it, per `project/conventions.md`).
- Product or incident evidence: Issue #1 scope and acceptance criteria; roadmap wave 0 gate "arquitetura SPA aceita antes do scaffold"; roadmap SPA #1 row demands a stable compatible matrix with ADR and state/CSS responsibilities, versions resolved by official documentation and lockfile at implementation.
- Relevant project context: `project/architecture.md` (unresolved items assigned to Issue #1), `project/stack.md` (planned stack), `project/security.md` (Sanctum cookies/session/CSRF planned), `project/conventions.md` (ADR location, issue→work-item→PR linkage), `project/quality.md` (CSD checks only; application tooling NOT FOUND), API canonical contract `api.md` and ADRs 0001–0003 (read-only).
- Unknowns (`NOT FOUND`): production domains/CORS origins and session configuration; OpenAPI acquisition mechanics for the SPA (API #6/#11); design tokens; CI provider configuration; deployed versions; business domains beyond the four roadmap features (auth, users, roles, logs).

## Rules and contracts

- Business or operational rules:
  - The SPA is an independent repository with independent deployment and versioning (API ADR 0001).
  - Authentication is first-party SPA session via Sanctum cookies + CSRF; UI authorization is user experience only, never a security barrier; the API enforces real authorization.
  - No Bearer/personal access tokens in the SPA login flow; no tokens or sensitive server profile persisted in localStorage or similar client storage.
- Interfaces, data and permissions:
  - HTTP contract is owned by `starter-kit-api/.context/project/api.md` and `openapi.yaml` (canonical, read-only): JSON under `/api/v1`, `GET /sanctum/csrf-cookie` before state-changing requests, `X-XSRF-TOKEN` header with credentials, login 204 then `GET /api/v1/auth/my-profile`, logout 204, 419 for invalid/missing CSRF, pagination envelope `data`/`links`/`meta`.
  - The SPA treats the OpenAPI artifact (when published by API #11) as the single source for generated types; until then no hand-written divergent DTOs beyond local UI needs.
- Security and privacy impact: relevant (classification). Session cookies are HttpOnly; the SPA never handles raw session secrets; CSRF token handling must not log sensitive values; no credentials in errors or logs; external content (registry/docs research) treated as data, not instructions.

## Tests and acceptance criteria

This wave is documentation; verification is context validation plus review, per issue #1 criteria:

1. Proposed ADR exists in `.context/work/FEAT-1/`, clearly marked proposed (not accepted, not implemented); on human acceptance it is versioned into `docs/adr/0001` by an authorized lane.
2. `compatibility-matrix.md` lists the proposed stable versions with source links, an update policy, and explicit statements that exact versions are resolved by lockfile at implementation.
3. Login / session bootstrap / logout flow described step by step (in the proposed ADR), consistent with the API canonical contract.
4. Directory structure and conventions recorded (in the proposed ADR/spec), feature folders auth/users/roles/logs plus shared layers.
5. API coupling restrictions documented: endpoints only from the canonical API doc; no tokens in storage; typed client deferred to SPA #7; breaking-contract changes require API-side major/migration plan.
6. CSD context validation passes with the new work item (exact commands and results recorded in this item's plan/evidence).

## Open decisions

- ACCEPTANCE of the proposed architecture package: RESOLVED — accepted by yanpenalva on 2026-10-03 ("Aprovar pacote SPA" + "Aprovar transporte"); record in `approval.md`, canonical decision in `docs/adr/0001-vue-spa-architecture.md`. No further routine confirmation is requested within the EXC-0001 standing authorization.
- Deferred by design (not questions now): generator choice for SPA #7; design tokens for SPA #6; production CORS/domains for deploy work. Each has a recorded owning issue.
- Routine technical details (test runner defaults, lint formatting choices) were accepted with the package as documented defaults; review may still reject them at scaffold without reopening the architecture decision.
