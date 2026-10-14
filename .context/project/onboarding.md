# Onboarding Evidence

## Sources and decisions

- User task and https://github.com/yanpenalva/starter-kit-frontend/issues/4; bounded inspection found no application files and no existing context at bootstrap.
- User confirmed bootstrap for both repositories and the generic documentary module scaffold.
- CSD npm 1.2.1; official source tag `v1.2.1`, immutable commit `6ca620e0491e94e0836bda29cd55b334b4f12aec`.
- Official project installer with `--agents codex`; bootstrap discovery/preview and application; module preview/application.
- Single-agent execution with independent human review and human release approval; the Git finalization mode is recorded in `.context/orchestration/config.json`.
- Onboarding creates no work item. No credentials, application dependencies or production infrastructure are created by onboarding.

## Pending facts

Business domains, detailed contracts, owners, production infrastructure/domains, SLA, observability, configured thresholds and deployed versions: `NOT FOUND`.

Keep every unknown fact `NOT FOUND` here until it is observed; never infer a route, permission, status, owner or operational signal.

## Validation

Canonical validation commands for this repository:

| Command | Purpose |
| --- | --- |
| `python3 scripts/validate_context.py --strict` | Structural, schema/config, link, placeholder, classification, governance, approval, exception and active-work-item checks |
| `python3 scripts/validate_context.py --strict --examples` | The same checks; reports the absence of an example suite when none is installed |
| `python3 -m unittest discover -s tests -v` | Local regression tests for the validator wrapper and the contract verifier |
| `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project` | CSD package health for the project scope |

The Node commands resolve the published package from the registry or the local npm cache; no local CSD source checkout is used.

Regression tests verify supplementary source SHA-256 integrity, application stack acceptance, optional examples, rejection of missing files/placeholders/broken links/invalid JSON, forbidden force push, invalid active work items and an invalid installed example suite.

Upstream validator applicability limitation: its unmodified public-package marker scan rejects Laravel/Vue terms in adopting application context. The local wrapper skips only that package-publication check; no structural, governance or work-item check is removed. `--examples` reports absence rather than requiring synthetic examples. The official upstream validator itself is preserved and hashed in `.csd-source.json`.
