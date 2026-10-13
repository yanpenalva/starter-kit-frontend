# Product Discovery — FEAT-20 W2 frontend integration

## Problem

- User/operator: administrators and delegated operators who review audit events and assign multiple roles.
- Situation: the FE audit search still reflects an older API contract; role assignment can query a catalog without `roles.view`, does not provide a catalog retry path, and can submit an empty role list. The mock also invents a default role during user creation.
- Evidence: the user supplied the W2 acceptance criteria. API `main` at `ec14bab9a24fe2641bb41b927f40365cf8a12af2` implements activity search over actor name, event/description, and action; it publishes a successful OpenAPI run and artifact. Local FE callers and handlers were inspected.
- Confidence and gaps: high. No separate open follow-up issue was found in the repository issue list; prior audit issue #14 is closed and is background only.

## Hypothesis

If the FE consumes the verified current API snapshot, sends debounced audit search with its other filters, and treats role catalog access separately from role assignment, then operators can review matching events and safely assign the roles they are authorized to assign.

## Success

- MSW and UI tests prove debounced server-side search combines with action/event filters and follows API semantics.
- Role assignment tests prove empty lists do not reach PUT, 403/422 feedback stays in the role block, catalog failures can retry, and a non-admin with `roles.view` plus `users.assign-roles` can assign roles.
- Creation tests prove POST omits roles and the form explains assignment as a later edit.
- Current API OpenAPI snapshot verifies offline and generated client output has no drift.
- Baseline and target: NOT FOUND; acceptance is measured by the requested tests and quality gates.

## Constraints and alternatives

- Constraints: no browser; no API source edits; generated code remains generator-owned; no roles in user-creation POST.
- Alternatives considered: pinning the last published but stale artifact was rejected because current API `main` includes a real audit-search contract change. The authorized response was to dispatch the producer workflow on current `main` and consume its verified artifact.
- Why now: the user explicitly resumed W2 and authorized consuming the complete current snapshot, committing, and pushing the named branch.
