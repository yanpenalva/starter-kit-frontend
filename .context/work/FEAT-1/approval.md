# Approval Record — FEAT-1 (actual human decisions)

All decisions below are real answers given by yanpenalva in the conversation (question tool, 2026-10-03 UTC; 2026-10-02 local America/Sao_Paulo where noted). Factual record; no approval is inferred or simulated. No GitHub approving review exists or is claimed anywhere in this item.

## 1. "Aprovar pacote SPA" — architecture package accepted (2026-10-03)

- What: the proposed ADR (now canonical `docs/adr/0001-vue-spa-architecture.md`) plus `compatibility-matrix.md`, accepted AFTER the independent preflight conditions were resolved (F1 doctor evidence, F2 limited-session semantics, F3 optional quasar peer — all applied; see `review.md` and `preflight.md`).
- Effect: the proposal draft stops being normative; it remains evidence. The accepted architecture and stack decisions are promoted into `.context/project/architecture.md` and `stack.md`.
- State: accepted decision, NOT implemented — nothing installed, no lockfile, no application source.

## 2. "Aprovar transporte" — transport/artifact approach accepted (2026-10-03)

- What: the API publishes a pinned, durable OpenAPI artifact; the frontend consumes generated types from that pinned artifact through a trusted, separate synchronization that requires no credentials in pull requests.
- Guardrails (fail closed): future frontend actions touching the artifact are read-only against the API and require matching SHA/run/hash evidence; no `latest` consumption; no widening of access. Generator choice and implementation are SPA #7 (after API #6/#11 publish and review); credential provision is wave 3 with its own authorization.

## 3. Prior related decisions by the same user (recorded 2026-10-03 UTC)

- "Aprovar exceção": EXC-0001 approved — reuse of the validated commit/push authorization across roadmap work items/branches and conditional human-authorized merges, scoped to both Starter Kit repositories, until 2026-12-31 or earlier completion/revocation; core review-release clauses 11/12/14 are the deviated clauses. Mirrored verbatim at `.context/exceptions/EXC-0001.json`; canonical record in the API repository FEAT-6 approval addendum (`.context/work/FEAT-6/approval.md` in `starter-kit-api`, read-only sibling reference).
- "Autorizar conteúdo interno": data classification `internal` — minimized code/docs sharing of both repositories with the current harness models only, excluding `.env`, secrets, credentials, PII and dumps; no new provider/model/account; no new retention guarantee.

## Standing instruction

For routine deliveries inside the EXC-0001 scope, no further per-delivery confirmation is requested (the user explicitly approved this standing authorization). Material scope, branch, remote or risk changes still invalidate routine authorization and require a concrete human decision (clause 12). Production, destructive operations, tags and forged reviews remain excluded.
