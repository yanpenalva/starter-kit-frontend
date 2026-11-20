# Support Triage — SEC-0001 Security dependency refresh 2026-11

## Classification

- Type: bug
- Reporter: yanpenalva
- Triage owner: yanpenalva
- First observed: 2026-11-20

## Impact

- Affected users or systems: Local development environment, CI pipelines, and frontend dependency chain.
- Current impact: 21 vulnerable package entries (17 moderate, 4 high, 0 low, 0 critical) across 22 distinct GHSA advisories reported on baseline package-lock.json under Node 24.15.0 / npm 12.2.0 at HEAD d528a9b.
- Scope and frequency: Static dependency manifests and lockfile in starter-kit-frontend.
- Severity: sev3

## Immediate decision

- Containment required: no
- Escalation required: no
- Chosen path and reason: Perform in-range, compatible dependency refresh under pinned Node/npm toolchain, updating exact pins without breaking existing contracts or tests.
