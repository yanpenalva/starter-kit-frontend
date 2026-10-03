# Plan — FEAT-18 frontend test foundation

- State: planned; harness not implemented or passing yet.
- FEAT-5 slice: Vitest + Vue Test Utils with DOM environment and genuine tests for app/provider/router/public-placeholder foundation. Prepare MSW dependency/config boundary for future contract-shaped synthetic journey tests; no fabricated DTOs or API interactions now.
- Require deterministic tests, no sensitive storage, `npm ci` and passing tests on pinned Node 24/npm 12.2. Real-API Playwright journey remains deferred to wave 3.
- Depends on FEAT-5; test commands and results must be recorded during execution.
