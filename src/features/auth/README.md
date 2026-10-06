# Auth feature

Wave A implementation of session and authentication:

- In-memory Pinia session store (`stores/session.ts`) without credential persistence.
- Automatic session cleanup on 401 (unauthorized) and 419 (CSRF mismatch) responses without replaying mutations.
- Authentication operations: login (`POST /api/v1/login`), session reload/bootstrap (`GET /api/v1/auth/my-profile`), logout (`POST /api/v1/logout`).
- Navigation guards and role/permission authorization (`composables/useAuthorization.ts`).
- Pages: `LoginPage.vue`, `DashboardPage.vue`, `LimitedPage.vue`, `ForbiddenPage.vue`, `NotFoundPage.vue`.

Wave C1 implementation of public identity:

- Public identity operations in `api/auth.api.ts` and `stores/session.ts`:
  - `register` (`POST /api/v1/register`): creates account without authenticating.
  - `resendVerification` (`POST /api/v1/email/verification-notification`): requests a new verification email with 429 throttle handling.
  - `forgotPassword` (`POST /api/v1/forgot-password`): anti-enumeration neutral message always.
  - `resetPassword` (`POST /api/v1/reset-password`): resets password with token and confirmation.
- Public identity pages:
  - `RegisterPage.vue` (`/register`, `guestOnly`): registration form with optional CPF validation matching backend RFB rule.
  - `VerifyEmailPage.vue` (`/verify-email`, public): handles signed 302 redirect with `?ok=1`, refreshes session, redirects to dashboard or offers resend button.
  - `ForgotPasswordPage.vue` (`/forgot-password`, `guestOnly`): anti-enumeration password recovery request.
  - `ResetPasswordPage.vue` (`/reset-password`, `guestOnly`): sets new password with confirmation.
- Extended `LimitedPage.vue` with "Reenviar e-mail" action and 429 Retry-After handling.
- Extended `LoginPage.vue` with "Criar conta" and "Esqueci a senha" links, and `registered=1` / `reset=ok` success alerts.
