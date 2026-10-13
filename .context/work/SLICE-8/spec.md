# Specification — SLICE-8 Conta self-service

## Request

- Source: user request in this conversation, 2026-10-13.
- Requester: repository owner.
- Date: 2026-10-13.

## Objective

Let an authenticated account holder view their own profile, update their name, and change their password with confirmation.

## Scope

- Turn the existing profile page into the Minha Conta page and add its authenticated route for verified sessions.
- Send name updates with `PATCH /api/v1/auth/my-profile` and refresh the session profile from the response.
- Send password updates with `PUT /api/v1/auth/password`, including current password, new password, and confirmation.
- Reuse shared feedback and field-error primitives, including retry for retryable failures.
- Add deterministic Vitest/MSW coverage for success, 422 validation, retry and route protection.
- Keep the generated Orval snapshot unchanged because the approved frontend artifact does not contain these operations and upstream artifact download is unavailable.

## Out of scope

- Backend/API changes, email changes, account deletion, role or permission management, new UI primitives, a demo route, contract pin changes, PR creation, merge, deployment and release.

## Evidence and context

- Repository evidence: current `ProfilePage.vue` is read-only; auth session holds `MyProfileResource`; the shared form feedback and central Axios mutator already exist.
- Product evidence: user request.
- Project context: Vue 3/TypeScript, Vue Router descriptors, Pinia auth session, MSW/Vitest, API calls through the central HTTP transport.
- Unknowns (`NOT FOUND`): linked frontend GitHub issue; production adoption metric; password policy details beyond the API contract.

## Rules and contracts

- Profile request body: `{ name }`; success returns `{ data: MyProfileResource }`.
- Password request body: `{ current_password, password, password_confirmation }`; success returns a message.
- API validation errors are normalized to `HttpError` and displayed through shared feedback and field errors.
- Never persist or log passwords; use the central transport for CSRF/session behavior.
- User-facing messages are in pt-BR; internal names are in en-US.

## Tests and acceptance criteria

1. The account route is named and protected with `requiresAuth`; limited sessions remain on the limited-account route.
2. The page displays the current user's name and email, and a successful name save updates the session profile.
3. Password change submits current/new/confirmation fields and clears password inputs after success.
4. 422 responses display errors on the corresponding fields; retryable server/network failures expose the shared retry action and replay the submitted payload.
5. MSW tests cover request methods, paths and bodies without real network access.
6. `typecheck`, `lint`, `format:check`, touched Vitest files, `client:check` and `build` pass.

## Recorded decisions

- Generated-client snapshot lacks these operations; use typed operations through the existing central `transportApi` and leave the pinned generated snapshot unchanged.
- Limited sessions do not receive profile-edit or password-change access because the project contract restricts them to verification, logout and minimal profile access.
- GitHub issue linkage: NOT FOUND. The source user request remains explicit authorization for this bounded implementation and Git finalization.
