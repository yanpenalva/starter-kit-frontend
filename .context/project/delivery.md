# Delivery and Deployment Context

- Each task maps to a GitHub Issue; implementation work links Issue → CSD work item → PR per `conventions.md`.
- Small PRs, Conventional Commits and real implementation/test/validation evidence are required.
- Human approval remains required for material architecture decisions, risk, production and release authorization of record. Never force push. The author never approves their own PR.
- Project Status: start `In progress`; PR ready for review `In review`; `Done` only after merge and actual completion.
- Deployment, rollback procedure, release approver, production infrastructure and CI commands: `NOT FOUND`.
- Onboarding Issue: https://github.com/yanpenalva/starter-kit-frontend/issues/4; CSD branch: `chore/issue-4-initialize-csd`.

## Current delivery authority (mirrored, 2026-10-03)

- Roadmap authorization: yanpenalva explicitly authorized autonomous board updates, commit/push, PR opening, independent agent review and conditional automatic integration for the Starter Kit roadmap on 2026-10-02 (recorded in the API repository FEAT-6 approval; canonical at `starter-kit-api/.context/work/FEAT-6/approval.md` — plain path, sibling repository, read-only reference). This decision covers both repositories.
- Formalization: `.context/exceptions/EXC-0001.json` grants reuse of the validated commit/push authorization for recorded delivery branches and target main across roadmap work items, and conditional execution of previously human-authorized merges, scoped to `yanpenalva/starter-kit-api` and `yanpenalva/starter-kit-frontend`, until 2026-12-31 or earlier roadmap completion/revocation. Core review-release clauses 11/12/14 are the deviated clauses. Each work item records its delivery branch, target branch and remote BEFORE Git finalization. A change outside the recorded approved delivery scope, or an unapproved scope, remote or risk change, invalidates automatic authorization until human re-approval; opening a new roadmap work item with a planned delivery branch and target `main` is not by itself an invalidation. Every affected work item MUST reference EXC-0001 in `policy_exceptions`. (2026-10-03 scope clarification: exact-string update, same exception approval, creation, expiration, owner and controls; the API repository carries the parallel mirrored change.)
- Configuration: `orchestration/git.finalization_mode = automatic`, `pull_request.mode = automatic` with a dedicated create-only command (`gh pr create --base main --title "$CSD_PR_TITLE" --body-file "$CSD_PR_BODY_FILE"`); no merge, force or administrative command is configured, `merge_requires_human_approval` and `human_approval_required_before_push` stay `true`, `allow_force_push` stays `false`. Work items inside the exception scope carry `git_finalization_mode: automatic`; no routine per-delivery confirmation is asked while the authorization stands (material changes still require a concrete human decision). `rtk` is an optional local tool wrapper permitted for convenience; plain `git`/`gh`/`npx` commands are equally valid and no wrapper is a runtime prerequisite.
- No approving GitHub review may be created or implied by agents; independent agent review is delivery evidence, not a GitHub approval.
- The master roadmap lives in the API repository (`.context/project/roadmap.md`, read-only sibling reference; GitHub Issues are the durable cross-repo links). This repository keeps only local execution context and does not copy the roadmap.

## Integration record — Issue #1 / FEAT-1 (2026-10-03)

- PR [#22](https://github.com/yanpenalva/starter-kit-frontend/pull/22) merged normally (guarded expected head `2c4f9e3dd9b8c48544e9e13bdecc68ee594b5dd2`; all applicable PR checks SUCCESS incl. GitGuardian) into `main` at `86bf3d0efa715fca1edd5105add6bd5206c1bf92` (2026-10-03T16:33:38Z); local `main` fetched and fast-forward clean.
- On the integrated SHA the parent re-ran strict context validation (passed) and the 6 adapter tests (OK). GitHub Issue [#1](https://github.com/yanpenalva/starter-kit-frontend/issues/1) is CLOSED (confirmation receipt: https://github.com/yanpenalva/starter-kit-frontend/issues/1#issuecomment-5971166151) and the board marks SPA #1 Done (8/47 items).
- CI fact: `main` has 0 configured check runs and 0 combined statuses (no frontend Actions workflows exist). Do not claim "main CI passed"; only PR-applicable checks ran on the PR head.
- The accepted architecture is documentation: the application itself remains UNIMPLEMENTED; wave 0 continues (globally blocked on the API's pending independent review). No wave 1 advancement.

## Current branch state (2026-10-03)

- Integrated: documentation branch `docs/issue-1-spa-architecture` (from `main` at `4c2d5b4`, targeting `main`) — delivered via PR #22 (record above).
- Active follow-up checkpoint branch (recorded before Git finalization, per EXC-0001): `docs/issue-1-integration-checkpoint`, created from `origin/main` at `86bf3d0efa715fca1edd5105add6bd5206c1bf92`, targeting `main`, remote `origin`. Scope: CSD docs governance/FEAT-1 checkpoint and config/exception scope clarification only. Delivery: a follow-up PR by the parent (config/EXC changes are not documentation-only routing); not yet opened.
- Repository rulesets observed by the parent: none on `main` (GitHub admin session, yanpenalva); branch creation is safe and local history is preserved (no rewrites, no force).
- Scope discipline: no application source, package install, lockfile, CI or runtime change in documentation lanes; scaffold stays blocked for SPA #5 until its own gates; transport implementation waits for API #6 documentation and review; wave 3 owns credential provision.
