# Engineering Conventions

- Conventional Commits; small, reviewable PRs targeting `main`.
- Each implementation task corresponds to a GitHub Issue. Record its URL in the CSD work item's `discovery.md` (product) or `triage.md` (support); do not add fields absent from the canonical JSON schema; use `FEAT-<issue-number>` for product work and `BUG-<issue-number>`, `INC-<issue-number>` or `HOTFIX-<issue-number>` for the applicable support path. Track/type come from intake, not the prefix alone.
- Link the work-item path in the PR and link the PR in its verification/release evidence. Use `Closes #<issue-number>` only for the corresponding issue. Work IDs are unique within this repository.
- Onboarding creates no work item. Its real evidence is kept in `project/onboarding.md`.
- Record material architecture decisions in `docs/adr/` through reviewed ADRs; [ADR 0001](../../docs/adr/0001-vue-spa-architecture.md) (Vue SPA architecture) was accepted by yanpenalva on 2026-10-03 ("Aprovar pacote SPA", recorded in `.context/work/FEAT-1/approval.md`); runtime implementation remains pending. Revisit project context after the first scaffold.
- Work items inside the EXC-0001 roadmap scope MUST reference the exception in `policy_exceptions` (see `.context/exceptions/EXC-0001.json` and `delivery.md`).
- Preserve `.context/` as the sole normative context. Agent adapters only route to it.
- Deployment and versioning remain independent between API and frontend.
- Variables and identifiers are authored strictly in en-US.
- User-facing return status, error, request validation, and general user messages are authored strictly in pt-BR.
- Source comments: useless or redundant comments are removed; necessary machine/tool directives, legal notices, and technically necessary directives are preserved.
- PHPStan annotations apply exclusively to PHP codebases and must never be introduced into TypeScript.
- Naming beyond these conventions, review ownership and detailed compatibility policy: `NOT FOUND`.
