# Support Triage — BUG-72 Eliminate unhandled role-list request rejections in user page tests

## Classification

- Type: bug
- Reporter: yanpenalva
- Triage owner: yanpenalva
- First observed: 2026-10-13, reported against PR #72

## Impact

- Affected users or systems: Frontend test verification for PR #72.
- Current impact: The UsersPage tests pass their assertions, but Vitest exits with unhandled network rejections.
- Scope and frequency: Reproducible in UsersPage tests that mount role selectors without a roles API handler.
- Severity: sev4

## Immediate decision

- Containment required: no
- Escalation required: no
- Chosen path and reason: Support bug; no active production impact. Reproduce the rejected requests and add the missing MSW handler to the affected test setups.

## Source

- Existing delivery: [PR #72](https://github.com/yanpenalva/starter-kit-frontend/pull/72), branch `feat/role-selection`, targeting `main`.
- This work item tracks a regression correction within that open PR; no separate production incident or release is involved.
