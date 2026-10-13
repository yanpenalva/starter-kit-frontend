# Preflight Validation — FEAT-20 W2 frontend integration

## Checks

- [x] Request and objective are clear; accepted criteria are recorded in `spec.md`.
- [x] Scope excludes API source changes, role assignment in POST, PR, deployment and browser checks.
- [x] Current API `main` and artifact are verified: commit `ec14bab9a24fe2641bb41b927f40365cf8a12af2`; workflow run `38409872620` completed successfully; artifact `11821515121`, provider ZIP digest `bf345edba35d3e6bd82404786b8649cb822e883d6703ae4069bff43554a080c0`.
- [x] Source confirms audit search over actor name, event and action; authorization contracts distinguish `logs.view`, `roles.view` and `users.assign-roles`.
- [x] All planned FE files exist; new code stays in existing modules and test patterns.
- [x] Security/privacy: no audit identity fields are added to responses; no catalog query occurs without `roles.view`; POST excludes roles.
- [x] Tests and quality commands are executable per `.context/project/quality.md`.
- [x] Git delivery record: branch `feat/fe-adj-w2-integracao`, target `main`, remote `origin`; user explicitly authorized commit and push.
- [x] `EXC-0001` is recorded for authorized branch delivery.

## Findings

- Local branch was at `41f2c85`, matching `origin/main`. Before work, only local untracked `node_modules/` was present; it is excluded from the commit.
- The prior FE pin targeted API SHA `7ab7876d...`; its 87,938-byte OpenAPI file was stale. The latest published artifact before this task was itself behind API main and lacked the newly merged audit-search parameter. Per the user's decision, the official producer workflow was dispatched on current `main`; it completed successfully and its artifact digest was verified.
- Current spec size is 159,585 bytes, exceeding the existing 131,072-byte cap. The verifier cap will be raised to 262,144 bytes while retaining archive, member allowlist, duplicate-key, ref and digest checks.
- Related prior issue #14 is closed; no open follow-up issue was found. No issue was created.
- Independent preflight reviewer: NOT FOUND in the available single-agent execution context. Implementer proceeds under the user's explicit scope and delivery authorization; this is not recorded as an independent review.

## Evidence record

- Read-only remote checks: `git ls-remote origin refs/heads/main` in the API repo showed the exact main SHA above; GitHub Actions metadata confirmed workflow/path/status/conclusion, run attempt, artifact name/id/size/expiry and provider digest.
- `scripts/vendor/openapi-contract/contract_extract.py` rejected the contract under the prior 131,072-byte limit, confirming the measured cap issue. The archive was then safely extracted with the new bounded 262,144-byte limit; `contract:verify` passes.
- Date: 2026-10-13. No browser or API deployment action was run.

## Verdict

`READY`

Reviewer: Codex (implementer; independent reviewer not available)
Date: 2026-10-13
