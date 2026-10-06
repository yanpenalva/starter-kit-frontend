# FEAT-7 Stage B — Orval typed client and approved contract consumer

## Ownership and delivery

- Owning work item: FEAT-7, Issue [#7](https://github.com/yanpenalva/starter-kit-frontend/issues/7).
- Scope: this frontend writer worktree only; branch `feat/wave-3-http-client`, target `main`, remote `origin`, PR [#26](https://github.com/yanpenalva/starter-kit-frontend/pull/26), base observed at `f59ba30d3c035059a08f73ee22e43233ab484f7f`.
- CSD classification: Product / feature; medium complexity/risk; module impact; security relevant; high confidence; standard routing. `policy_exceptions` retains EXC-0001.
- Parent authorized this continuation and exact source policy in the task prompt. The API bundle does not grant its own policy.
- Human review remains pending. This candidate does not complete Wave 3; auth state, visual UI and real-API/browser E2E remain later work.

## Corrective capsule review of source 928db51

- Independent fresh LUNA capsule verdict for source `928db516ac159368bb7f5640c687785ce5b0b814`: FAIL with 1 P1 receipt identity forgery, 2 P2 mutator baseURL and Retry-After weekday errors, and 1 INFO CI job-id collision.
- Corrective scope is exactly those findings. Tests capture old behavior before fixes; this producer's local gates do not constitute an independent review PASS.
- Earlier Phase A PASS on `e080911` remains historical and does not apply to source 928 or the corrective candidate. Parent/peer review remains pending.

## Corrective local verification

- Receipt pinning now uses recursive strict JSON type equality and checks all required source/workflow/run/artifact identity fields before delegating to the unchanged vendored CLI. Real receipt and bundle positive control passes; forged ID, omitted field, bool/float/string schema/ID and duplicate-key negatives reject.
- Mutator checks own `baseURL` in config and options independently before any Axios call. All 10 invalid categories in each layer reject with safe normalized `HttpError` and zero synthetic adapter calls; absent and exact-root values pass.
- Retry-After IMF date now validates weekday against UTC day. Fixed date mapping and expired-date behavior are covered; existing correct Sunday/Tuesday leap-day fixtures and impossible-date/time bounds remain intact.
- The new workflow job id is `verify-contract-client`, distinct from legacy `verify`; legacy workflow content is untouched.
- Full corrective gate evidence, old-vs-fixed outcomes and hashes are in `verification.md`. Candidate remains awaiting independent parent/peer review.

## Approved source pin

| Field | Pinned value |
| --- | --- |
| Repository | `yanpenalva/starter-kit-api` |
| API main commit | `e646c34a280b851847676af290494e872edcaa9b` |
| Workflow | `OpenAPI Contract`, `.github/workflows/openapi.yml`, ID `374937885` |
| Event | `workflow_dispatch` |
| Run / attempt | `37255680565` / `1`, parent-authorized `SUCCESS` |
| Artifact | ID `11321734331`, `openapi-e646c34a280b851847676af290494e872edcaa9b` |
| ZIP | 2,044 bytes, SHA-256 `0d019b1adfc1d9d3f3fb65f0544d15fcc0d51a7361e23508204c8e2a5646a6fe` |
| OpenAPI JSON | 21,323 bytes, SHA-256 `ed772d267e56784b9a847743575a242b049697ffe35369c541913903c0b24914` |

Policy pin is repeated in `openapi/contract-pin.json` and in the verifier's exact expected record. Receipt is retained byte-for-byte. The source JSON matched the hash supplied by parent and its main blob. ZIP has only root member `openapi.json`; ZIP CRC check passed; safe extraction, duplicate-key parse, local-ref policy, exact receipt identity and JSON/archive digests passed before repository import.

The receipt includes extra `workflow_state: "active"`; this is not a required provenance field and is not treated as the Actions run conclusion. Parent's explicit run status/attempt is captured in the separately pinned manifest. Frontend CI is offline and does not call GitHub; the upstream provenance checker validates required receipt identity/digest fields in `verify-committed` mode.

## Vendored verifier provenance

- Read-only source copies: staged files under `/tmp/opencode/luna-frontend-generation/api-verifier-source/`.
- Upstream worktree provenance: `starter-kit-api-wave3-auth-worktree`, branch `docs/wave-3-contract-published`, HEAD `4dbec425acc18d8843a0fde08e7aacb767312f05`; API application source corresponds to approved main `e646c34a280b851847676af290494e872edcaa9b`.
- Copied byte-identically: `contract_cli.py`, `contract_core.py`, `contract_extract.py`; full `SHA256SUMS.upstream` accompanies files. Copied hashes are respectively `f5d201decb9f56d7e9420f4f8b76947878a19506cae7b1e35129b6957d04dcb3`, `f0d7782fb97533593dc426be4d1fca4e40895f6533921ba08373241f371881cc`, and `2b794c289ef421212b3321b9464f52956ff179f6b9f1e00ce25b9db618cfe6f8`.
- `contract_fetch.py` was inspected from staged source but is not copied or run by consumer CI. No receipt command is evaluated as shell.
- Offline helper layers exact manifest equality, 64 KiB receipt and contract policy, 10 MiB archive limit, safe ZIP handling (traversal, symlinks, duplicate/unexpected entries, compression and stream bounds), strict duplicate-key JSON, local-only `$ref`, ZIP digest, extracted/spec equality and canonical committed receipt verification.
- `verify-committed` intentionally skips age expiration for durable snapshots; download refresh policy remains 90 days and 300 seconds clock skew. Frontend has no cross-repository token, fetch path, PAT or credential.

## Orval API and output

- Dependency: `orval` exact `8.39.0`, confirmed by installed tree and lock integrity `sha512-QHMA1sYzmUCAh5CJN3t/s+/JfphIM8JUjShi1oRhhX4YDk59nAnl/lDXMSMWprw0kFmZJs3HTnYBInLW4CafyQ==` from `https://registry.npmjs.org/orval/-/orval-8.39.0.tgz`.
- Config API checked from installed Orval and packed `8.39.0` declarations: `defineConfig`, `output.client: "vue-query"`, `httpClient: "axios"`, `mode: "tags-split"`, `schemas`, `formatter: "prettier"`, `override.mutator`, `override.header`, and `override.query.signal/version`. No unsupported header/request flags are used.
- Orval's real mutator inspection recognizes its exported generic `ErrorType` alias. The alias wraps central `HttpError`; Vue Query uses v5 and carries `AbortSignal` to Axios config. Successful 204 operations are `void`; 200 response uses generated schema envelope.
- Config input is exactly `./openapi/openapi.json`; wrapper validates input and receipt before Orval, fails closed in pt-BR when contract is absent/invalid, and never skips generation. Input URL is server root `/`; paths such as `/api/v1/...` remain unchanged. `VITE_API_URL` is the only root-origin setting.
- Generated files live under `src/lib/api/generated/` and are fully owned by Orval, including headers, schemas, endpoint operations and barrels. `formatter: "prettier"` and configured header are reproducible. No generated file was hand-edited.

## Transport and security

- Mutator delegates every request to `createHttpClient`; no new `axios.create`, global defaults or independent transport exist.
- Origin environment value passes central lexical validation and must have root pathname. The mutator captures that origin once, sets it as immutable request `baseURL`, and leaves generated URL/path untouched for existing pre-adapter origin checks.
- `/api/v1/...` resolves once against origin root; `/sanctum/csrf-cookie` resolves directly at root. Fixture Axios adapters observe resolved URLs; no real network, browser, MSW or cookie claim is made.
- `AbortSignal` is passed through Axios config. Central error mapping preserves cancellation, credentials/XSRF policy, pre-CSRF/pre-adapter fail-closed checks, zero outbound on unsafe origin, CSRF singleflight reset, 419 reset without replay, strict IMF `Retry-After`, and null-prototype field errors.
- Generated output is excluded from hand-authored CSD structural counts because output provenance and double generation enforce it. Hand-authored TypeScript, JavaScript and Python stay within function/return/parameter/file ceilings and use no `else`, `any`, non-null assertion or manual DTO.

## esbuild script audit and narrow allow

- Baseline `package.json` and baseline `package-lock.json` at starting HEAD contain no `esbuild` entry. The earlier failure was not baseline `npm ci` or HTTP/CI failure.
- Initial install under container npm `11.12.1` failed `EBADENGINE` because project requires npm `12.2.0`. After pinning npm 12.2.0, Orval's new dependency graph introduced `esbuild@0.28.2`; package-lock-only and the attempted Orval install were rejected by `strict-allow-scripts` until this newly introduced script was audited.
- Public registry identity: `esbuild@0.28.2`; tarball `https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz`; registry SRI `sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==`; registry shasum `0f43bd1bad955b72d24e2261e3abe5957ccf0816`.
- `npm pack --ignore-scripts` was used only to inspect the distribution. Computed tarball SHA-512 base64 matched registry SRI; installed lockfile has same SRI and tarball URL. Pack included `install.js`, not an executed lifecycle during audit.
- Package declares only `postinstall: node install.js`. Reviewed script selects known platform package, prefers optional `@esbuild/linux-x64@0.28.2`, validates the binary against embedded SHA-256 and version, and links/writes executable only within installed `node_modules/esbuild`. Fallback uses npm or HTTPS to fetch the exact platform package when optional binary is missing; no project source, external host path, credential or API is mutated. Normal installation resolved the pinned optional Linux binary.
- npm 12.2.0 `npm install-scripts --help` was read. An early `approve` attempt before package resolution returned `ENOMATCH`; exact audited `"esbuild@0.28.2": true` was then added manually as explicitly authorized. Existing keys remain unchanged. Subsequent official `npm install-scripts approve esbuild@0.28.2 --allow-scripts-pin` reported `Nothing to approve; allowScripts unchanged` because exact pin already existed. Normal lifecycle-enabled install succeeded. No wildcard, unversioned approval, global bypass, `--force`, or ignored lifecycle installation was used.
- Orval install audited 415 packages and npm audit reported 0 vulnerabilities. Future esbuild versions remain denied unless separately reviewed and pinned.

## Reconciliation of previous stop

- Correct record: project baseline had no esbuild. `npm ci` of baseline did not fail.
- First failed command: `npm install --save-dev --save-exact orval@8.39.0` used npm 11.12.1 and failed `EBADENGINE` against required npm 12.2.0.
- Subsequent Orval installation/lock-only attempts using npm 12.2.0 were rejected because newly resolved Orval transitives introduced `esbuild@0.28.2` with an unapproved postinstall under strict scripts.
- Existing transport and baseline CI were not broken. No transport behavior change was required to resolve install policy.

## Remaining lane boundaries

- Review this exact candidate before integration. PR remains draft and references `Refs #7`; no close/fix keyword, merge, Done or release action.
- No UI/layout/style/router/provider/auth-state changes, token/PII storage, API credentials, production calls, migration, browser E2E or real-cookie claim.
- Wave 3 continues with later state/UI/E2E ownership after this candidate review.
