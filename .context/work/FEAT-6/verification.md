# Verification — FEAT-6 tokens and layouts

## Implemented scope

- Added shared semantic tokens and documented their ownership. Public landing now uses `PublicLayout`; its existing palette, DM typography, spacing, and composition remain intact.
- Added slot-based `AuthLayout` with presentation props only. No route, session, form, profile, API model, permission rule, or storage behavior added.
- Added synthetic layout component tests and a dev-only Vite HTML harness for real browser CSS checks; harness is not a router entry or production build page.

## Checks

- Toolchain: Node `v24.15.0`, npm `12.2.0`, container `node:24.15.0-bookworm`; `npm ci` PASS (328 packages; 0 audit findings; no unreviewed install scripts).
- `npm run format:check` — PASS.
- `npm run lint` — PASS.
- `npm run typecheck` — PASS (`vue-tsc --noEmit`, strict).
- `npm test` — PASS (5 files, 5 tests; includes synthetic public/auth layout slots).
- `npm run build` — PASS (Vite 8.3.2; 118 modules).
- Browser: `node scripts/smoke-browser.mjs` against local Vite dev server in headless Chrome 154 — PASS. At 1280×900, public grid 2 columns and auth panel 570px; at 390×844, public card 342px and auth layout single column/panel 356px. Both skip links and public CTA receive visible keyboard focus. Local DM font faces and both Material icon glyphs resolve; no external requests observed. Tailwind prefixed utilities and Quasar component/icon CSS remain active; Preflight remains absent.
- `python3 scripts/validate_context.py --strict` — PASS; `--strict --examples` — PASS with expected no-example-suite notice; adapter unittest suite — PASS (6 tests); CSD doctor — healthy; `git diff --check` — PASS.

## Limits and review

- Auth layout tested with synthetic presentation content only. No auth route or real API journey exists. No production API E2E claim.
- FEAT-6 status is `verify`; independent cavecrew review PASS is recorded in review.md. Remote PR checks and integration remain separate gates. FEAT-3/16/18 retain their prior open/planned states.
- Orchestrator's smoke-only follow-up: default origin changed to Vite dev port 5173 and layout polling bounded to ten seconds. `node --check`, Prettier check and ESLint passed after the edit; formatting/lint ran in Node 24.15 containers. This does not claim another browser execution or change production layout behavior.
