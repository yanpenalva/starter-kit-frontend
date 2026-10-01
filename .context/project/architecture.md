# Architecture Context

- Independent SPA using Vue 3, TypeScript and Quasar; independent deployment and versioning.
- Consume the independent REST API under `/api/v1`.
- First-party SPA authentication uses cookies, session and CSRF through Sanctum; no authentication implementation exists yet.
- Generate TypeScript types from backend OpenAPI contracts. Generator and detailed contracts: `NOT FOUND`.
- Rendering mode, router conventions, state management, HTTP client, component structure and screen requirements: `NOT FOUND`; resolve through frontend Issue #1 and scaffold.

Business domains/module boundaries, hosting, production URLs and detailed API contracts: `NOT FOUND`. The module scaffold is documentary and defines no domains. Revisit context after ADRs and the first application scaffold.
