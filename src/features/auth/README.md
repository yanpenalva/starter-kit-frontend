# Auth feature

Wave A implementation of session and authentication:

- In-memory Pinia session store (`stores/session.ts`) without credential persistence.
- Automatic session cleanup on 401 (unauthorized) and 419 (CSRF mismatch) responses without replaying mutations.
- Authentication operations: login (`POST /api/v1/login`), session reload/bootstrap (`GET /api/v1/auth/my-profile`), logout (`POST /api/v1/logout`).
- Navigation guards and role/permission authorization (`composables/useAuthorization.ts`).
- Pages: `LoginPage.vue`, `DashboardPage.vue`, `LimitedPage.vue`, `ForbiddenPage.vue`, `NotFoundPage.vue`.
