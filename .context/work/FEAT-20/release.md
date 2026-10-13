# Release record — FEAT-20 W2 frontend integration

- Branch: `feat/fe-adj-w2-integracao`.
- Base: `41f2c854c2f182a25f07fc8b89784c1e33c7469e` (`origin/main` at task start).
- Target: `main`; remote: `origin` (`https://github.com/yanpenalva/starter-kit-frontend.git`). The feature branch did not exist on `origin` at pre-finalization check.
- Delivery mode: `automatic` under recorded `EXC-0001`; the user explicitly requested commit and `git push -u origin feat/fe-adj-w2-integracao`.
- Proposed Conventional Commit: `feat(w2): integrate current API contract and admin flows`.
- Change summary: refresh and pin the verified API contract/client; implement audit search/mock semantics and multi-role fixture; gate role catalog access, preserve selection, validate assignment and isolate assignment feedback; keep create POST role-free and explain the later assignment step; add focused tests and verification evidence.
- Validation: all requested frontend gates and mandatory project context gates pass as recorded in `verification.md`.
- No PR, issue, merge, deployment or browser check is included in the authorized task scope. The branch remains open for review after push.
- Rollback: revert the delivery commit; no production or API data is changed.
