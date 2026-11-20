# Specification — SEC-0001 Security dependency refresh 2026-11

## Request

- Source: Direct user instruction in session 2026-11-20
- Requester: yanpenalva
- Date: 2026-11-20

## Objective

Update project dependencies to the latest secure, compatible versions under Node 24.15.0 and CI-pinned npm 12.2.0, resolve security advisories without breaking functionality, tests, or contract generation, update the Orval generated header, verify all quality gates, and leave changes uncommitted for parent orchestrator finalization.

## Scope

- Isolated worktree: `/home/hiyan/Development/github/personal/starter-kit-frontend/.slim/worktrees/security-dependency-refresh-2026-11`.
- Direct dependencies in `package.json` with exact pins.
- Lockfile refresh in `package-lock.json`.
- Header sync in `orval.config.ts` from 8.39.0 to pinned Orval 8.48.0, with deterministic regeneration.
- Delivery tracking record: branch `security/dependency-refresh-2026-11`, target `main`, remote `origin`.
- User task-specific Git authorization and delivery decision (2026-11-20): user yanpenalva authorized commit, push, and PR creation for all three task branches, but chose to keep frontend merge blocked while the two moderate dev-only advisories remain (no risk acceptance); the branch may proceed through PR/CI, but no merge into main is permitted; parent orchestrator handles Git operations; working tree left uncommitted.
- Exception `EXC-0002` applies: the user explicitly waived a GitHub Issue for this task only; retains work item, PR, review, and validation evidence without waiving quality/security gates.

## Out of scope

- Committing, pushing, PR creation, merging, or deleting branches (orchestrator handles Git finalization).
- Modifying the original main checkout.
- Major breaking framework/tool migrations (e.g. TypeScript 7.x, jsdom 31.x).
- Downgrades that weaken security or test reliability (e.g. unsafe @vue/test-utils downgrade).
- Out-of-range cross-major overrides without upstream compatibility.
- Manual changes to generated Orval API clients or API contract files.
- Claiming zero diff on generated files when generator template updates apply.

## Evidence and context

- Repository evidence: Baseline HEAD d528a9b on `origin/main` has 21 vulnerable package entries (17 moderate, 4 high, 0 low, 0 critical) across 22 distinct GHSA advisories.
- Post-update advisory evidence: Current audit is exit 1, 5 vulnerable package entries (all moderate) across 2 distinct advisories (`GHSA-3g3m-2fjr-6pw4` in `glob` and `GHSA-g3hv-75wg-m249` in `minimatch`); `npm audit --omit=dev` is exit 0 with zero production advisories. Net delta: 16 fewer affected package entries (21 -> 5: high 4 -> 0, moderate 17 -> 5). Dev-only dependency chain: `devDependencies: @vue/test-utils` (2.6.0) -> `js-beautify` (2.0.3) -> `glob` (13.0.6); `js-beautify` -> `editorconfig` (3.0.2) -> `minimatch` (10.2.6).
- Toolchain evidence: Host Node 26 runtime rejected by package.json engines (`>=24.15.0 <25`); local Node 24.15.0 in `~/.nvm/versions/node/v24.15.0/bin` and CI-pinned npm 12.2.0 via `npx --yes npm@12.2.0` used without globally modifying system npm.
- Pre-existing generator limitation: `src/lib/api/generated/models/userResourceRolesItem.ts` still has the old Orval 8.39 header and a stale model/barrel export absent from current pinned OpenAPI output; `client:check` does not remove stale tracked files already on disk. Retained without manual editing or deletion.
- Relevant project context: `.context/policies/core/code-quality.md`, `.context/project/delivery.md`, `.context/project/quality.md`, `.context/exceptions/EXC-0002.json`.
- Unknowns (`NOT FOUND`): Quality owner, production infrastructure.

## Rules and contracts

- Business or operational rules: Strict engine compliance; script allowlist preservation; exact pinning (`save-exact=true`).
- Reactivity behavior note: `@vue/test-utils 2.6.0` changes reactivity for in-place mutations of plain object/array props; preserved with this compatibility note and verified through the full test suite.
- Interfaces, data and permissions: Orval client generator contract and provenance remain unchanged; reviewed diff reflects 142 changed files across the generator config and output: 141 files under `src/lib/api/generated/` plus `orval.config.ts`; 10 generated API client files have query typing diffs (12 hook `queryOptions` assertions and 10 query-key `DataTag` intersections). All changes compile to identical runtime JavaScript.
- Security and privacy impact: 16 fewer affected package entries (high 4 -> 0, moderate 17 -> 5; 21 -> 5 package entries across 2 distinct advisories); residual 5 entries are dev-only and documented; zero production vulnerabilities confirmed via `npm audit --omit=dev`.
- Review attribution: All review attribution is left neutral and pending parent review; no acceptance of residual advisories or merge readiness is claimed.

## Tests and acceptance criteria

- Clean install succeeds under Node 24.15.0 and npm 12.2.0.
- `npm run format:check` passes cleanly.
- `npm run lint` passes cleanly.
- `npm run typecheck` passes cleanly.
- `npm run test:coverage` passes with all 75 test files (696 tests) green and meeting coverage thresholds (Statements 93.17%, Branches 88.12%, Functions 94.41%, Lines 94.16%).
- `npm run contract:verify` passes offline.
- Deterministic Orval client generation: `npm run client:check` and `npm run build` succeed when verified against an isolated temporary Git index containing reviewed generated files.
- CSD validation passes cleanly: `python3 scripts/validate_context.py --strict --examples`.
- Python unittests pass: `python3 -m unittest discover -s tests -v`.
- CSD doctor passes: `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project`.

## Open decisions

- Dated delivery/risk decision (2026-11-20): User chose to keep frontend merge blocked while the two moderate dev-only advisories remain; no risk acceptance. User separately authorized commit, push, and PR creation for all three task branches, but no merge. The branch may proceed through PR/CI.
- Final Git operations (commit, push, PR creation) reserved for parent orchestrator; merge into main remains blocked.
