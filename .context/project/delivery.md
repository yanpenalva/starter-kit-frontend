# Delivery and Deployment Context

- Each task maps to a GitHub Issue; implementation work links Issue → CSD work item → PR per `conventions.md`.
- Small PRs, Conventional Commits and real implementation/test/validation evidence are required.
- Human approval remains required for material architecture decisions, risk, production and merge. Never force push or merge automatically.
- Project Status: start `In progress`; PR ready for review `In review`; `Done` only after merge and actual completion.
- Deployment, rollback procedure, release approver, production infrastructure and CI commands: `NOT FOUND`.
- Onboarding Issue: https://github.com/yanpenalva/starter-kit-frontend/issues/4; branch: `chore/issue-4-initialize-csd`.
- User authorized this session's CSD branch, commit and branch push after validation. User explicitly declined creating a main branch or initial empty main commit. Prepare only the CSD branch; no frontend PR can target an absent main. Keep Issue In progress.
- This explicit session authorization satisfies CSD Git finalization confirmation for these actions only. Future work defaults to `confirm_each`; resolve each request’s actual authorization before Git actions.
- No application scaffold, Laravel package installation, migrations, authentication implementation, Docker Compose, frontend app implementation, source-kit edits or monolith edits belong to onboarding.
