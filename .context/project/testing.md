# Testing Context

- Automated application tests run from the first scaffold; Vitest suites cover stores, pages, router guards and the HTTP transport.
- Frontend runner: Vitest with v8 coverage thresholds enforced in CI (`npm run test:coverage`).
- Isolated test database backend-side (pgsql ephemeral in CI); frontend mocks the API over MSW.
- Never run tests against production or shared data.
- CI runs lint, typecheck, coverage-gated tests and build on every PR.
