# Plan — SEC-0001 Security dependency refresh 2026-11

## Approved approach

Perform a minimal, high-compatibility dependency refresh of direct dependencies in `package.json` to the latest compatible versions within their current major versions, refresh `package-lock.json` under Node 24.15.0 and CI-pinned npm 12.2.0, update `orval.config.ts` header to 8.48.0, regenerate client output, verify client check and build deterministically using an isolated temporary Git index, run all test/lint/typecheck gates, and leave changes uncommitted for parent orchestrator finalization.

## Confirmed touchpoints

- Files/components/services: `package.json`, `package-lock.json`, `orval.config.ts`, `src/lib/api/generated/**`, `.context/work/SEC-0001/**`, `.context/exceptions/EXC-0002.json`.
- Interfaces and data: OpenAPI client generation via Orval 8.48.0, Vitest unit/component tests, TypeScript compilation.
- Dependencies: `package.json` dependencies and devDependencies.

## Execution order

1. Establish CSD work item and EXC-0002 exception evidence (excluding roadmap-only EXC-0001).
2. Update compatible direct dependencies in `package.json` with exact pins.
3. Update `orval.config.ts` header from 8.39.0 to 8.48.0.
4. Refresh `package-lock.json` via clean install under Node 24.15.0 and npm 12.2.0.
5. Regenerate Orval client output; document expected reviewed generated diff.
6. Verify `npm run client:check` and `npm run build` using an isolated temporary Git index created from HEAD with generated outputs added.
7. Execute format, lint, typecheck, tests with coverage, contract verification, and build.
8. Verify CSD context rules with `python3 scripts/validate_context.py --strict --examples` and Python tests.
9. Document baseline and post-update vulnerability counts, residual paths, and results.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| SEC-0001-1 | yanpenalva | none | EXC-0002.json created and SEC-0001 work item artifacts initialized | 1 | core,project |
| SEC-0001-2 | yanpenalva | SEC-0001-1 | package.json updated with latest compatible exact pins, orval.config.ts header updated, and package-lock.json refreshed | 2 | security,project |
| SEC-0001-3 | yanpenalva | SEC-0001-2 | Deterministic client:check/build verified with isolated temp index, and full quality gate suite passes under Node 24.15.0 / npm 12.2.0 | 3 | testing,project |

## Test plan

- `npm run format:check`: code formatting verification.
- `npm run lint`: ESLint rules pass without warnings or errors.
- `npm run typecheck`: vue-tsc succeeds without type errors.
- `npm run test:coverage`: Vitest passes with line/statement/function/branch thresholds met.
- `npm run contract:verify`: Offline contract and receipt verified.
- `npm run client:check`: Orval verification confirms generated client matches reviewed outputs.
- `npm run build`: Production bundle builds successfully.
- `python3 scripts/validate_context.py --strict --examples`: Context validation succeeds.

## Risks and rollback

- Risk: Incompatible peer dependencies or runtime breaking changes in minor/patch releases.
- Mitigation: Avoid major version jumps (keep TypeScript 6.0.3 and jsdom 30.1.3); document `@vue/test-utils 2.6.0` reactivity note; execute full test suite and client generator checks.
- Rollback: Revert uncommitted changes using `git checkout -- .` if gates fail.

## Required approvals

- User Yan Penalva pre-approved isolated branch execution, dependency updates, and GitHub issue waiver (EXC-0002) in conversation on 2026-11-20.
