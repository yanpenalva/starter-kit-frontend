# Plan — FEAT-13 user and role forms integration

## Approved approach

Merge the fetched origin/main commit into the current integration branch. Inspect conflicts and both-parent changes, retain compatible behavior, and update only code or tests needed to match the final UI. Use the existing dependency tree without installing packages.

## Execution order

1. Independent preflight review checks the request, scope, branch/remote authorization, risk classification, and plan.
2. Incorporate the latest origin feature ref if it advances during work, then merge origin/main and inspect each conflict and affected test against both parents.
3. Repair only integration regressions and update tests where the final UI differs from the feature branch.
4. Run the requested frontend gates and required CSD checks; record exact commands, statuses, and limitations.
5. Independent quality review and the required security/privacy review check the final diff and verification evidence.
6. Commit and push the validated result to the existing remote feature branch.

## Subtasks and waves

| Subtask | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| A | quality-engineer — preflight | none | Independent READY review recorded in preflight.md | 1 | core, project, security, testing |
| B | senior-software-engineer — merge and repair | A | Merge includes origin/main; both-parent review and final UI tests pass | 2 | architecture, security, testing |
| C | quality-engineer + security-privacy-reviewer — verify and review | B | Frontend gates, CSD checks, independent quality review, and required security/privacy review recorded | 3 | security, testing |
| D | senior-software-engineer — Git delivery | C | Conventional Commit pushed to recorded origin feature ref; no PR action | 4 | core, project |

Progress: A, B, C, and D are complete. The merge commit was pushed to the recorded feature ref; work-item closure remains with the owner.

## Validation

- Frontend: npm run typecheck; npm run lint; npm run format:check; npm test; npm run build.
- CSD: python3 scripts/validate_context.py --strict; python3 scripts/validate_context.py --strict --examples; python3 -m unittest discover -s tests -v; npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project.
- Do not install dependencies. If the pinned doctor command is not already available, record that limitation and use the local strict validators without fetching a package.
- Confirm node_modules is not staged and the final push target is the recorded remote feature ref.

## Risks and rollback

- Risk: merge changes may affect user PII visibility, permission assignment, or admin-role protection across multiple pages. An always-on beforeunload listener can also keep clean forms out of browser back/forward cache.
- Mitigation: preserve permission contracts, attach beforeunload only while a form is dirty, test dirty/clean/unmount listener behavior, inspect both parents, retain/update targeted tests, run full requested gates, and obtain independent quality and security review.
- Rollback: revert the delivery commit on the feature branch; no production operation or data migration is in scope.

## Delivery scope

- Local branch: feat/fe-layout-w4-forms-merge.
- Remote: origin.
- Push target: feat/fe-layout-w4-forms.
- PR target: main; PR opening belongs to the orchestrator.
- EXC-0001 applies to commit and push within this recorded roadmap scope.
