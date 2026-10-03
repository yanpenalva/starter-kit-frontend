# Plan — FEAT-1 SPA architecture foundation: Vue 3, Quasar, TypeScript, Tailwind (Issue #1)

## Approved approach

Smallest viable change: a documentation-only wave 0 that makes the architecture decision human-ready — discovery, specification, proposed ADR, compatibility matrix with update policy, and this plan — validated by the CSD context validator. No application source, dependency, lockfile, CI or Git action in this lane. Implementation and acceptance-driven edits belong to later authorized waves. The plan follows extended routing: alternatives, rollback and dependency analysis are recorded in `adr-proposed.md` and `compatibility-matrix.md`.

## Confirmed touchpoints

- Files/components/services:
  - Created by this wave: `.context/work/FEAT-1/work-item.json`, `discovery.md`, `spec.md`, `plan.md`, `adr-proposed.md`, `compatibility-matrix.md`.
  - Later, on human acceptance and by an authorized lane: `docs/adr/0001-*.md` (versioned ADR), pointer updates in `.context/project/architecture.md` and `.context/project/stack.md`, scaffold work item for SPA #5. Not touched in this wave.
- Interfaces and data: none at runtime. Contract references are read-only: API `api.md`, `openapi.yaml`, ADRs 0001–0003 in the API repository; GitHub Issue #1 read via API.
- Dependencies: API canonical contract (read-only); roadmap wave 0 gate; Issue #1 acceptance criteria; registry/official-doc research already recorded in the matrix.

## Execution order

1. Front door: classification, routing (extended), context manifest (done; recorded in `work-item.json`).
2. Discovery and specification from Issue #1 + canonical context (done).
3. Draft compatibility matrix from official-doc research (done; marked as research evidence, not installation).
4. Draft proposed ADR with alternatives, flow, impacts (done).
5. Validate context with the CSD validator (this wave; results below).
6. Independent review of the package (completed — see correction addendum; conditions applied).
7. Human acceptance decision by yanpenalva (completed 2026-10-03 — "Aprovar pacote SPA" and "Aprovar transporte"; recorded in `approval.md`).
8. After acceptance (this documentation wave): accepted ADR materialized at `docs/adr/0001-vue-spa-architecture.md`; integration (commit/PR) owned by the orchestrator.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-1-S1 | technical-planner lane (agent) | none | Six artifacts exist under .context/work/FEAT-1; validator exit 0 recorded in plan evidence; no source/lockfile/CI changes | 1 | core,project,architecture,security,testing |
| FEAT-1-S2 | independent oracle session ses_f00b14f02ffecUjnB5Iz5v7Epb (coordinated by orchestrator) | FEAT-1-S1 | Preflight PASS conditional on F1/F2 (F3 optional); conditions and corrections applied in the addendum below; reviewer reproduced strict validation and 6 tests | 2 | core,project,architecture,security |
| FEAT-1-S3 | yanpenalva | FEAT-1-S2 | Acceptance recorded in approval.md: "Aprovar pacote SPA" and "Aprovar transporte" on 2026-10-03; accepted ADR materialized as docs/adr/0001 | 3 | core |

Wave rule: each wave depends only on earlier waves; no parallel mutable boundaries exist (single documentation scope). Integration owner: orchestrator. Wave 1 implementation work (scaffold, lockfile, CSS smoke) is explicitly out of this item until acceptance and a new authorization.

## Test plan

Documentation-only scope; validation is context-level, per `project/quality.md`:

1. `python3 scripts/validate_context.py --strict` — must pass with the new FEAT-1 work item (schema fields, classification/routing derivation, context budget, placeholders, links).
2. `python3 scripts/validate_context.py --strict --examples` — must pass; absence of an example suite is an expected warning, not an error.
3. `python3 -m unittest discover -s tests -v` — adapter regression suite must still pass.
4. `rtk npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project` — CSD health check; required for preflight (executed by the parent, see evidence record).

Limitations (recorded honestly): no application build, lint, install, lockfile resolution or CSS smoke is run or claimed — no application exists in this lane; matrix versions are research evidence only. Exact commands, exit codes and dates are recorded under Evidence record below.

## Risks and rollback

