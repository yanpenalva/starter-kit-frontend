# AI-memory Guidance

Use an AI-memory or context-compaction tool only for continuity. The repository remains the source of truth.

- Persist architecture, policy, decisions, unresolved risks, owners and handoff facts in versioned `.context/` artifacts.
- Keep transient progress local and disposable; promote durable information to the work item's handoff artifact or the approved record.
- Do not persist secrets, tokens, personal data, hidden prompts or unverified agent claims.
- On resume, reload `AGENTS.md`, `.context/INDEX.md`, project context, active work item and current gate before trusting memory.
