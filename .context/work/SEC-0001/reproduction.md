# Reproduction — SEC-0001

## Observed behavior

- Baseline `npm audit` on `package-lock.json` under Node 24.15.0 / npm 12.2.0 at HEAD `d528a9b` returns exit code 1 with 21 vulnerable package entries (17 moderate, 4 high, 0 low, 0 critical) across 22 distinct GHSA advisories in 7 package groups (`vite`, `follow-redirects`, `fast-uri`, `glob`, `minimatch`, `undici`, `zod`).

## Expected behavior

- Dependencies are updated to the latest compatible versions within supported ranges.
- Advisories with compatible updates are resolved without breaking builds, tests, or API contracts.
- Any residual vulnerabilities without upstream compatible fixes are documented with their exact dev-only dependency path and rationale.

## Steps and evidence

1. Create an isolated temporary directory under `/tmp/opencode` with a cleanup trap and extract baseline manifests from HEAD without mutating or checking out the worktree:
   ```bash
   TEMP_DIR=$(mktemp -d /tmp/opencode/audit-baseline.XXXXXX)
   trap 'rm -rf "$TEMP_DIR"' EXIT
   git show HEAD:package.json > "$TEMP_DIR/package.json"
   git show HEAD:package-lock.json > "$TEMP_DIR/package-lock.json"
   PATH=/home/hiyan/.nvm/versions/node/v24.15.0/bin:$PATH npx --yes --cache /tmp/npm-cache npm@12.2.0 audit --prefix "$TEMP_DIR"
   ```
2. Command returns exit code 1 reporting 21 vulnerable package entries (17 moderate, 4 high, 0 low, 0 critical) across 22 distinct GHSA advisories in 7 package groups.
3. The temporary directory is removed upon command completion via the shell EXIT trap, leaving the working tree untouched.

Evidence links or identifiers (never secrets or personal data):
- vite: GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv, GHSA-9jrq-w75r-8gcw, GHSA-r825-w8mm-5pxw, GHSA-rq7h-c2jc-7f22, GHSA-vfpm-58rq-9qcg
- follow-redirects: GHSA-mrwp-f3q8-3g9p
- fast-uri: GHSA-333x-w4r6-6crp, GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr, GHSA-xhq7-xmqj-769h
- glob: GHSA-3g3m-2fjr-6pw4
- minimatch: GHSA-g3hv-75wg-m249
- undici: GHSA-2m5v-pch6-74hx, GHSA-4qv8-2p9j-2685, GHSA-4w7w-5xrc-9h26, GHSA-55wc-3pg8-jfw6, GHSA-9fm3-97px-rjf6, GHSA-f72v-6w45-q472, GHSA-qrxm-fqhp-jwvm, GHSA-xjj6-f33q-929c
- zod: GHSA-mrhx-c7xc-m3w5

## Scope

- Reproducibility: Reproduced against the exact baseline commit `d528a9b13ec11900a0e891f0b9a9d15b937ae58d` and the registry advisory data available on 2026-11-20; registry results may change over time.
- Affected versions/environments: starter-kit-frontend repository at commit d528a9b.
- Suspected boundary: `package.json` exact direct pins and `package-lock.json` transitive resolution tree.
