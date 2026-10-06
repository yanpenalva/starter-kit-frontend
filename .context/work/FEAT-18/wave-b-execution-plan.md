# Wave B — Admin Screens (starter-kit-frontend)

Plano de execução na branch `feat/wave-b-admin-screens`. Sem push, sem PR.

## Situação do contrato (bloqueio registrado)
- `openapi/` contém o pin wave A (commit `e646c34...`, run 37255680565). `contract:verify` verde offline.
- API wave B (`starter-kit-api` branch `feat/wave-b-admin-crud`) NÃO tem commits novos: `routes/api.php` sem rotas admin, sem controllers users/roles/audit, `contracts/openapi.json` só auth. GitHub tem exatamente 1 artifact (wave A). Portanto NÃO existe contrato wave B para baixar; regenerar cliente "contra a API wave B" é impossível sem forjar pin/receipt (proibido).
- Decisão: manter pin wave A, rodar `contract:verify` + `client:check` sem drift, e construir as telas sobre o CONTRATO PREPARADO pela wave A da API (commit `2aa6f22`, ADR 0007, `tests/Feature/Admin/AdminContractTest.php`), que fixa: rotas, payloads, envelope de paginação Laravel (`data`+`links`+`meta`), UserResource (id/name/email/email_verified_at/deactivated_at/roles/cpf-condicional), RoleResource (id/name/guard_name/permissions), filtros allowlist search/status/role, per_page<=100. API client hand-authored em `src/features/*/api/` (camada própria, não dentro de generated/) + MSW handlers com essas formas; quando o contrato wave B for publicado, regenerar Orval e substituir as chamadas.

## Contrato wave B esperado (ADR 0007)
| Método | Caminho | Ability |
| GET | /api/v1/users | users.view |
| PATCH | /api/v1/users/{user} | users.update |
| POST | /api/v1/users/{user}/status | users.set-status |
| PUT | /api/v1/users/{user}/roles | users.assign-roles |
| GET | /api/v1/roles | roles.view |
| PUT | /api/v1/roles/{role}/permissions | roles.update-permissions |
Feed de auditoria: endpoint wave 6 (logs.view) — formato NOT FOUND; modelar via MSW com envelope Laravel padrão, campos: id, log_name, description, event, subject_type, subject_id, causer, properties, created_at.

Permissões (catálogo, 8): users.view, users.update, users.set-status, users.assign-roles, users.read-cpf, roles.view, roles.update-permissions, logs.view. Roles: admin (todas), user (nenhuma).

## Slices (TDD, cada um com Vitest antes/ junto)
1. `src/features/users/api/users.api.ts` — list(index com page/per_page/search/status/role), show, update, setStatus, assignRoles. Tipos espelhando UserResource + PaginationEnvelope.
2. Store/composable `useUsersList` (TanStack Query) com estado de filtros; página UsersPage: busca (debounce), filtros status/role, paginação, ações condicionais por ability; UserDetailPage/UserEditPage (ou drawer na mesma página) com update/setStatus/assignRoles; 403 visual sem ability; loading/empty/error.
3. `src/features/roles/api/roles.api.ts` + RolesPage: listagem, matriz de permissões (checkbox 2 roles x 8 perms), salvar com roles.update-permissions; role admin imutável (UI bloqueia).
4. `src/features/logs/api/audit.api.ts` + LogsPage: feed com filtros (search/evento/log_name/página), estados loading/empty/error.
5. Router: adicionar rotas novas atrás de meta permissions (users/:id, users/:id/edit se rotas separadas). Guards já existem (navigationGuard lê meta.roles/permissions).
6. Gate final: vitest run, vue-tsc --noEmit, eslint ., format:check; commit único na branch.

## Convenções
- Mensagens UI pt-BR; identificadores en-US; sem comentários supérfluos.
- Estilos: scoped CSS como nas páginas existentes (tokens var(--color-*)). Quasar disponível mas páginas atuais usam CSS puro — seguir o existente.
- Testes: padrão LoginPage.test.ts (mount + pinia + mocks de vue-router quando necessário) e MSW via server.use para chamadas de API reais.
- NÃO persistir nada de sessão/credenciais (já garantido pelos stores existentes; não adicionar storage).
