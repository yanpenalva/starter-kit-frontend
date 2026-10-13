# Plan — FEAT-9 MFA login challenge flow

## Approved approach

Add two hand-written auth calls through the existing `transportApi`, carry the challenge state in the Pinia session store, and route through a focused page using existing auth layout and form-error patterns. Keep the generated client and existing permission checks unchanged.

## Confirmed touchpoints

- Files/components: `auth.api.ts` and tests; `session-model.ts`, `session.ts` and store tests; `LoginPage.vue` and tests; new `MfaChallengePage.vue` and tests; `descriptors.ts`, router tests; MSW handlers/tests; auth README.
- Interfaces and data: login `{ requires_mfa?: boolean }`; challenge `{ code?: string; recovery_code?: string }`; `mfa_required` session status.
- Dependencies: existing Axios/transport, Pinia, Vue Router, Vitest, MSW and form feedback component.

## Execution order

1. Add failing API/store/page/router/MSW tests before changing production files.
2. Implement transport, session transition, challenge page and guard.
3. Update auth documentation and run all requested gates plus context validation.
4. Review the diff, commit on `feat/mfa-challenge-flow`, and push to `origin`; do not open a PR or merge.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| A | senior-software-engineer | none | New API, store, page, router and MSW tests fail for missing behavior | 1 | security, testing |
| B | senior-software-engineer | A | New tests pass; existing permission guard cases remain unchanged | 2 | architecture, project, security, testing |
| C | senior-software-engineer | B | Requested frontend gates, client drift check, context validator and diff review | 3 | core, testing |

Integration owner: senior-software-engineer. Single-agent execution; no parallel boundaries.

## Test plan

- Run focused Vitest files after adding tests to establish red, then rerun after implementation.
- Run all requested commands: typecheck, lint, format check, Vitest, client check and build.
- Confirm no tracked files under `src/lib/api/generated/` changed.

## Risks and rollback

- Risk: a pending challenge could be mistaken for an authenticated session or stale challenge state could reach a protected page.
- Mitigation: explicit closed session status, no profile read before challenge, dedicated guard tests, in-memory-only state.
- Rollback: revert the feature commit; no backend, schema, migration or generated-client changes.

## Required approvals

- User explicitly approved the scope and direct commit/push while excluding PR/merge.
- No release or production action is included.
