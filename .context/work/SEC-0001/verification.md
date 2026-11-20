# Verification — SEC-0001

## Evidence

- Exact commands and checks:
  1. Clean dependency installation:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 ci --cache /tmp/npm-cache`: exit code 0 (clean install under Node 24.15.0 and CI-pinned npm 12.2.0).
  2. Full audit:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 audit`: exit code 1 (5 moderate residual package entries representing 2 distinct advisories; down from 21 baseline entries with 4 high; 16 fewer affected package entries, high 4 -> 0, moderate 17 -> 5).
  3. Production audit:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 audit --omit=dev`: exit code 0 (zero production advisories).
  4. Contract verification:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run contract:verify`: exit code 0.
  5. Format check:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run format:check`: exit code 0.
  6. Lint:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run lint`: exit code 0 (0 errors, 0 warnings).
  7. Typecheck:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run typecheck`: exit code 0.
  8. Test with coverage:
     `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run test:coverage`: exit code 0 (75/75 test files passed, 696/696 tests passed; coverage thresholds satisfied: statements 93.17%, branches 88.12%, functions 94.41%, lines 94.16%).
  9. Deterministic client check and build with isolated temporary Git index:
     - Workflow executed under `/tmp/opencode`:
       ```bash
       TEMP_INDEX=$(mktemp /tmp/opencode/git-index.XXXXXX)
       trap 'rm -f "$TEMP_INDEX"; unset GIT_INDEX_FILE' EXIT
       export GIT_INDEX_FILE="$TEMP_INDEX"
       git read-tree HEAD
       git add src/lib/api/generated
       PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run client:check
       PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 run build
       ```
     - Results: `client:check` exit code 0, `build` exit code 0.
     - Real repository index was untouched; temp index was removed by shell EXIT trap.
  10. Context validation:
      `python3 scripts/validate_context.py --strict --examples`: exit code 0.
  11. Python contract & context tests:
      `python3 -m unittest discover -s tests -v`: exit code 0 (18/18 tests passed).
  12. CSD doctor:
      `PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache @owlcodium/context-spec-develop@1.2.1 doctor --scope project`: exit code 0 (CSD is healthy 1.2.1).
  13. PR and CI verification (PR #115 / commit `35b7be5fa30ed60134fdd2d8eb176c9d55e27c71`):
      - CodeQL: Succeeded
      - Deploy PR Preview Environment: Succeeded
      - GitGuardian Security Checks: Succeeded
      - Build & Upload Preview Artifact: Succeeded
      - Analyze JavaScript/TypeScript: Succeeded
      - OpenAPI client contract check: Succeeded
      - verify: Succeeded
- Scope analyzed: Direct dependencies, devDependencies, lockfile resolution, Orval API client generation, unit/component tests, production build, and CSD context governance in worktree `security-dependency-refresh-2026-11`.
- Date and environment: 2026-11-20, Linux, Node v24.15.0, npm 12.2.0 (via non-global npx).
- Limitations or `NOT APPLICABLE` rationale: Browser smoke tests require active Chrome and local dev server; smoke browser tests were not executed in this headless container environment.

## Review (Neutral / Pending Parent Attribution)

- Request and spec alignment: Technical criteria evaluated per specification.
- Plan execution: Wave execution followed.
- Scope boundary: Preserved in isolated worktree without commits, pushes, PRs, merges, or branch deletions.
- Security impact: 16 fewer affected package entries (high 4 -> 0, moderate 17 -> 5; down from 21 baseline entries to 5 residual package entries across 2 distinct advisories); all 5 residual entries are development-only; zero production advisories confirmed via `npm audit --omit=dev`.
- Regression evaluation: Compatibility note on `@vue/test-utils 2.6.0` verified with 696 passing tests.
- Core policy: Pinned engines respected, script allowlist preserved, uncommitted changes preserved for parent orchestrator finalization.
- Generated diff clarification: 142 changed files across the generator config and output: 141 files under `src/lib/api/generated/` plus `orval.config.ts`; 10 generated API client files have query typing diffs (12 hook `queryOptions` assertions and 10 query-key `DataTag` intersections).
- Pre-existing generator limitation: `src/lib/api/generated/models/userResourceRolesItem.ts` retains the Orval 8.39 header and a stale model/barrel export absent from the current OpenAPI spec; `client:check` does not remove stale tracked files already on disk. Confirmed pre-existing and not introduced by this diff.
- Delivery decision chronology (2026-11-20):
  - Earlier decision (superseded): User held frontend merge while two moderate dev-only advisories remained.
  - Latest instruction (active): User superseded the hold and authorized merging this refreshed dependency branch with the disclosed audit result (5 moderate dev-only package entries across two advisories; zero production advisories on `npm audit --omit=dev`), directing to retain secure compatible versions rather than downgrade or add unsupported overrides. This authorizes merge with the disclosed audit results and does not claim a clean audit.
- CI status: All checks succeeded on PR #115 (commit `35b7be5fa30ed60134fdd2d8eb176c9d55e27c71`): CodeQL, Deploy PR Preview Environment, GitGuardian Security Checks, Build & Upload Preview Artifact, Analyze JavaScript/TypeScript, OpenAPI client contract check, and verify.
- Review attribution: Recorded neutrally without claiming a GitHub approving review. Independent review factual and documentation findings were corrected.

## Findings

- Location: package.json:47 (`@vue/test-utils: 2.6.0`)
- Problem: Transitive dependency chain `@vue/test-utils` (2.6.0) -> `js-beautify` (2.0.3) -> `glob` (13.0.6); `js-beautify` -> `editorconfig` (3.0.2) -> `minimatch` (10.2.6) presents 5 moderate package entries mapping to 2 distinct advisories (GHSA-3g3m-2fjr-6pw4 in `glob`, GHSA-g3hv-75wg-m249 in `minimatch`).
- Reactivity behavior note: `@vue/test-utils 2.6.0` changes reactivity for in-place mutations of plain object/array props; preserved with this compatibility note and verified through project tests.
- Evidence: `npm audit` reports 5 moderate severity entries (exit code 1); `npm audit --omit=dev` reports 0 vulnerabilities (exit code 0).
- Required correction: Retained as documented dev-only residual. No unsafe downgrade or out-of-range cross-major override applied per user policy.

## Verdict

`PASS WITH KNOWN NON-BLOCKING LIMITATIONS`
