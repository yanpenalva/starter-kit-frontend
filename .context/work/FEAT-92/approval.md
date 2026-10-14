# Integration authorization — FEAT-92

The requesting user explicitly instructed the orchestrator on 2026-10-13 to open a PR for `feat/ux-batch2-polish` against `main`, wait for green checks, run `merge --merge --delete-branch`, verify origin/main, update the local main checkout and delete the local branch. Builders/fixers may commit and push the feature branch but may not create PRs or merge.

This is the current concrete integration authority and supersedes the earlier builder-only restrictions. The canonical standing EXC-0001 remains in force for this repository and recorded scope. Independent review and green checks remain conditions, with no fake GitHub approval, force push or administrative bypass. Production deployment remains outside scope.
