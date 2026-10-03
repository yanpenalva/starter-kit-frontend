# starter-kit-frontend

Greenfield Vue/Quasar SPA for the Starter Kit ecosystem. The initial scaffold and public foundation page are implemented; authentication, API client and administrative features remain later-wave work.
Known stack and pending decisions: [.context/project/stack.md](.context/project/stack.md) and [.context/project/architecture.md](.context/project/architecture.md).

## Application development

Use Node.js 24 LTS (at least 24.15.0) and npm 12.2.0. The repository enforces the toolchain and committed lockfile; use an isolated Node 24 environment when the host differs, rather than changing shared host configuration.

```sh
npm ci
npm run dev
```

Application checks:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run preview` serves the production build. The combined public/auth-layout browser smoke uses the Vite development server (`npm run dev`, default port 5173), because its synthetic auth-layout harness is deliberately excluded from production. Run `npm run smoke:browser` with Chrome; `BROWSER_SMOKE_URL` can select another development origin. Layout polling fails after ten seconds instead of hanging on an unreachable harness. Setup and observed runs are recorded in `.context/work/FEAT-5/verification.md` and `FEAT-6/verification.md`. This is a local browser gate, not a claim of remote CI execution. CI runs application checks on PRs targeting main and pushes to main. Fonts/icons are bundled locally; no Google Fonts request is needed at runtime. No tokens or profile snapshots are persisted by this scaffold.

## Agent onboarding

Read [AGENTS.md](AGENTS.md), invoke `$csd` in Codex, and describe the intended outcome. Context is canonical under `.context/`.
Project onboarding follows `.context/prompts/initialize-project.md` and creates no work item. Unknown facts are `NOT FOUND`; revisit context after ADRs and scaffold.

Prerequisites for CSD tooling: Node.js >=22, npm and Python 3. Install and inspect the fixed version in this repository:

```sh
npx @owlcodium/context-spec-develop@1.2.1 install --scope project --agents codex
npx @owlcodium/context-spec-develop@1.2.1 discover --root .
npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project
python3 scripts/validate_context.py --strict
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests -v
```

The committed context is the reproducible project snapshot. Installation restores harness activation; it does not overwrite project facts.
For a new adopting repository, review `bootstrap --root . --dry-run` before `bootstrap --root . --yes`, then run onboarding. Module scaffold is generic and already approved here.
Version is recorded in `.agents/.csd-lock.json` and `.context/config.json`; `.csd-bootstrap.json` records bootstrap ownership hashes.

## Kit packaging and validation

The npm 1.2.1 bootstrap omits workflows, reference adapters and the validator required by its own contract. Only these prerequisites and the kit license were supplemented from official tag `v1.2.1`, commit `6ca620e0491e94e0836bda29cd55b334b4f12aec`.
Provenance and hashes: [.csd-source.json](.csd-source.json). No local CSD checkout was used.
The upstream validator remains byte-for-byte preserved; [quality context](.context/project/quality.md) documents the two consuming-project adaptations and regression checks. `LICENSE` covers the CSD material; application licensing is `NOT FOUND`.

## Reviewed upgrades

Check npm release/version and official documentation, then review an upgrade PR. Preview before applying:

```sh
npx @owlcodium/context-spec-develop@1.2.1 update --scope project --dry-run
npx @owlcodium/context-spec-develop@1.2.1 update --scope project --context --dry-run
```

For an approved newer version, replace the explicit version in those commands, review diffs, then apply harness update and context update (`--context --yes`) separately. Never use `--force` to bypass local conflicts. Project facts, modules and work items remain project-owned. Review the shortened AGENTS entrypoint/orchestration changes as intentional conflicts; verify supplementary files and validator against the same immutable release before updating their hashes. Run all validation again.

## Issues and delivery

Onboarding: https://github.com/yanpenalva/starter-kit-frontend/issues/4. No artificial CSD work item represents initialization.
Future tasks follow [issue/work-item/PR conventions](.context/project/conventions.md) and [delivery authorization](.context/project/delivery.md).
Actual onboarding evidence and unresolved decisions: [.context/project/onboarding.md](.context/project/onboarding.md).
