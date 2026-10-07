# Onboarding: do zero ao build e testes verdes

Guia de entrada para desenvolvimento neste repositório. Ao final, você terá o
ambiente instalado, os checks locais passando e o build gerado — sem consultar
nenhum outro documento.

Contexto normativo do projeto: [.context/INDEX.md](../.context/INDEX.md).
Arquitetura aceita: [ADR 0001](adr/0001-vue-spa-architecture.md).

---

## 1. Pré-requisitos

| Ferramenta | Versão exigida | Como o repo valida |
| --- | --- | --- |
| Node.js | 24.x LTS, mínimo **24.15.0** (< 25) | `engines` em `package.json` + `.nvmrc` (24.15.0) |
| npm | **12.2.0** exato | `engines` + `engine-strict=true` em `.npmrc` |
| Python 3 | 3.x (validação de contexto e contrato) | chamado direto nos scripts |
| Google Chrome | instalado (apenas para smoke de browser) | `npm run smoke:browser` |

Com Node 24 instalado, alinhe o npm antes de qualquer comando do repo:

```sh
npm install --global npm@12.2.0
node --version && npm --version
```

`engine-strict=true` faz `npm ci` falhar com qualquer outra combinação. Se o
host tiver outro Node, use um ambiente isolado (nvm, containers) em vez de
alterar a configuração compartilhada do host.

## 2. Instalação

```sh
git clone git@github.com:yanpenalva/starter-kit-frontend.git
cd starter-kit-frontend
npm ci
```

`npm ci` (nunca `npm install` para tarefas do dia a dia) instala exatamente o
que `package-lock.json` pinia. Dependências do repo: Vue 3, Quasar 2, Pinia 4,
TanStack Query 5, Vue Router 5, Vite 8, TypeScript 6 (strict), Vitest 5 + MSW
3, ESLint 10 + Prettier 3, Orval 8.39.0.

## 3. Ambiente local (`.env`)

Copie o exemplo do ambiente desejado — arquivos reais `.env*` são gitignored;
somente os `.example` são versionados:

```sh
cp .env.development.example .env   # desenvolvimento local
```

| Arquivo | `VITE_APP_ENV` | `VITE_API_URL` | Uso |
| --- | --- | --- | --- |
| `.env.development.example` | `development` | `http://localhost:8000` | dev local |
| `.env.preview.example` | `preview` | `https://staging-api.starterkit.com` | preview de PR |
| `.env.staging.example` | `staging` | `https://staging-api.starterkit.com` | staging |
| `.env.production.example` | `production` | `https://api.starterkit.com` | produção |

Regras que o código valida em runtime (`src/lib/http/config.ts`), falhando
fechado com `InvalidApiBaseUrlError` / `InvalidEnvironmentConfigError`:

- `VITE_API_URL` é a **origem raiz** da API (sem path, sem barra final, sem
  query, sem credenciais embutidas; apenas http/https).
- Build de **preview nunca aponta para API de produção** — hostname
  `api.starterkit.com` ou qualquer host com token `prod`/`production` é
  rejeitado quando `VITE_APP_ENV=preview`.

## 4. Rodar contra a API local

A SPA é independente da API Laravel (`starter-kit-api`): origens diferentes,
comunicação **cross-origin** por cookies Sanctum.

1. Suba a API local (repo `starter-kit-api`, padrão `http://localhost:8000`).
2. No `.env` da **API**, registre a origem da SPA:
   - `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`
   - `cors.php` com `allowed_origins` incluindo `http://localhost:5173`
     (`supports_credentials` ativo).
3. Na SPA, mantenha `VITE_API_URL=http://localhost:8000`.
4. `npm run dev` e abra `http://localhost:5173`.

Fluxo de sessão (transparente para o dev, mas útil ao depurar):

```text
Requisição mutante (POST/PUT/PATCH/DELETE):
  GET {VITE_API_URL}/sanctum/csrf-cookie  -> cookie XSRF-TOKEN
  header X-XSRF-TOKEN espelha o cookie; sessão via cookie HttpOnly
419 csrf_mismatch: estado de bootstrap resetado; erro tipado, sem retry cego
```

O cliente HTTP central vive em `src/lib/http` (única instância axios do app;
nenhum outro módulo cria instância). Testes não precisam da API: o Vitest usa
MSW (`src/test/server.ts`) com handlers por feature.

## 5. Checks locais

Ordem usada em PR e CI local:

```sh
npm run format:check   # prettier --check
npm run lint           # eslint .
npm run typecheck      # vue-tsc --noEmit
npm test               # vitest run
npm run build          # vue-tsc --noEmit && vite build
```

Smoke de browser (gate local, não roda em CI remoto): sobe o dev server e
valida rota pública + harness de layout exclusivo de dev.

```sh
npm run dev    # terminal 1 (porta 5173)
npm run smoke:browser    # terminal 2; requer Chrome
```

