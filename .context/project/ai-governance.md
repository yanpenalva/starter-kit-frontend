# AI Governance Context

The normative baseline is `.context/policies/core/ai-governance.md`.

- Harness and tools: `OpenCode`, `Oh My OpenCode` and `Codex` are the approved tools, as recorded in `.context/config.json` (`ai.approved_tools`). No child/sub-model is declared or invented; only already-existing accounts are used, and no new provider, model or account is created.
- Data classification: `internal`. Scope: minimized sharing of code and documentation of the Starter Kit repositories with the approved harness models/subagents only. Always excluded: `.env`, secrets, credentials, personal data and dumps. No new retention guarantee is claimed.
- Human approval is required for material decisions, risk acceptance, policy exceptions and production operations. The agent cannot infer production approval from Git delivery authorization.
- Git delivery authority is formalized by EXC-0001 in `.context/exceptions/EXC-0001.json`: automatic commit/push after validation and conditional human-authorized merges inside the two roadmap repositories until the exception expires or is revoked. Outside that scope the `confirm_each` core default applies. No force push, no administrative bypass, no forged GitHub approving review; the author never approves their own PR.
- No secrets, credentials or personal data in context/evidence.
- Execute in the current repository. The original `starter-kit-laravue` is read-only reference; never modify it or the CSD source checkout.
- Organizational security owner, release approver and reporting channel: `NOT FOUND`.
