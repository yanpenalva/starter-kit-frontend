# Product Discovery — FEAT-1 SPA architecture foundation (Issue #1)

## Problem

- User/operator: yanpenalva (product feature owner) and every future SPA feature team.
- Situation: the frontend repository is greenfield; only CSD context and validation tooling exist. The roadmap (`starter-kit-api/.context/project/roadmap.md`, read-only reference) makes "arquitetura SPA aceita antes do scaffold" an explicit gate: SPA #5 (scaffold) must not start before SPA #1 is accepted.
- Pain or opportunity: without a decided, compatible stack matrix and recorded architecture responsibilities, scaffold work (#5), journeys (#2), quality gates (#3) and the typed client (#7) would each invent versions and boundaries independently, creating rework and incompatible couplings to the API.

## Evidence

- Observation, research or data:
  - GitHub Issue [#1](https://github.com/yanpenalva/starter-kit-frontend/issues/1), state OPEN, "In progress" on the board: objective, scope and five acceptance criteria (versioned ADR, compatibility matrix and update policy, login/bootstrap/logout flow, directory structure and conventions, API coupling restrictions). Foundation phase, P0, type Architecture.
  - Frontend canonical context: `project/overview.md` (greenfield, independent SPA), `project/architecture.md` (rendering mode, router conventions, state management, HTTP client and component structure are NOT FOUND and assigned to Issue #1), `project/stack.md` (planned technologies, no installed application dependency).
  - API canonical references, read-only: `starter-kit-api/.context/project/api.md` (transport, Sanctum cookie/session/CSRF contract, `/sanctum/csrf-cookie`, login 204 then `GET /api/v1/auth/my-profile`, logout 204), `starter-kit-api/docs/adr/0001` (independent repos), `0002` (Sanctum SPA session), `0003` (contracts/persistence), and the user master roadmap (SPA #1 Ready, wave 0: architecture and compatibility matrix; versions resolved by official documentation and lockfile at implementation).
  - Session registry/official-documentation research (2026-10-03, read-only): stable compatible versions for Vue, Quasar, Vite, TypeScript, Tailwind, Router, Pinia, TanStack Query, test and lint tooling; recorded in `compatibility-matrix.md` with source links. This is documented research evidence, not an installed lockfile.
  - Repository state at preparation: frontend HEAD `4c2d5b4` on `main`, clean worktree; API PR #30 merged at SHA `1d45f752837ec69ceb250454e9915070bc4242cd` (contract/ADR alignment), per session-provided evidence.
- Confidence and gaps: high confidence that the architecture decision itself is the deliverable and that no code exists yet. Gaps remain `NOT FOUND`: production CORS origins/domains, exact OpenAPI acquisition for the SPA (API #6/#11), design tokens (SPA #6), CI jobs (SPA #3/#18), and any runtime evidence for the proposed versions (nothing is installed).

## Hypothesis

If we `adopt a documented, compatibility-checked SPA architecture (proposed ADR + matrix + responsibilities) before scaffold`, then `the frontend delivery team (issues #2–#20)` will `scaffold and build features on one stable foundation without revisiting stack or boundary decisions` because `versions, module organization, state ownership, CSS coexistence and API coupling rules are decided and human-accepted before any code exists`.

## Success

- Primary metric: human acceptance of the proposed ADR and compatibility matrix by yanpenalva (gate decision recorded in this work item), enabling preflight for the scaffold item.
- Baseline: zero ADRs, zero application files, no compatibility matrix (only planned stack names in `project/stack.md`).
- Target: all five Issue #1 acceptance criteria satisfied at documentation level: proposed ADR ready to version into `docs/adr/` on acceptance; matrix and update policy; login/session bootstrap/logout flow described; directory structure and conventions; API coupling restrictions.
- Observation period: pre-implementation gate (no production observation window exists; runtime observation is NOT FOUND until deploy work SPA #19).

## Constraints and alternatives

- Constraints:
  - Documentation-only lane: no app source, package installs, lockfile, CI, Git commits/push, or board mutations in this wave.
  - Independent repositories: frontend must not edit API repo artifacts; API docs are read-only references.
  - Sanctum cookie/session/CSRF authentication contract from the API canonical doc; no Bearer tokens in the SPA login flow; no tokens or sensitive server profile in localStorage.
  - Registry/official-doc research only for versions; exact resolution happens via lockfile at implementation (roadmap instruction); no claim of installed or tested versions.
  - CSS constraint: Quasar must remain; Tailwind 4 must coexist without Preflight reset breaking Quasar component styles.
- Alternatives considered:
  - Proceed straight to scaffold (#5) and decide architecture ad hoc: rejected; violates the roadmap gate and multiplies reversible decisions into code.
  - Adopt legacy `starter-kit-laravue` SPA structure wholesale: rejected; it is a read-only reference and the roadmap derives domain rules from new features, not legacy reuse (API ADR 0001 incorporation note).
  - Choose the typed-client generator now (Orval/Hey API): deferred; the OpenAPI artifact publication (API #6/#11) does not exist yet; decision belongs to SPA #7.
- Why now: SPA #1 is the only Ready item in the board's wave 0; the scaffold gate blocks the entire frontend roadmap behind it.
