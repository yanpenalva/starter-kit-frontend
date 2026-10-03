# Product Discovery — FEAT-2 journey first slice (Issue #2)

## Problem

- User/operator: a first-party SPA user needing to sign in and see their session state.
- Situation: roadmap board has SPA #2 in progress; the API contract for login/profile/logout is current (API #13 contract accepted; runtime auth is planned wave 3), and the accepted architecture (ADR 0001) defines the client boundaries.
- Pain or opportunity: without a first vertical slice, the scaffold has no user-visible proof that the stack, HTTP/CSRF handling and server-state pattern work together.

## Evidence

- Issue #2 (board In progress); ADR 0001 decisions 6/9/11; canonical API contract: login 204, profile 200 with `email_verified_at` (null = authenticated-limited, roles/permissions empty, business denied), disabled account 403 never reactivated, logout 204; FEAT-5 scaffold and FEAT-6 layouts planned in this same wave.
- Confidence: high on contract shape and client behavior; the API auth runtime itself is not implemented yet (wave 3), so this slice plans against the contract, not a live backend.

## Hypothesis

If we `deliver the login → profile → logout → reload journey against the current contract on the accepted stack`, then `yanpenalva` will `have the first verifiable SPA slice and a stable pattern for every later feature` because `transport, server state and limited-session UX follow the already-accepted ADR decisions`.

## Success

- Primary metric: journey slice implemented and verified with synthetic-transport tests plus acceptance review; baseline: no application exists; target: working slice on the FEAT-5 scaffold; observation: pre-integration review (no production window; NOT FOUND).

## Constraints and alternatives

- Constraints: current contract only — no invented verification/registration routes, no typed DTO generation (SPA #7, post API #11), no real-auth runtime claims (wave 3), no sensitive client storage; single implementation owner (designer) after preflight.
- Alternatives: waiting for API #13 runtime (rejected: slice against the stable contract unblocks the pattern now); building full auth (rejected: wave 3 scope).
- Why now: board wave 1 has SPA #2 in progress right after FEAT-5 scaffold planning.
