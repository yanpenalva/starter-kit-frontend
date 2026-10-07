# Preflight — FEAT-19 frontend scan findings

- Delivery record (EXC-0001): branch `fix/fe-scan-findings`, target `main`, remote `origin`; current branch confirmed before implementation.
- Scope: FE session/auth, router/nav, existing user/role/audit API consumers and Vitest/MSW tests. No backend or generated-client output changes.
- Security: permission guard must match API permission contracts; no new persistence of credentials or profile data.
- Classification: product/feature; high complexity; cross-module impact; security relevant; high confidence; high risk; extended routing.
- Issue linkage: NOT FOUND. `gh` is unavailable and the public GitHub API endpoint returned 404. Git finalization remains subject to the required issue-to-work-item traceability control.
- PR opening is explicitly excluded; orchestrator owns that action.
