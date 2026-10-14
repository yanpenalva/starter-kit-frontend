# Delivery and Deployment Context

- Each task maps to a GitHub Issue; implementation work links Issue → CSD work item → PR per `conventions.md`.
- Small PRs, Conventional Commits and real implementation/test/validation evidence are required.
- Human approval remains required for material architecture decisions, risk, production and release authorization of record. Never force push. The author never approves their own PR.
- Project Status: start `In progress`; PR ready for review `In review`; `Done` only after merge and actual completion.
- Deployment, rollback procedure, release approver, production infrastructure and production environments: `NOT FOUND`.
- Bootstrap record: `.context/project/onboarding.md` (onboarding creates no work item).

## Delivery authority

- Standing authorization: the project owner authorized autonomous board updates, commit/push, PR opening, independent agent review and conditional automatic integration for the Starter Kit roadmap; the decision covers both the API and the frontend repositories. The canonical record lives in the API repository, read-only from here.
- Formalization: `.context/exceptions/EXC-0001.json` grants reuse of the validated commit/push authorization for recorded delivery branches and target `main` across roadmap work items, and conditional execution of previously human-authorized merges, scoped to `yanpenalva/starter-kit-api` and `yanpenalva/starter-kit-frontend`, until the exception's `expires_at` or earlier roadmap completion/revocation. Core review-release clauses 11/12/14 are the deviated clauses. Each work item records its delivery branch, target branch and remote BEFORE Git finalization. A change outside the recorded approved delivery scope, or an unapproved scope, remote or risk change, invalidates automatic authorization until human re-approval; opening a new roadmap work item with a planned delivery branch and target `main` is not by itself an invalidation. Every affected work item MUST reference EXC-0001 in `policy_exceptions`.
- Configuration: `orchestration/git.finalization_mode = automatic`, `pull_request.mode = automatic` with a dedicated create-only command (`gh pr create --base main --title "$CSD_PR_TITLE" --body-file "$CSD_PR_BODY_FILE"`); no merge, force or administrative command is configured, `merge_requires_human_approval` and `human_approval_required_before_push` stay `true`, `allow_force_push` stays `false`. Work items inside the exception scope carry `git_finalization_mode: automatic`; no routine per-delivery confirmation is asked while the authorization stands (material changes still require a concrete human decision). `rtk` is an optional local tool wrapper permitted for convenience; plain `git`/`gh`/`npx` commands are equally valid and no wrapper is a runtime prerequisite.
- No approving GitHub review may be created or implied by agents; independent agent review is delivery evidence, not a GitHub approval.
- The master roadmap lives in the API repository (`.context/project/roadmap.md`, read-only sibling reference; GitHub Issues are the durable cross-repo links). This repository keeps only local execution context and does not copy the roadmap.

## Scope discipline

- No application source, package install, lockfile, CI or runtime change belongs to a documentation-only lane.
- Context and governance changes are not documentation-only routing; they are delivered through their own reviewed change.
