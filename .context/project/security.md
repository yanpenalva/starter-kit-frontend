# Security Context

- Implemented: first-party SPA cookies, session and CSRF through Laravel Sanctum. Cross-origin cookie/CORS policy, domains, TLS and session settings: see `src/lib/http/` and the backend `config/cors.php` / `config/session.php`.
- API authorization: Spatie Permission for RBAC and Policies. Roles and permission matrix: enforced backend-side; UI authorization is experience-only.
- These controls are implemented and covered by Vitest suites plus CI gates.
- Audit: Activitylog v5 records admin events; retention and sensitive-data redaction configured backend-side.
- Secrets provider, security owner, vulnerability reporting channel, compliance requirements and operational controls: `NOT FOUND`.
- Never version secrets, credentials or sensitive data; keep test data isolated and synthetic. Follow `.context/policies/core/security-privacy.md`.
