# Verification — FEAT-5 scaffold

## Toolchain and dependency evidence

- Container: `node:24.15.0-bookworm`; Node `v24.15.0`; npm `12.2.0` invoked with `npx --yes npm@12.2.0`. Host Node/npm unchanged.
- `npm ci` via npm 12.2.0 with `strict-allow-scripts=true`: PASS; 328 packages added; audit reported 0 vulnerabilities. Exact script policy: allow `@parcel/watcher@2.6.0` and `vue-demi@0.14.10`; explicitly deny optional Darwin-only `fsevents@2.3.3` (Linux target uses watcher fallback). `npm install-scripts ls` reports no unreviewed install scripts.
- `package-lock.json` contains exact top-level pins. Compatibility matrix remains research reference, not install evidence.

## Checks

- `npm run format` — PASS.
- `npm run format:check` — PASS.
- `npm run lint` — PASS, no findings.
- `npm run typecheck` — PASS (`vue-tsc --noEmit`, strict).
- `npm test` — PASS (3 test files, 3 tests: placeholder page, router route, Query/Pinia provider setup). MSW test server is configured to fail on unhandled network frames; no production endpoint or fixture is introduced.
- `npm run build` — PASS (Vite 8.3.2 production build).
- Review correction: earlier browser check confirmed `.q-icon` display only; it did not prove icon glyph rendering. Added explicit Material Icons icon set/font and committed `npm run smoke:browser` regression that checks icon names, icon font family/load, DM font load, no external requests, computed Tailwind layout, keyboard focus, and mobile overflow. Previous display-only evidence is superseded.
- Self-host fonts: DM Sans, DM Serif Display, and Material Icons CSS/font assets bundled from npm packages; no Google Fonts URL or external runtime dependency.
- Browser smoke against production preview in Google Chrome headless (Chrome 154): PASS via `node scripts/smoke-browser.mjs` on Node 24.15. At 1280px and 390px it verifies both Material Icons names resolve through loaded font (`glyphAvailable: true`), both DM font families load, icons render at 18px, grid/stacked layout, keyboard focus outline, and zero external runtime requests. CSS source omits Preflight import.
- `python3 scripts/validate_context.py --strict` — PASS; `--strict --examples` — PASS with expected “no example suite installed” notice; `python3 -m unittest discover -s tests -v` — PASS (6 tests); `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project` — healthy.

## Scope boundaries / pending

- No auth transport, API DTO, mock endpoint, permission guard, sensitive storage or profile data.
- No `public/` directory added: this scaffold has no public assets; Vite's root `index.html` is entry point.
- At initial FEAT-5 verification time no remote CI run was claimed; subsequent PR #24 and main verification evidence is recorded in `closure.md`. FEAT-6's later independent preflight PASS and implementation evidence are recorded under FEAT-6.
- FEAT-3/16/18 plans are recorded as planned; FEAT-5 supplies initial gate/tooling slices only, not completion of those work items.