`BROWSER_SMOKE_URL` troca a origem alvo; o harness sintético de auth-layout
existe só no dev server, então o smoke não roda contra `vite preview`.

## 6. Contrato OpenAPI e cliente gerado (orval)

O cliente da API nunca é escrito à mão e não existe drift: tudo nasce do
artefato OpenAPI **pinado** no repo.

- `openapi/contract-pin.json` — origem pinada (`yanpenalva/starter-kit-api`,
  commit SHA, branch); sem `latest`.
- `openapi/openapi.json` + `receipt.json` + `artifact.zip` — artefato verificado
  offline por SHA/identidade de origem.
- `src/lib/api/generated/**` — saída Orval 8.39.0 (client `vue-query`,
  mutator `src/lib/http/orval-mutator.ts`); **generator-owned**, não editar.

Comandos:

```sh
npm run contract:verify   # verificação offline do artefato pinado
npm run client:generate   # falha fechado se o contrato não verificado
npm run client:check      # gera deterministicamente e falha se divergir do commitado
```

`client:check` roda no CI (workflow Contract client) sem credenciais de API.
Para renovar o contrato, existe caminho próprio de publicação autorizada —
fora do escopo deste guia.

## 7. Contexto CSD (validação do kit)

O kit de contexto `.context/` tem validador próprio, obrigatório em PR:

```sh
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests -v
npx @owlcodium/context-spec-develop@1.2.1 doctor --scope project
```

O validador confere arquivos obrigatórios, placeholders não resolvidos,
links internos de todo `.md` do repo, governance e work items ativos.

## 8. Preview por PR, deploy e rollback

Cobertos em [deployment-preview-rollback.md](deployment-preview-rollback.md):
build estático versionado com assets content-hashed, mapeamento de origens por
ambiente (CORS/`SANCTUM_STATEFUL_DOMAINS`), workflow de preview por PR
(`.github/workflows/preview.yml`) e procedimento de rollback por tag
`fe-<data>-<sha>`. Este doc não duplica aquele conteúdo.

Resumo do fluxo: PR aberto → workflow `preview.yml` roda `npm run build` com
`VITE_APP_ENV=preview` → artefato `preview-dist-pr-<n>` (7 dias) → smoke no
ambiente de preview com o checklist abaixo.

Smoke pós-deploy (preview/staging/produção):
[smoke-checklist.md](smoke-checklist.md) — carregamento de assets, bootstrap
CSRF, login, guards (`guestOnly`/`requiresAuth`), telas administrativas e
logout.

## 9. Convenções em 30 linhas

Estrutura e estado:

- **Feature-first**: `src/features/<dominio>/{api,composables,pages,stores}`,
  mais `src/shared` (UI genérica) e `src/lib` (integrações com contrato
  explícito — http client central, cliente orval).
- **TanStack Query** é dono do estado de servidor (cache, keys, perfil de
  sessão); **Pinia** é dona apenas de estado de UI. Sem persistência de
  credenciais ou perfil no cliente.
- Rotas em `src/app/router` escritas à mão; guards por meta:
  `guestOnly` (login/register/recuperação redirecionam autenticados ao
  dashboard), `requiresAuth` (redireciona anônimos a `/login?redirect=...`),
  `allowLimited` (sessão com e-mail não verificado), `permissions`/`roles`
  (UX apenas — a API é a fronteira de enforcement).
- **Sem Playwright** no escopo atual: cobertura é Vitest + MSW; smoke de
  browser local é o limite de E2E por enquanto.
- **Contrato sem drift**: endpoints e DTOs somente do artefato pinado via
  `npm run client:generate`; nunca criar axios instance fora de `src/lib/http`;
  nunca editar `src/lib/api/generated/**`.

Processo:

- Identificadores e código em en-US; mensagens de usuário em pt-BR.
- Conventional Commits, PRs pequenos para `main`, cada task com Issue GitHub.
- Contexto normativo exclusivamente em `.context/`; AGENTS.md é entrypoint.
- Segredos nunca no repo: só `.env.*.example` versionados.

## 10. Problemas comuns

- `npm ci` rejeita a versão do npm/node → alinhe com `npm install --global
  npm@12.2.0` e Node 24.15+ (seção 1).
- `InvalidEnvironmentConfigError: preview environment must never point to
  production API` → `VITE_APP_ENV` e `VITE_API_URL` inconsistentes (seção 3).
- `client:generate` bloqueia com "Contrato aprovado ausente" → o artefato
  `openapi/` precisa estar commitado e passar em `npm run contract:verify`
  (seção 6).
- `Client Orval gerado diverge dos arquivos revisados e pinados` → regenere com
  `npm run client:generate`; se persistir, o diff é real e precisa de review —
  não edite a mão.
- Login falha com 419 → origem da SPA ausente em `SANCTUM_STATEFUL_DOMAINS` /
  CORS da API (seção 4).