- Risk: proposed versions drift before scaffold (new releases). Mitigation: matrix update policy item 1/5 — research is re-run at scaffold; lockfile is the pin of record. Owner: scaffold subtask.
- Risk: human rejection or amendment of the ADR package. Mitigation: acceptance section isolates the decision; rejected items are amended or recorded as follow-up issues without discarding valid evidence. Rollback: revert the documentation commit (no runtime or data effect); the review evidence stays in this item.
- Risk: Quasar/Tailwind CSS conflicts discovered only at scaffold. Mitigation: Preflight-disabled + `tw` prefix decision limits the surface; real smoke test is a mandatory Wave 1 acceptance item (SPA #5), never claimed here.
- Risk: environment mismatch (host Node 26/npm 12.0.2 vs target Node 24 LTS/npm 12.2.0). Mitigation: recorded in the matrix as a gap; scaffold must build against the target baseline and verify `npm ci`.

## Correction addendum — independent review (2026-10-03)

Independent review is completed: oracle session `ses_f00b14f02ffecUjnB5Iz5v7Epb` performed the review and preflight checks and reproduced `--strict` validation and the 6 adapter tests. Verdict: PASS conditional, with no GitHub approving-review claim (repository review remains a separate human/PR step). Findings and dispositions:

- F1 (condition): doctor evidence missing from the test/evidence tables — resolved by adding `npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project` (exit 0, CSD healthy 1.2.1, 2026-10-03) as executed by the parent on the current docs.
- F2 (condition): limited-session UX missing — resolved in `adr-proposed.md` decision 11 and the flow: profile 200 with `email_verified_at: null` (canonical API `openapi.yaml` lines 193–218) is authenticated-limited with empty roles/permissions by contract; logout/minimal profile/verification only; business denied; the limited state is never inferred from empty permissions alone; deactivation 403 stays blocked and is distinguished from 403 denied without client-side reason heuristics; no concrete verification route is fabricated (API #14 / SPA #10 own it).
- F3 (optional, applied): quasar `^2.24` peer added to the `@quasar/vite-plugin` row in `compatibility-matrix.md`.

Work-item state after this addendum (superseded 2026-10-03 by acceptance): preflight conditions resolved; the package was then accepted by yanpenalva ("Aprovar pacote SPA", "Aprovar transporte" — `approval.md`), the ADR was materialized as `docs/adr/0001-vue-spa-architecture.md`, and the work item moved to phase `verify` (status `active`, integration pending). Nothing in this addendum widens authentication scope or permits extra client-side cache persistence.

## Required approvals

- Human acceptance of the architecture package: OBTAINED — yanpenalva, 2026-10-03, "Aprovar pacote SPA" (ADR + matrix, after preflight conditions) and "Aprovar transporte" (pinned durable OpenAPI + generated types, trusted separate sync, no credential PR, read-only fail-closed future actions, credentials wave 3). Record: `approval.md`.
- Independent review before acceptance: completed — oracle session `ses_f00b14f02ffecUjnB5Iz5v7Epb`, PASS conditional (see addendum); delivery evidence, not a GitHub approving review.
- Git finalization: `automatic` under EXC-0001 (`.context/exceptions/EXC-0001.json`, scope: both Starter Kit roadmap repositories, until 2026-12-31 or earlier completion/revocation). This lane performs no Git actions; integration commit/push/PR belong to the orchestrator under that standing authorization. Outside the exception scope the core `confirm_each` default applies.

## Evidence record

For every required check, the exact command, scope, exit code, date and limitation:

| Command, scope and limitation | Result, date and executor |
| --- | --- |
| `python3 scripts/validate_context.py --strict` — whole context incl. FEAT-1; context-level only, no application checks exist | Exit 0, passed — 2026-10-03, writer lane |
| `python3 scripts/validate_context.py --strict --examples` — whole context; expected warning: no example suite installed | Exit 0, passed with warning — 2026-10-03, writer lane |
| `python3 -m unittest discover -s tests -v` — CSD adapter regressions; does not exercise application code (none exists) | Exit 0, 6 tests OK — 2026-10-03, writer lane; reproduced by oracle |
| `rtk npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project` — CSD project-scope health | Exit 0, CSD healthy 1.2.1 — 2026-10-03, parent; re-run healthy on the resumed tree by writer lane |

Final resumed-wave results (post-corrections) are recorded in `verification.md` and `progress.md`.

Runtime/implementation evidence (install, lockfile, build, CSS smoke, E2E): intentionally absent — owned by Wave 1 items after acceptance.
