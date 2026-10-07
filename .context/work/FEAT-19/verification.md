# Verification Evidence — FEAT-19 frontend scan findings

## Frontend gates

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | 256 tests passed across 28 test files. |
| `npm run typecheck` | PASS | `vue-tsc --noEmit` completed successfully. |
| `npm run lint` | PASS | `eslint .` completed successfully. |
| `npm run format:check` | PASS | All matched files use Prettier code style. |
| `npm run build` | PASS | `vue-tsc --noEmit && vite build`; 251 modules transformed. |
| `npm run client:check` | PASS | Approved offline contract verified, Orval generation completed, generated output matched tracked artifacts. |

## Context gates

| Command | Result | Evidence |
| --- | --- | --- |
| `python3 scripts/validate_context.py --strict` | PASS | Context validation passed. |
| `python3 scripts/validate_context.py --strict --examples` | PASS | Context validation passed; no example suite is installed. |
| `python3 -m unittest discover -s tests -v` | PASS | 18 tests passed. |
| `npx --yes @owlcodium/context-spec-develop@1.2.1 doctor --scope project` | PASS | CSD is healthy (1.2.1). |

## Interaction coverage

- MSW session tests cover 401 invalidation, 500 retention/retry, successful profile hydration, concurrent request deduplication, stale bootstrap after logout, and logout failure cleanup.
- Router test covers `roles.view` access without the literal admin role.
- Navigation tests cover logout success and failure feedback/navigation.
- MSW page tests cover user filters, pagination and status mutation; role search and permission mutation; audit feed event and subject filters.
- Client generation check did not produce generated-artifact drift.
