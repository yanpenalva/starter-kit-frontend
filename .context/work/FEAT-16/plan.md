# Plan — FEAT-16 frontend CI

- State: planned; workflow not implemented or passing yet.
- Initial required PR-to-main workflow: pinned GitHub Actions, Node 24, npm 12.2.0, `npm ci`, formatting check, lint, strict typecheck, tests and production build. Use lockfile cache keyed by lockfile; least permissions; no secrets or deploy steps.
- Depends on FEAT-5 quality scripts. Validate workflow syntax and run equivalent local commands; report actual CI only after a PR check runs. This plan is not execution approval.
