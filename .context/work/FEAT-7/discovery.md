# Product Discovery — FEAT-7 typed HTTP client phase A (Issue #7)

## Problem

- User/operator: every future authenticated journey (auth wave 3, users, roles, logs) consumes the central transport.
- Situation: GitHub Issue #7 (https://github.com/yanpenalva/starter-kit-frontend/issues/7) requires one central HTTP client with configurable baseURL, timeouts, withCredentials, withXSRFToken and the `/sanctum/csrf-cookie` bootstrap; wave 3 owns credential provision. The lane executes transport phase A only.
- Pain or opportunity: without the transport foundation each feature would invent axios wiring, untyped errors and ad-hoc CSRF handling.

## Evidence

- At original Phase A discovery, sibling API `.context/project/api.md` and `openapi.yaml` were manually reviewed preimplementation drafts, not generated runtime artifacts from Scramble; Stage B was then deferred. Parent later authorized the exact published artifact in `orval-stage-b.md`. No draft is used as runtime input; contract-dependent endpoints and DTOs were outside Phase A scope.
- Stack facts: axios 1.20.0 pinned (registry verified), Node 24.15/npm 12.2.0 toolchain per FEAT-5/6 precedent, MSW 3 configured with a fail-on-unhandled-frame server hook.
- Confidence: high on transport constraints; contract-dependent parts are explicitly deferred.

## Hypothesis

If we `implement the central axios instance, CSRF bootstrap coordinator and typed discriminated errors as a tested module`, then `all later feature/query lanes` will `share one secure transport without duplicating auth wiring` because `credentials, CSRF ordering and error semantics are owned once in `src/lib/http` with real request-level tests`.

## Success

- Primary metric: all transport tests green with real MSW request assertions (ordering, header mirroring, dedup, typed mappings); full gate set passes on the pinned toolchain; observation: review gates and later wave adoption.

## Constraints and alternatives

- Constraints: transport only — no routes, pages, UI, design, stores, query composables or router changes; no Bearer/PAT/localStorage tokens; no speculative Profile/Login DTOs; no Orval install/generation; no axios global-default mutation; no PII/credentials in errors or logs.
- Alternatives: per-feature clients (rejected: duplication, insecure variance); starting typed generation now (rejected: API #11 artifact does not exist; fail-closed sync would have nothing to consume); blind 419 retry (rejected: security — token mismatch may mean session rotation).
- Why now: wave 3 opens the credential lane; auth journeys (FEAT-2 successors) block on this foundation.

## Stage B continuation (authorized 2026-10-05)

The earlier discovery accurately records Phase A's then-deferred generator and draft-contract exclusions. Parent later authorized Stage B only against the API `main` publication and exact receipt recorded in `orval-stage-b.md`. This continuation adds a pinned offline consumer and generated client; no handwritten endpoint DTOs or API-fetch credentials are introduced.
