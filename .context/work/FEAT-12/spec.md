# Specification — FEAT-12 list query enhancements (Issue #12)

## Request

- Source: user request in this session.
- Requester: repository owner/operator, inferred from repository delivery context; exact identity not independently provided.
- Date: 2026-10-13.

## Objective

Integrate the unmerged list-query slice with the latest `origin/main`, preserve behavior from both sides, verify the final UI and its tests, then commit and push the feature branch.

## Scope

- Merge `origin/main` into local branch `feat/fe-layout-w3-lists-merge`.
- Preserve the list-query behaviors: shared page selection, Users and Roles detail modals, role permission groups, and page-level selection in the affected lists.
- Resolve any conflicts by retaining compatible behavior from both the feature branch and current main; update affected tests to match the resulting UI.
- Run the requested frontend gates and the repository-required CSD context checks.
- Commit and push to `origin/feat/fe-layout-w3-lists`; target branch for the eventual PR is `main`. The orchestrator owns PR creation.

## Out of scope

- Installing dependencies or changing the lockfile for environment setup.
- Tracking the `node_modules` symlink.
- Opening or merging a PR, changing issue/board state, or deploying.
- Unrelated refactoring or feature work.

## Evidence and context

- Repository evidence: branch `feat/fe-layout-w3-lists-merge` at `63c4b2231a78f6f6d062a8705aff2606827c2198`; target `origin/main` at `8bc2f665172eeb53fd125563657e2984ba415c2c`; merge base `3f34b34e3162f046cdcd65bfffae139e6bab56ba`; `git rev-list --left-right --count origin/main...HEAD` returned `7 6`.
- Product or incident evidence: user explicitly identified the unmerged slice and required delivery gates; no incident or production evidence applies.
- Relevant project context: Vue/TypeScript frontend, project quality commands in `.context/project/quality.md`, issue traceability and EXC-0001 in `.context/project/delivery.md`.
- Integration-time ref updates: `origin/feat/fe-layout-w3-lists` advanced to `7d7f9bc48e54268e32f97ef6f391e1c9871fee4f` with the session-cache fixture fix. During the task, `origin/main` advanced to merge commit `0015cfdc6280631a88efe2de274328fa244b75b0` (PR #78, with `7d7f9bc` as a parent). Both remote updates were fetched and integrated locally; no PR was opened or merged by this task.
- Unknowns (`NOT FOUND`): whether the eventual PR needs additional issue linkage; no PR is opened in this task.

## Rules and contracts

- Business or operational rules: page selection applies to the current page; modal/detail actions must remain distinct from selecting a row; tests must assert the final UI behavior.
- Interfaces, data and permissions: keep existing component/API contracts and permission-gated access intact; server authorization remains authoritative.
- Security and privacy impact: sensitive. User detail may display personal data (including CPF) only under existing permission controls. Do not introduce sensitive values into logs or fixtures.

## Tests and acceptance criteria

- The feature branch contains `origin/main` as an ancestor after the requested merge.
- All requested selection, detail, and permission-group functionality remains available; conflicting behavior is covered by tests matching the final UI.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` pass.
- Required CSD context validation, unit tests, and doctor checks pass.
- The result is committed and pushed to `origin/feat/fe-layout-w3-lists`; no PR is created or merged.
- No dependency installation occurs and `node_modules` is not included in the commit.

## Open decisions

- None. The user specified merge strategy, scope, gates, push, and PR ownership.
