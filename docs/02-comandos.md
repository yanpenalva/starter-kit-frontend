# ⌨️ Comandos (scripts do `package.json`)

Todos os scripts reais do `package.json`, o que cada um faz por dentro, quando usar e o que esperar na saída. Nenhum script é apelido vazio: cada seção mostra a cadeia que ele dispara.

---

## 📑 Índice

1. [Visão geral](#-visão-geral)
2. [Desenvolvimento e build](#-desenvolvimento-e-build)
3. [Cliente gerado (Orval)](#-cliente-gerado-orval)
4. [Qualidade: testes, tipos, lint e formato](#-qualidade-testes-tipos-lint-e-formato)
5. [Artefato e fumaça](#-artefato-e-fumaça)
6. [Problemas comuns](#-problemas-comuns)

---

## 🗺️ Visão geral

```mermaid
flowchart TD
    DEV["npm run dev<br/>vite puro, rápido, sem checagens"]
    CHECK["npm run format:check<br/>npm run lint<br/>npm run typecheck<br/>portas de qualidade"]
    TEST["npm test<br/>vitest run"]
    COV["npm run test:coverage<br/>vitest + v8 + thresholds"]
    CLIENT["npm run client:check<br/>gera e compara com o revisado"]
    BUILD["npm run build<br/>client:check → vue-tsc → vite build"]
    PREVIEW["npm run preview<br/>serve dist/"]
    SMOKE["npm run smoke:browser<br/>Chrome headless real"]

    DEV --> CHECK --> TEST --> COV --> CLIENT --> BUILD --> PREVIEW
    BUILD --> SMOKE
```

| Script | Cadeia real | Quando usar |
|---|---|---|
| `dev` | `vite` | Desenvolvimento diário |
| `dev:mock` | `VITE_MOCK_API=1 vite` | Validar UI sem backend |
| `build` | `client:check` + `vue-tsc --noEmit` + `vite build` | Antes de qualquer entrega |
| `client:generate` | `node scripts/generate-client.mjs` | Após receber contrato novo aprovado |
| `client:check` | `client:generate` + `check-client-generated.mjs` | Revisão de PR e antes do build |
| `test` | `vitest run` | A cada mudança de comportamento |
| `test:coverage` | `vitest run --coverage` | Antes de abrir PR |
| `typecheck` | `vue-tsc --noEmit` | Após refatorações e antes de commitar |
| `lint` | `eslint .` | Junto com o typecheck antes de commitar |
| `format` | `prettier --write ...` | Quando o `format:check` apontar divergência |
| `format:check` | `prettier --check ...` | Primeira checagem rápida antes de commitar |
| `preview` | `vite preview` | Conferir o artefato final antes de entregar |
| `smoke:browser` | `node scripts/smoke-browser.mjs` | Depois do build ou do preview |
| `contract:verify` | `python3 scripts/verify_contract.py` | Quando a geração falhar ou ao receber contrato novo |

---

## 💻 Desenvolvimento e build

### 1️⃣ `npm run dev` → `vite`

Sobe o servidor de desenvolvimento do Vite com recarregamento quente. Não roda typecheck, lint nem verificação de contrato — velocidade é o objetivo. Use durante todo o desenvolvimento diário. Saída esperada: o endereço local (padrão `http://localhost:5173`) e confirmação de pronto em poucas centenas de milissegundos.

### 2️⃣ `npm run dev:mock` → `VITE_MOCK_API=1 vite`

Igual ao `dev`, mas registra antes do bootstrap um worker MSW que intercepta a API com dados fictícios em memória — ver `docs/modo-mock.md`. Use para validar layout, filtros, paginação e estados de erro sem backend. Não altera guards nem páginas; só funciona em desenvolvimento (`import.meta.env.DEV`), nunca no build de produção.

```mermaid
flowchart TD
    DEV["npm run dev:mock<br/>predev:mock check-dev-deps + VITE_MOCK_API=1 vite"]
    MAIN{"main.ts<br/>DEV && VITE_MOCK_API === 1?"}
    REAL["bootstrap real<br/>app monta contra a API"]
    START["startMockWorker()<br/>src/mocks/browser.ts"]
    SCEN["parseMockScenario(location.search)<br/>?mock= full padrão, empty, slow, error"]
    HAND["createMockHandlers<br/>apiBaseUrl + createMockDatabase() em memória"]
    SW{"setupWorker().start()<br/>Service Worker registra?"}
    INPAGE["startInPageMock()<br/>intercepta fetch + XHR na página"]
    MOUNT["rede interceptada<br/>app monta sobre o mock"]
    FATAL["Modo mock indisponível<br/>app nem monta, erro claro em tela"]

    DEV --> MAIN
    MAIN -->|não| REAL
    MAIN -->|sim| START --> SCEN --> HAND --> SW
    SW -->|sim| MOUNT
    SW -->|documento sem Service Worker| INPAGE --> MOUNT
    HAND -.sem handler p/ base da API.-> FATAL
```

> Sem handler para a base da API, o mock falha alto (`defaults.error()`) em vez de vazar para a API real. Se nem o worker nem a interceptação em página iniciarem, a aplicação nem monta e mostra `Modo mock indisponível`.

### 3️⃣ `npm run build` → `client:check` + `vue-tsc --noEmit` + `vite build`

É a porta de entrega: só passa o código que está íntegro nas três camadas. A ordem é proposital — cada etapa só roda se a anterior passou:

1. `npm run client:check` — confirma que o cliente gerado corresponde ao contrato pinado.
2. `vue-tsc --noEmit` — verificação de tipos de TypeScript e dos blocos de script dos `.vue`, sem emitir arquivos.
3. `vite build` — empacotamento para `dist/`.

Use antes de qualquer entrega, e é o que o `Dockerfile` e o CI executam. Saída esperada: as três etapas sem erro e a pasta `dist/` com `index.html` e os recursos em `assets/`. Se o contrato estiver ausente ou o código gerado divergir, o build para na primeira etapa, antes de compilar qualquer coisa.

---

## 🔌 Cliente gerado (Orval)

### 4️⃣ `npm run client:generate` → `node scripts/generate-client.mjs`

Regenera o cliente API a partir do contrato aprovado em `openapi/openapi.json` usando o Orval `8.39.0` com a configuração de `orval.config.ts`. Por dentro, o script primeiro bloqueia a geração se o contrato aprovado estiver ausente, depois valida o pacote localmente e só então invoca o Orval, que escreve em `src/lib/api/generated/` em modo de separação por etiqueta. Use depois de receber um contrato novo aprovado. Saída esperada: os arquivos gerados atualizados sob `src/lib/api/generated/`; se o contrato estiver ausente, erro explícito de geração bloqueada e saída diferente de zero.

### 5️⃣ `npm run client:check` → `client:generate` + `check-client-generated.mjs`

Executa a geração e depois compara o resultado com os arquivos gerados que estão revisados no git. Detecta divergência tanto em arquivos rastreados modificados (`git diff --exit-code`) quanto em arquivos novos não rastreados (`git ls-files --others`). Use em revisão de PR e antes do build para provar que ninguém editou o gerado à mão nem esqueceu de regenerar. Saída esperada: silêncio e saída zero quando tudo coincide; mensagem de divergência do cliente gerado quando há diferença.

### 6️⃣ `npm run contract:verify` → `python3 scripts/verify_contract.py`

Valida o contrato pinado em `openapi/` localmente, sem rede: confere o pin registrado em `contract-pin.json` contra o artefato e o recibo recebidos. É executado automaticamente dentro do `client:generate`, mas pode ser rodado sozinho para diagnosticar problemas de contrato. Use quando a geração falhar ou ao receber um pacote de contrato novo. Saída esperada: confirmação de verificação; erro explícito se o artefato ou o recibo divergirem do pin.

---

## ✅ Qualidade: testes, tipos, lint e formato

### 7️⃣ `npm test` → `vitest run`

Roda a suíte inteira uma vez, em modo não interativo, com ambiente `jsdom` e servidor MSW registrado pelo `src/test/setup.ts` (que aponta `VITE_API_URL` para a origem local de teste). Use a cada mudança de comportamento. Saída esperada: lista de arquivos de teste com contagem de testes aprovados, algo como dezenas de arquivos e centenas de testes verdes, com resumo final de duração.

### 8️⃣ `npm run test:coverage` → `vitest run --coverage`

Igual ao `test`, mas coleta cobertura pelo provedor v8 sobre `src/**/*.ts` e `src/**/*.vue`, excluindo o código gerado pelo Orval, os utilitários de teste e os próprios arquivos de teste. Aplica os limiares mínimos: 87% de linhas, 83% de funções, 80% de ramos e 87% de instruções. Use antes de abrir PR — é o que o CI cobra. Saída esperada: tabela de cobertura por arquivo mais o resumo total; se qualquer limiar ficar abaixo, o comando falha mesmo com todos os testes verdes.

### 9️⃣ `npm run typecheck` → `vue-tsc --noEmit`

Verifica os tipos de todo o projeto, incluindo os blocos de script dos componentes `.vue`, sem gerar saída. O TypeScript roda em modo estrito com rejeição de variáveis não utilizadas e acesso indexado verificado. Use depois de refatorações e antes de commitar mudanças de tipos. Saída esperada: nenhuma saída e saída zero quando está tudo certo; lista de erros com arquivo e linha quando há problema de tipo.

### 🔟 `npm run lint` → `eslint .`

Aplica o ESLint com configuração flat sobre o repositório: regras recomendadas de JavaScript, TypeScript e Vue, mais proibições específicas como `v-html` e `v-if` junto com `v-for` no mesmo elemento. Use junto com o typecheck antes de commitar. Saída esperada: silêncio quando limpo; lista de problemas com arquivo, linha e nome da regra quando há violação.

### 1️⃣1️⃣ `npm run format` → `prettier --write ...`

Reescreve os arquivos para o padrão do Prettier: fontes em `src`, scripts, `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.ts`, `orval.config.ts` e `index.html`. O Prettier é a autoridade de formatação — discussão de estilo termina aqui. Use quando o `format:check` apontar divergência. Saída esperada: lista dos arquivos reescritos.

### 1️⃣2️⃣ `npm run format:check` → `prettier --check ...`

Apenas verifica a formatação, sem reescrever — é a versão que o CI usa. Use como primeira checagem rápida antes de commitar. Saída esperada: mensagem de que todos os arquivos estão conformes; em caso de divergência, a lista dos arquivos fora do padrão.

---

## 📦 Artefato e fumaça

### 1️⃣3️⃣ `npm run preview` → `vite preview`

Serve localmente o `dist/` já empacotado, para validar o build de produção fora do dev server. Não recompila: exige um `npm run build` prévio. Use para conferir o artefato final antes de entregar ou depurar algo que só aparece no bundle. Saída esperada: endereço local servindo o `index.html` empacotado.

### 1️⃣4️⃣ `npm run smoke:browser` → `node scripts/smoke-browser.mjs`

Abre a aplicação em um Chrome headless real via protocolo de depuração, carrega a página e observa o tráfego de rede: qualquer pedido para origem diferente da aplicação é registrado como vazamento externo. Variáveis que ajustam o comportamento: `BROWSER_SMOKE_URL` (endereço da app, padrão `http://127.0.0.1:5173`), `CHROME_BIN` e `CHROME_REMOTE_ENDPOINT` para reaproveitar um Chrome remoto. Use depois do build ou do preview para provar que a SPA não fala com fontes, CDNs ou telemetrias externas — as fontes são empacotadas localmente justamente para este teste passar. Saída esperada: aprovação sem pedidos externos; a lista de URLs externas quando houver vazamento.

---

## ⚠️ Problemas comuns

| Sintoma | Causa e correção |
|---|---|
| `npm ci` rejeita a versão do npm/node | Alinhe com `npm install --global npm@12.2.0` e Node 24.15+. |
| `InvalidEnvironmentConfigError: preview environment must never point to production API` | `VITE_APP_ENV` e `VITE_API_URL` inconsistentes. |
| `client:generate` bloqueia com "Contrato aprovado ausente" | O artefato `openapi/` precisa estar commitado e passar em `npm run contract:verify`. |
| `Client Orval gerado diverge dos arquivos revisados e pinados` | Regenere com `npm run client:generate`; se persistir, o diff é real e precisa de review — não edite a mão. |
| Login falha com 419 | Origem da SPA ausente em `SANCTUM_STATEFUL_DOMAINS` / CORS da API. |
