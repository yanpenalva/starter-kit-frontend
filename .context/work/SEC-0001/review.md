# Review — SEC-0001

## Inputs

- Request: Update dependencies to latest secure versions without breaking the project, isolated to worktree.
- Spec: `.context/work/SEC-0001/spec.md`
- Plan: `.context/work/SEC-0001/plan.md`
- Diff: `package.json`, `package-lock.json`, `orval.config.ts`, `src/lib/api/generated/**`, `.context/**`
- Verification: `.context/work/SEC-0001/verification.md`
- Applicable policies: `.context/policies/core/code-quality.md`, `.context/project/quality.md`, `.context/project/delivery.md`
- Exceptions: `EXC-0002` (Issue link waiver approved 2026-11-20)

## Correct

- Direct dependencies in `package.json:29-63` updated to latest compatible in-range versions with exact pins.
- Lockfile refreshed cleanly under Node 24.15.0 and CI-pinned npm 12.2.0.
- All 4 high-severity vulnerabilities eliminated; total vulnerable package entries reduced from 21 to 5 moderate entries (16 fewer affected package entries, high 4 -> 0, moderate 17 -> 5) across 2 distinct advisories.
- `orval.config.ts:21` header updated from 8.39.0 to pinned Orval 8.48.0.
- Orval client regenerated; expected reviewed diff reflects 142 changed files across the generator config and output: 141 files under `src/lib/api/generated/` plus `orval.config.ts`; 10 generated API client files have query typing diffs (12 hook `queryOptions` assertions and 10 query-key `DataTag` intersections). All changes compile to identical runtime JavaScript.
- Deterministic Orval verification succeeded with an isolated temporary Git index under `/tmp/opencode` without altering the real Git index.
- Full test suite passed (75 test files, 696 tests) with coverage meeting configured thresholds (Statements 93.17%, Branches 88.12%, Functions 94.41%, Lines 94.16%).
- Format check, ESLint, TypeScript compilation, contract verification, and build all passed without errors under Node 24.15.0 and CI-pinned npm 12.2.0.
- Uncommitted state maintained as instructed for parent orchestrator finalization; no merge readiness or residual advisory acceptance is claimed.

## Problems and risks

- Priority: Non-blocking
- Location: `package.json:47`
- Evidence: `@vue/test-utils: 2.6.0` retains 5 moderate transitive entries mapping to 2 distinct advisories (`glob` GHSA-3g3m-2fjr-6pw4 [13.0.6] and `minimatch` GHSA-g3hv-75wg-m249 [10.2.6] via `js-beautify` 2.0.3 and `editorconfig` 3.0.2). Production audit `npm audit --omit=dev` confirms 0 vulnerabilities.
- Pre-existing limitation: `src/lib/api/generated/models/userResourceRolesItem.ts` still has the old Orval 8.39 header and a stale model/barrel export absent from the current OpenAPI schema; `client:check` does not remove stale tracked files already on disk. Retained as pre-existing, not introduced by this diff.
- Reactivity note: `@vue/test-utils 2.6.0` changes reactivity for in-place mutations of plain object/array props; verified that project test suite passes without regressions (696 tests).
- Impact: Dev-only, does not affect production bundle or runtime security.
- Recommendation: Recorded neutrally for parent attribution and risk evaluation; no acceptance of residual advisories or merge readiness is claimed. Retaining dependency avoids unsafe downgrade or cross-major override.

## Baseline checklist

- [x] No new critical reliability or security issue.
- [x] No unexplained complexity or duplication regression.
- [x] Tests and actual command evidence are present.
- [x] Each material check records command, scope, exit code, date and limitations.
- [x] Compatibility, data and rollback risks are addressed.
- [x] Sensitive data and AI-use controls are addressed.
- [x] Subtask boundaries, wave dependencies and integration ownership are evidenced.

## Findings Summary

- `package.json:47`: Non-blocking (residual dev-only dependency path documented; 2 distinct advisories across 5 package entries; no upstream fix available without unsafe downgrade or cross-major override).

## Verdict

`PENDING PARENT ATTRIBUTION` (0 blocking, 1 non-blocking)
