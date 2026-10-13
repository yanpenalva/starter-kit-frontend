# Preflight — FEAT-13 user and role forms integration

## Observed state

- Local branch: feat/fe-layout-w4-forms-merge at 1d6afb10359ba0489bc0d9354d7d18e89cc1d08b.
- At initial preflight, remote feature ref origin/feat/fe-layout-w4-forms matched the local branch at 1d6afb10359ba0489bc0d9354d7d18e89cc1d08b.
- During integration, the remote feature ref advanced to e4bc8420794797f9f7135db7888777cd50f93b51 with an in-scope beforeunload guard change. This commit must be included before delivery.
- Fetched target: origin/main at f6dbcd8.
- Merge base: 0015cfdc6280631a88efe2de274328fa244b75b0.
- At initial preflight, there were seven unique commits on each side of merge base 0015cfdc6280631a88efe2de274328fa244b75b0. After incorporating the remote feature update, the feature side has eight unique commits.
- Worktree initially had only the node_modules symlink as untracked input; it must remain untracked and must not be staged.
- Delivery branch, target, and remote are recorded in plan.md before Git finalization.

## Authorization and scope check

- User explicitly authorized fetch, merge of origin/main into this branch, conflict resolution, requested frontend gates, commit, and push.
- User explicitly excluded PR creation or merging; the orchestrator opens the PR.
- No dependency installation or node_modules commit is authorized.
- EXC-0001 covers automatic commit/push for this roadmap branch and target repository.

## Risk and classification

- Product feature follow-up associated with Issues #12 and #13; neither issue state will be changed.
- Risk: high; impact: cross-module; security: sensitive; routing: extended.
- Relevant boundaries are permission-gated personal data, role assignment, and protected admin-role permissions.

## Independent preflight review

- Status: READY.
- Reviewer: independent quality-engineer.
- Result: initial review found that Subtask C did not explicitly assign the security/privacy reviewer required for sensitive work. The plan was corrected to assign both the independent quality-engineer and security-privacy-reviewer; the follow-up review passed.
- Branch, remote, target, and EXC-0001 scope were confirmed by the reviewer. A later review of the remote beforeunload change found an always-on listener could reduce bfcache eligibility for clean forms; plan.md and spec.md now require listener registration only while dirty and a lifecycle regression test. Security classification and scope are unchanged.
- The independent follow-up confirmed the mitigation and asked that pending-mutation modal dismissal be distinguished from the dirty-only native beforeunload policy. Acceptance criterion 4 now states that distinction explicitly. The composable regression test asserts no listener while clean, attachment while dirty, removal when clean, and cleanup when unmounted while dirty.

## Merge preview

- Command: git merge-tree --write-tree origin/main HEAD
- Result: exit 1, as expected for the preview; auto-merge succeeded for the remaining paths and reported content conflicts in src/features/users/pages/UsersPage.vue and src/features/users/pages/UsersPage.test.ts only.
- The preview did not modify the worktree or branch refs.
