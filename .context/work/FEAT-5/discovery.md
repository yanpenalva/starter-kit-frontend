# Product Discovery — FEAT-5 scaffold (Issue #5)

## Problem

- User/operator: every SPA feature team (auth, users, roles, logs).
- Situation: the board holds SPA #5; ADR 0001 is accepted; no application source exists.
- Pain or opportunity: without the scaffold, no feature can start; without deciding the real dependency graph once, each feature would resolve versions ad hoc.

## Evidence

- ADR 0001 (accepted 2026-10-03, PR #22): Vite 8 + `@quasar/vite-plugin` 2.0.2 (peers quasar ^2.24, plugin-vue ^6.0.5), TypeScript 6.x strict, manual router, npm 12.2.0 lock + `npm ci`, Node 24 LTS >= 24.15; compatibility matrix research (not lock-tested — the lockfile created here is the pin of record). Host env gap known: Node 26.8.2/npm 12.0.2 on the workstation vs target baseline — solved via a project-local portable toolchain (Docker/project-pinned), never a host-global change.
- Confidence: high on decisions; exact peer/lock resolution is genuinely open until install (explicitly allowed to resolve now).

## Hypothesis

If we `scaffold the accepted stack with a committed lockfile and project-local toolchain`, then `all wave-1 features` will `build on one reproducible foundation without host or version drift` because `versions resolve through peers into the lockfile and every command runs pinned`.

## Success

- Primary metric: `npm ci` + strict checks + production build green from a clean checkout on the pinned toolchain; baseline: empty repo; target: runnable scaffold with placeholder public page; observation: pre-merge gates (no production window).

## Constraints and alternatives

- Constraints: ADR/matrix choices are immutable (no reopen); real dependencies and configs only — no fake auth/CRUD; no host-global toolchain change; single implementation owner (designer) after preflight.
- Alternatives: Quasar CLI shell (rejected, ADR); deferring lockfile (rejected: pins are the point of the scaffold).
- Why now: board SPA #5 is the wave-1 blocker for SPA #2/#6 and the gates items.
