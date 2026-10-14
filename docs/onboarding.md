# 👋 Onboarding do frontend

Guia para sair do zero até build + testes verdes. Stack: Vue 3 + Vite +
Pinia + TanStack Query, cliente HTTP próprio sobre axios, contrato OpenAPI
consumido via Orval (sem drift), testes Vitest + MSW.

## Pré-requisitos

- Node `>=24.15.0 <25` e npm `>=11.0.0` (ver `engines` em `package.json`;
  o CI usa Node 24.15.0).
- Python 3 (só para `npm run contract:verify`).
- API Laravel rodando localmente para fluxos autenticados
  (padrão `http://localhost:8000`).

## Instalação

```sh
npm ci
```

Não use `npm install` para setup reproduzível: o lockfile (`package-lock.json`)
pina as versões exatas.

## Desenvolvimento local

1. Copie `.env.example` para `.env` (nunca commite `.env`, é gitignored).
   O padrão já aponta para a API local:

   ```sh
   cp .env.example .env
   ```

2. Suba o dev server (Vite em `http://localhost:5173`):

   ```sh
   npm run dev
   ```

3. Suba a API em `http://localhost:8000`. A sessão viaja em cookie HttpOnly
   da API com `withCredentials`; o bootstrap CSRF (`/sanctum/csrf-cookie`)
   acontece sozinho antes de escritas. No lado da API, a origem da SPA
   precisa estar liberada em CORS + domínios stateful do Sanctum — veja
   `docs/05-integracao-fullstack.md`. Ambientes (`preview`, `staging`,
   `production`) têm seus `.env.*.example`; produção recebe a URL por segredo
   de deploy, nunca de arquivo local.

## Portas e comandos de qualidade

Ordem sugerida antes de commitar (mesma do CI em
`.github/workflows/frontend-checks.yml`):

```sh
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # vue-tsc --noEmit
npm test               # vitest run (suite completa)
npm run build          # client:check + typecheck + vite build
```

Cobertura opcional: `npm run test:coverage`.

## Contrato OpenAPI (sem drift)

O snapshot aprovado vive em `openapi/openapi.json`, pinado por
`openapi/contract-pin.json` + `openapi/receipt.json` (origem, commit,
execução, hashes) e verificado offline por `scripts/verify_contract.py`.
O cliente em `src/lib/api/generated/` é gerado por Orval — nunca edite à mão:

```sh
npm run contract:verify   # prova a proveniência do snapshot
npm run client:generate   # regenera a partir do snapshot
npm run client:check      # prova que o gerado bate com o revisado
```

Se `client:check` falhar, regenere e versione o resultado; nunca ajuste o
gerado diretamente. Detalhes do fluxo em `docs/05-integracao-fullstack.md`.

## Testes e smoke em navegador

- `npm test` roda a suite Vitest (jsdom + MSW); páginas, stores, guards e
  transporte HTTP têm cobertura dedicada.
- Smokes com Chrome real (requer dev server + Chrome):
  `npm run smoke:browser`, `npm run smoke:auth`, `npm run smoke:verify`.
  São portões locais, não fazem parte do CI remoto.

## Preview, rollback e pós-deploy

- Preview por PR e estratégia de rollback por tags (`fe-<data>-<sha>`):
  `docs/deployment-preview-rollback.md`.
- Checklist executável pós-deploy (login, guards, navegação admin):
  `docs/smoke-checklist.md`.

## Convenções rápidas

- Feature-first em `src/features/`; transporte centralizado em `src/lib/http`
  (nenhum módulo cria axios próprio).
- Rotas: `guestOnly` (login, register, forgot, reset), `requiresAuth` com
  permissões (`users.view`, `roles.view`, `logs.view`), `allowLimited`
  para sessão não verificada.
- Todo erro de rede vira `HttpError` tipado com mensagem pt-BR fixa; corpos
  crus nunca chegam à UI nem aos logs.
- Sem Playwright; sem segredo no repo; sem código comentado.

Dúvidas de processo (classificação, roteamento, exposição de exceção):
`.context/INDEX.md` é a fonte normativa; este documento cobre só o caminho
técnico do zero ao verde.
