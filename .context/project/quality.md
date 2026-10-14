# Quality Configuration

Normative baseline: `.context/policies/core/code-quality.md`. Governance mode is `starter`: application checks are configured by the repository; measured coverage thresholds are enforced and complexity/duplication thresholds remain `NOT FOUND`. Context validation remains mandatory.

Executed/required CSD checks:

```sh
python3 scripts/validate_context.py --strict
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests -v
npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project
```

The unmodified official validator is in `scripts/vendor/csd/validate_context.py`; source commit and SHA-256 are recorded in `.csd-source.json`. The local entrypoint disables only the public-kit neutrality scan (which rejects Laravel/Vue application context). `--examples` validates a suite if present, otherwise reports its absence; real work-item validation always runs. No example suite is installed and onboarding creates no work item.

All other upstream structural, schema/config, link, placeholder, classification, governance, approval and active-work-item checks remain enabled. Thin reference adapters required by upstream validation are present; only Codex is activated by the project installer.

Frontend commands: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`; exact package versions are pinned by `package-lock.json`. `npm run smoke:browser` requires a local Vite dev server plus Chrome; it checks the public route and a dev-only layout harness without adding production routes. It is a local browser gate, not part of remote CI. Coverage thresholds are enforced by Vitest v8 in `vite.config.ts` (lines 87, statements 87, functions 83, branches 80); complexity and duplication thresholds and the quality owner remain `NOT FOUND`. The API repository intends Pest/Pint/Larastan.

`npm run contract:verify` performs offline pinned provenance/schema verification; `npm run client:generate` is the fail-closed Orval wrapper; `npm run client:check` verifies offline, regenerates deterministically and diffs tracked output. Generated `src/lib/api/generated/**` is excluded from hand-authored CSD counts by provenance and remains generator-owned. CI consumes committed artifacts without API credentials.
