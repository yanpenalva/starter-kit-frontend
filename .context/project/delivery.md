# Delivery and Deployment Context

- Each task maps to a GitHub Issue; implementation work links Issue → CSD work item → PR per `conventions.md`.
- Small PRs, Conventional Commits and real implementation/test/validation evidence are required.
- Human approval remains required for material architecture decisions, risk, production and release authorization of record. Never force push. The author never approves their own PR.
- Project Status: start `In progress`; PR ready for review `In review`; `Done` only after merge and actual completion.
- Deployment, rollback procedure, release approver, production infrastructure and CI commands: `NOT FOUND`.
- Onboarding Issue: https://github.com/yanpenalva/starter-kit-frontend/issues/4; CSD branch: `chore/issue-4-initialize-csd`.

## Current delivery authority (mirrored, 2026-10-03)

- Roadmap authorization: yanpenalva explicitly authorized autonomous board updates, commit/push, PR opening, independent agent review and conditional automatic integration for the Starter Kit roadmap on 2026-10-02 (recorded in the API repository FEAT-6 approval; canonical at `starter-kit-api/.context/work/FEAT-6/approval.md` — plain path, sibling repository, read-only reference). This decision covers both repositories.
- Formalization: `.context/exceptions/EXC-0001.json` (mirrored verbatim from the API repository) grants reuse of the validated commit/push authorization across roadmap work items and branches and conditional execution of human-authorized merges, scoped to `yanpenalva/starter-kit-api` and `yanpenalva/starter-kit-frontend`, until 2026-12-31 or earlier roadmap completion/revocation. Core review-release clauses 11/12/14 are the deviated clauses; any scope, branch, remote or risk change invalidates routine authorization until re-approval. Every affected work item MUST reference EXC-0001 in `policy_exceptions`.
- Configuration: `orchestration/git.finalization_mode = automatic`, `pull_request.mode = automatic` with a dedicated create-only command (`rtk gh pr create ...`); no merge, force or administrative command is configured, `merge_requires_human_approval` and `human_approval_required_before_push` stay `true`, `allow_force_push` stays `false`. Work items inside the exception scope carry `git_finalization_mode: automatic`; no routine per-delivery confirmation is asked while the authorization stands (material changes still require a concrete human decision).
- No approving GitHub review may be created or implied by agents; independent agent review is delivery evidence, not a GitHub approval.
- The master roadmap lives in the API repository (`.context/project/roadmap.md`, read-only sibling reference; GitHub Issues are the durable cross-repo links). This repository keeps only local execution context and does not copy the roadmap.

## Current branch state (2026-10-03)

- Active documentation branch: `docs/issue-1-spa-architecture`, created from `main` at `4c2d5b4` after the recorded approvals, targeting `main`. Repository rulesets observed by the parent: none on `main` (GitHub admin session, yanpenalva); branch creation is safe and local history is preserved (no rewrites, no force).
- FEAT-1 scope discipline: documentation-only — no application source, package install, lockfile, CI or runtime change; roadmap wave 0 continues (scaffold stays blocked for SPA #5 until its own gates; transport implementation waits for API #6 documentation and review; wave 3 owns credential provision).
