# AI Governance Context

The normative baseline is `.context/policies/core/ai-governance.md`.

- Current harness: OpenCode; parent conversation model observed as `openai/gpt-6.1-sol`. No child/sub-models are declared or invented; only already-existing accounts are used. No new provider, model or account was created.
- Approved tools: `OpenCode` (current) and `OmO` (approved by the user, not installed and not yet verified in this repository). `Codex` remains declared from onboarding but is not the current harness.
- Data classification: `internal` (approved by yanpenalva, "Autorizar conteúdo interno", 2026-10-03 UTC / 2026-10-02 local America/Sao_Paulo; recorded in the API FEAT-6 approval addendum and mirrored here). Scope: minimized sharing of code and documentation of the two Starter Kit repositories with the current harness models/subagents only. Always excluded: `.env`, secrets, credentials, personal data and dumps. No new retention guarantee is claimed.
- Human approval is required for material decisions, risk acceptance, policy exceptions and production operations. The agent cannot infer production approval from Git delivery authorization.
- Git delivery authority mirrors the roadmap authorization (FEAT-6 approval, 2026-10-02, both repositories) formalized by EXC-0001 in `.context/exceptions/EXC-0001.json`: automatic commit/push after validation and conditional human-authorized merges inside the two roadmap repositories until 2026-12-31 or earlier completion/revocation. Outside that scope the `confirm_each` core default applies. No force push, no administrative bypass, no forged GitHub approving review; the author never approves their own PR.
- No secrets, credentials or personal data in context/evidence.
- Execute in the current repository. The original `starter-kit-laravue` is read-only reference; never modify it or the CSD source checkout.
- Organizational security owner, release approver and reporting channel: `NOT FOUND`.
