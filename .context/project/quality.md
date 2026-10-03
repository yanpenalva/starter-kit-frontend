# Quality Configuration

Normative baseline: `.context/policies/core/code-quality.md`. Governance mode is `starter`: initial application checks are configured by the scaffold; measured coverage/complexity thresholds remain `NOT FOUND`. Context validation remains mandatory.

Executed/required CSD checks:

```sh
python3 scripts/validate_context.py --strict
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests -v
npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project
```

The unmodified official validator is in `scripts/vendor/csd/validate_context.py`; source commit and SHA-256 are recorded in `.csd-source.json`. The local entrypoint disables only the public-kit neutrality scan (which rejects Laravel/Vue application context). `--examples` validates a suite if present, otherwise reports its absence; real work-item validation always runs. No example suite is installed and onboarding creates no work item.

All other upstream structural, schema/config, link, placeholder, classification, governance, approval and active-work-item checks remain enabled. Thin reference adapters required by upstream validation are present; only Codex is activated by the project installer.

Frontend commands now configured by FEAT-5: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; exact package versions are pinned by `package-lock.json`. `npm run smoke:browser` requires local Vite dev server plus Chrome; it checks public route and a dev-only layout harness without adding production routes. This is a local browser gate, not part of remote CI. Coverage/complexity/duplication thresholds and quality owner: `NOT FOUND`; no measured threshold is claimed. Execution results are recorded in `.context/work/FEAT-5/verification.md` and FEAT-6 verification. API intends Pest/Pint/Larastan.
