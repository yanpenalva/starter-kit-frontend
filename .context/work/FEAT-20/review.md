# Review — FEAT-20 W2 frontend integration

## Author self-check

- The FE pin and receipt bind to the successful current-main API artifact; the client was generated only through `scripts/generate-client.mjs`.
- Generated methods were compared against the pinned OpenAPI routes and HTTP verbs: 36 of 36 match, with no absent or additional transport.
- Audit search passes the debounced term and active filters to the API. MSW uses the same actor-name/event/description/action matching and fixtures cover a user with multiple roles.
- `logs.view` and `roles.view` are checked before their respective requests. Role assignment still depends on `users.assign-roles`; empty lists are blocked and 403/422 feedback stays in the role block. Selected chips render independently of catalog loading and failure.
- Creation submits no `roles`; role assignment remains a later PUT from edit, with a clear instruction in the create dialog.
- Focused and full tests plus all requested frontend gates passed. No browser check was run.

## Review limits and findings

- Independent reviewer: NOT FOUND in the available single-agent execution context. This author self-check is not independent review or GitHub approval.
- The generated file banner still says “Orval 8.39.0” while the lockfile and executed generator are 8.40.0. This banner predates the API changes and was left untouched so the generated diff stays limited to contract-derived output; it is a stale metadata comment, not an extra API operation.
- No other generated transport or contract mismatch was found.
