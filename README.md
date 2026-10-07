# starter-kit-frontend

SPA administrativa em Vue 3 + Quasar, consumidora da API do Starter Kit por sessão cookie. Este repositório contém o frontend completo: autenticação por sessão, cliente API gerado a partir do contrato OpenAPI pinado, gestão de utilizadores, papéis e logs de auditoria, empacotamento Docker com nginx e suíte de testes com cobertura mínima exigida.

## Índice

1. [Visão geral](#1-visão-geral)
2. [Stack tecnológica](#2-stack-tecnológica)
3. [Arquitetura](#3-arquitetura)
4. [Arquitetura de código](#4-arquitetura-de-código)
5. [Instalação](#5-instalação)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Funcionalidades](#7-funcionalidades)
8. [Autenticação, sessão e guards de rota](#8-autenticação-sessão-e-guards-de-rota)
9. [Cliente HTTP e contrato OpenAPI](#9-cliente-http-e-contrato-openapi)
10. [Integração fullstack](#10-integração-fullstack)
11. [Docker e nginx](#11-docker-e-nginx)
12. [Testes](#12-testes)
13. [Boas práticas](#13-boas-práticas)
14. [Convenções de commit](#14-convenções-de-commit)
15. [Padrões de código](#15-padrões-de-código)
16. [Scripts e CI](#16-scripts-e-ci)

## 1. Visão geral

O `starter-kit-frontend` é a single-page application do ecossistema Starter Kit. É uma aplicação Vue 3 com Quasar e Vite, escrita em TypeScript em modo estrito, que consome a API Laravel de forma exclusiva por sessão cookie com proteção CSRF. Não existe token portador, não há credencial em `localStorage` e nenhum snapshot de perfil é persistido no navegador.

A separação de responsabilidades é explícita: o Pinia guarda apenas estado de interface e de sessão em memória, o TanStack Query gere todo o estado de servidor com cache e invalidação, e um único cliente HTTP central detém credenciais, fluxo CSRF, timeout e mapeamento de erros tipados. Nenhum outro módulo pode criar instâncias axios.

Os tipos e os hooks de acesso à API não são escritos à mão. São gerados pelo Orval a partir de um contrato OpenAPI aprovado e pinado que vive em `openapi/`, e o build falha se o código gerado divergir dos ficheiros revistos.

## 2. Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | Vue | 3.5.43 |
| Componentes e estilo | Quasar | 2.34.0 |
| Build e dev server | Vite | 8.3.2 |
| Linguagem | TypeScript estrito | 6.0.3 |
| Runtime | Node.js | >= 24.15.0 < 25 |
| Gestor de pacotes | npm | 12.2.0 |
| Estado de UI e sessão | Pinia | 4.0.3 |
| Estado de servidor | TanStack Vue Query | 5.104.1 |
| Rotas | Vue Router | 5.3.1 |
| Transporte HTTP | axios | 1.20.0 |
| Geração do cliente API | Orval | 8.39.0 |
| Testes unitários e integração | Vitest + jsdom + Testing Library Vue | 5.0.3 |
| Mock de rede nos testes | MSW | 3.0.2 |
| Cobertura | cobertura v8 | 5.0.3 |
| Utilitários CSS | Tailwind CSS | 4.3.3 |
| Compilação Sass | sass-embedded | 1.105.1 |
| Lint | ESLint flat + typescript-eslint + eslint-plugin-vue | 10.12.0 |
| Formatação | Prettier | 3.9.9 |
| Servidor de produção | nginx alpine | 1.29 |
| Imagem de build | node alpine | 26 |

As versões do Node e do npm são impostas pelo motor do pacote e pelo `.npmrc` com `engine-strict`. O `.nvmrc` fixa o Node em `24.15.0` e o `save-exact` impede intervalos de versão nas dependências.

As fontes DM Sans e DM Serif Display são empacotadas localmente com Fontsource e os ícones Material vêm de `@quasar/extras`. Nenhum pedido a redes externas de fontes é feito em tempo de execução.

## 3. Arquitetura

A aplicação segue uma arquitetura de SPA desacoplada da API, comunicando apenas por HTTPS com cookies de sessão.

```text
Navegador (SPA servida pelo nginx)
  Rotas e layouts (Vue Router + Quasar)
  Estado de UI e sessão em memória (Pinia)
  Estado de servidor com cache (TanStack Query)
  Cliente HTTP central (axios + CSRF + erros tipados)
        |
        |  sessão cookie, CSRF, JSON
        v
API Laravel (repositório starter-kit-api)
  Sanctum, endpoints /api/v1, contrato OpenAPI versionado
```

Os princípios centrais são:

- Uma só origem de verdade para o estado do utilizador: a sessão da API, refletida em memória pelo store Pinia e invalidada em cada 401 ou 419.
- Uma só instância HTTP configurada, com origem confiável capturada de forma imutável na criação e verificada em cada pedido antes de qualquer envio à rede.
- Nenhum endpoint ou DTO escrito à mão: tudo o que fala com `/api/v1` passa pelo código gerado pelo Orval.
- Falha fechada em todas as fronteiras: URL base inválida, contrato ausente, cliente gerado divergente ou origem estrangeira resultam em erro sem tráfego parcial.

## 4. Arquitetura de código

```text
src/
  main.ts
  App.vue
  app/
    providers/
      pinia.ts
      query.ts
    router/
      index.ts
  features/
    auth/
      api/
      composables/
      pages/
      stores/
    users/
    roles/
    logs/
    manual/
  lib/
    api/
      generated/
    http/
      client.ts
      config.ts
      csrf.ts
      errors.ts
  shared/
    components/
    layouts/
    styles/
    types/
  styles/
  test/
    server.ts
    setup.ts
    http-handlers.ts
    admin-handlers.ts
```

As responsabilidades de cada camada:

- `src/main.ts`: composição da aplicação. Regista Quasar com o conjunto de ícones Material, o Pinia, o plugin do Vue Query com o `queryClient` partilhado e o router.
- `src/app/providers/`: instâncias partilhadas dos gestores de estado. O `queryClient` desliga repetição automática e refetch ao focar a janela.
- `src/app/router/`: definição das rotas e o guard global de navegação com exigências de autenticação, papéis e permissões.
- `src/features/`: organização por domínio de negócio. Cada funcionalidade contém as suas páginas, chamadas de API, composables e stores.
- `src/lib/http/`: transporte central. Detém a criação do cliente axios, a validação da URL base, o coordenador CSRF e o mapeamento de erros tipados.
- `src/lib/api/generated/`: código propriedade do Orval. Nunca é editado manualmente.
- `src/shared/`: componentes, layouts e estilos reutilizáveis entre funcionalidades.
- `src/test/`: servidor MSW e handlers partilhados pelos testes.

Os aliases de importação estão definidos no Vite e no TypeScript: `@` aponta para `src`, `@features` para as funcionalidades, `@shared` para o código partilhado e `@lib` para o transporte e o cliente gerado.

## 5. Instalação

Pré-requisitos: Node.js 24.15.0 e npm 12.2.0. Com nvm instalado:

```sh
nvm use
node --version
npm --version
```

Passo a passo a partir da raiz do repositório:

```sh
cp .env.development.example .env
npm ci
npm run dev
```

A aplicação de desenvolvimento fica disponível no endereço padrão do Vite. Para validar a instalação completa, executar pela ordem:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Para servir localmente o resultado do build de produção:

```sh
npm run preview
```

A verificação do contrato e a geração do cliente fazem parte do build. O `npm run build` executa primeiro o `client:check`, depois o `vue-tsc --noEmit` e só então o `vite build`. Se o contrato estiver ausente ou o cliente gerado divergir, o build para antes de compilar.

## 6. Variáveis de ambiente

A única variável obrigatória é a origem raiz da API. O valor nunca inclui caminho, query ou barra final, porque os caminhos do contrato já contêm o prefixo `/api/v1` e o CSRF usa caminho relativo à raiz.

Ficheiros por ambiente, todos com exemplos versionados:

| Ficheiro | Destino |
|---|---|
| `.env.example` | base local mínima |
| `.env.development.example` | desenvolvimento local |
| `.env.preview.example` | antevisões de PR e deploys efémeros |
| `.env.staging.example` | validação pré-lançamento e QA |
| `.env.production.example` | lançamento em produção |

Conteúdo de cada exemplo:

```sh
VITE_API_URL=http://localhost:8000
```

```sh
VITE_APP_ENV=development
VITE_API_URL=http://localhost:8000
```

```sh
VITE_APP_ENV=preview
VITE_API_URL=https://staging-api.starterkit.com
```

```sh
VITE_APP_ENV=staging
VITE_API_URL=https://staging-api.starterkit.com
```

```sh
VITE_APP_ENV=production
VITE_API_URL=https://api.starterkit.com
```

Regras de ambiente:

- Copiar o exemplo correspondente para `.env` ou `.env.local`. O `.env` real nunca é versionado.
- O ambiente de antevisão nunca aponta para a API de produção.
- A origem da SPA tem de estar registada na API como origem permitida de CORS e como domínio stateful do Sanctum, caso contrário o navegador bloqueia os cookies.
- A validação da URL é estrita: exige `http` ou `https` com autoridade real, rejeita barras invertidas, carateres de controlo, credenciais embutidas, query strings e fragmentos.

## 7. Funcionalidades

Rotas públicas: página inicial pública, login, registo, recuperação de senha, redefinição de senha e verificação de e-mail. Rotas autenticadas: painel, utilizadores, papéis, logs de auditoria, manual, sessão limitada e páginas de erro 403 e 404, além da rota de captura global para caminhos inexistentes.

O detalhe por área:

- Identidade pública: registo de conta sem autenticação imediata, reenvio de e-mail de verificação com tratamento de limitação 429, recuperação de senha com mensagem neutra anti-enumeração e redefinição de senha com token e confirmação.
- Painel: página inicial autenticada após o login.
- Utilizadores: listagem e gestão, acessível com a permissão `users.view`.
- Papéis: listagem e gestão com as respetivas permissões, acessível com `roles.view`.
- Logs: auditoria de atividade da API, acessível com `logs.view`.
- Manual: conteúdo interno acessível inclusive a sessões limitadas.
- Sessão limitada: página dedicada a contas com e-mail por verificar, com ação de reenvio de e-mail.
- Erros: páginas próprias para acesso proibido e para rota inexistente.

Os layouts acompanham o contexto: layout público para as páginas abertas, layout de autenticação para login e registo e layout da aplicação para as áreas autenticadas.

## 8. Autenticação, sessão e guards de rota

A sessão vive em cookies HttpOnly propriedade da API. O store de sessão do Pinia mantém o utilizador apenas em memória, sem persistência, e expõe o estado derivado: autenticado, limitado, bloqueado, papéis e permissões.

O ciclo de vida da sessão:

- O login executa `POST /api/v1/login` e recarrega o perfil com `GET /api/v1/auth/my-profile`.
- O logout executa `POST /api/v1/logout`, limpa a sessão em memória, limpa a cache do Query Client e reinicia o estado do bootstrap CSRF.
- Respostas 401 e 419 disparam o evento de sessão expirada, que limpa a sessão sem repetir a mutação que falhou.
- Erro 419 adicionalmente reinicia o estado do bootstrap CSRF antes de devolver o erro tipado.

A conta com `email_verified_at` nulo recebe o estado `limited`. Sessões limitadas só alcançam rotas marcadas com `allowLimited`, como o manual e a própria página de sessão limitada. Qualquer outra rota autenticada redireciona para `/limited`.

O guard global de navegação corre antes de cada transição e inicializa a sessão por bootstrap quando ainda não foi carregada:

- Rota com `requiresAuth` e visitante anónimo redireciona para o login, preservando o destino em `redirect`.
- Rota com `guestOnly` e utilizador autenticado redireciona para o painel.
- Sessão limitada fora das rotas permitidas redireciona para `/limited`.
- Rota com papéis ou permissões exigidas e sessão sem credencial correspondente redireciona para `/403`.
- Sessão bloqueada redireciona para `/403` com motivo de bloqueio.

## 9. Cliente HTTP e contrato OpenAPI

O cliente central é criado pela fábrica `createHttpClient` com a URL validada de `VITE_API_URL`. Cada instância configura `withCredentials` para transportar o cookie de sessão, espelhamento do cookie `XSRF-TOKEN` no cabeçalho `X-XSRF-TOKEN`, timeout de 15 segundos e cabeçalho `Accept: application/json`.

O fluxo CSRF para pedidos de escrita:

```text
POST, PUT, PATCH ou DELETE
  garantir cookie por GET em /sanctum/csrf-cookie
  enviar pedido com cookie de sessão e cabeçalho CSRF
```

O bootstrap do cookie é dedicado e deduplicado: escritas concorrentes partilham a mesma promessa em voo em vez de disparar pedidos repetidos.

Todos os erros de rede resultam num `HttpError` tipado: `unauthorized` para 401, `forbidden` para 403, `not_found` para 404, `conflict` para 409, `csrf_mismatch` para 419, `validation` para 422 com erros por campo, `rate_limited` para 429 com segundos de espera extraídos, `server_error` para 5xx, `network` com sinalização de timeout, `cancelled` e `unexpected`. As mensagens são cadeias fixas e seguras. Corpos de resposta nunca chegam a mensagens ou registos.

O cliente gerado pelo Orval usa este transporte como mutador. A configuração fixa a entrada em `openapi/openapi.json`, a saída em `src/lib/api/generated` em modo de separação por etiqueta, o cliente `vue-query` sobre axios e o mutador `transportApi`, com sinal de aborto e versão 5 das queries.

O pin do contrato é verificável: `openapi/contract-pin.json` regista o repositório de origem, o commit, o workflow, a execução e o resumo criptográfico do artefacto, e `openapi/receipt.json` acompanha o pacote recebido. O script de verificação valida o artefacto localmente, sem rede, e a geração é bloqueada se o contrato aprovado estiver ausente. O `client:check` confirma que o código gerado corresponde exatamente aos ficheiros revistos.

## 10. Integração fullstack

A SPA consome a API do repositório `starter-kit-api`, uma aplicação Laravel 13 com Sanctum 4 para autenticação por sessão cookie. As duas aplicações são independentes e partilham a mesma sessão do navegador: o login feito na SPA cria o cookie da API e os pedidos seguintes transportam-no automaticamente.

Os pontos de integração:

- Endpoints versionados sob `/api/v1` para saúde, identidade, perfil próprio, utilizadores, papéis e logs, mais o endpoint raiz `/sanctum/csrf-cookie` para o bootstrap CSRF.
- Contrato OpenAPI versionado publicado pela API e pinado neste repositório por commit, workflow e resumo criptográfico. A SPA nunca consome a API fora do contrato aprovado.
- CORS stateful na API: os caminhos `api/*` e `sanctum/csrf-cookie` aceitam credenciais e a origem da SPA tem de constar nas origens permitidas e nos domínios stateful do Sanctum.
- Em desenvolvimento, a SPA corre na origem do Vite e fala com a API noutra origem. Em produção, ambas servem nos seus domínios próprios com a mesma exigência de registo de origem.

## 11. Docker e nginx

O `Dockerfile` usa duas etapas com imagens pinadas por resumo criptográfico.

A etapa de construção parte da imagem Node alpine, recebe `VITE_API_URL` como argumento de build, instala dependências com `npm ci` e executa `npm run build`, o que inclui a verificação do cliente gerado e o typecheck. A etapa de execução copia apenas o `dist` resultante para a imagem nginx alpine com a configuração em `docker/nginx/default.conf`, expõe a porta 80 e define um healthcheck que verifica a raiz local.

O `compose.yaml` constrói a imagem passando `VITE_API_URL`, publica a porta configurada por `HTTP_PORT` apenas na interface local e verifica a saúde do contentor por HTTP interno.

A configuração do nginx:

- Serve a SPA com fallback para `index.html`, preservando o roteamento do lado do cliente.
- Aplica cache imutável de um ano aos recursos em `/assets/`.
- Desliga a exposição de versão do servidor e envia cabeçalhos de segurança, incluindo política de conteúdo restrita.
- Ativa gzip para CSS, JavaScript, JSON e SVG.

## 12. Testes

A suíte usa Vitest com ambiente jsdom, MSW para interceção de rede ao nível do protocolo e Testing Library Vue para renderização de componentes. O arranque dos testes regista o servidor MSW com `VITE_API_URL` apontada para a origem local e handlers partilhados para HTTP e para cenários administrativos.

A cobertura usa o fornecedor v8 sobre `src`, excluindo o código gerado pelo Orval, os utilitários de teste e os próprios ficheiros de teste. Os limiares mínimos exigidos são 87 por cento de linhas, 83 por cento de funções, 80 por cento de ramos e 87 por cento de instruções. O comando de cobertura é:

```sh
npm run test:coverage
```

Os testes cobrem o cliente HTTP com factos reais de pedido, incluindo espelhamento do cabeçalho CSRF, ordenação do bootstrap antes da mutação, deduplicação e reinício após 419, além do mapeamento de todos os estados tipados. Cobrem ainda o store de sessão, o guard de navegação, as páginas de identidade e erro, as listas administrativas e os provedores da aplicação.

## 13. Boas práticas

- Estado de servidor pertence ao TanStack Query. Não duplicar respostas da API em stores manuais.
- Estado de UI e sessão pertence ao Pinia, sempre em memória e sem persistência de credenciais.
- Nunca criar instâncias axios fora do módulo central nem alterar padrões globais do axios.
- Nunca escrever endpoints ou DTOs à mão. Regenerar o cliente a partir do contrato aprovado.
- Nunca registar credenciais, dados pessoais ou texto bruto de erros. Usar as mensagens fixas do `HttpError` e os guardas de tipo exportados.
- Tratar 401 e 419 como sessão expirada com limpeza central, sem repetir a mutação falhada.
- Respeitar a origem confiável imutável: sem destinos absolutos estrangeiros, sem escapes relativos ao protocolo e sem sobreposição de `baseURL` por pedido fora da raiz validada.
- Manter os limiares de cobertura. Código novo chega com testes que exercitam os factos de rede e de navegação.
- Manter `.env` fora do versionamento e rever a origem registada na API sempre que um ambiente muda.

## 14. Convenções de commit

Os commits seguem o formato de commits convencionais com tipo, escopo opcional e descrição no imperativo:

```sh
feat(auth): adicionar reenvio de e-mail de verificação
fix(http): corrigir reinício do bootstrap após 419
docs(readme): reescrever documentação do frontend
```

Tipos em uso no histórico: `feat` para funcionalidade nova, `fix` para correção, `docs` para documentação, `ci` para integração contínua, `chore` para manutenção e `test` para testes. O escopo indica a área afetada, como autenticação, HTTP, cobertura ou bloco de entrega. Mensagens de correção de varredura descrevem o que foi verificado e ajustado.

## 15. Padrões de código

O TypeScript corre em modo estrito com verificação de módulo verbatim, rejeição de variáveis e parâmetros não utilizados, rejeição de quedas em `switch` e acesso indexado verificado. O `vue-tsc` corre sem emissão como porta de typecheck no lint local, no CI e no build.

O ESLint usa configuração flat com as regras recomendadas de JavaScript, TypeScript e Vue, além de proibições específicas como `v-html` e `v-if` combinado com `v-for` no mesmo elemento. O Prettier é a autoridade de formatação para TypeScript, Vue, CSS, scripts, manifestos e ficheiros de configuração, verificado por `format:check`.

Os padrões estruturais:

- Componentes de página por funcionalidade, com testes colocados ao lado do ficheiro testado.
- Composables para lógica reutilizável de listagem e autorização.
- Stores Pinia em estilo de setup, com estado de sessão separado em modelo e coordenador de bootstrap.
- Módulo HTTP coeso em submódulos sem ciclos, com fachada única de erros.
- Estilos com variáveis Sass do Quasar para a paleta e Tailwind para utilitários.
- Cabeçalhos de ficheiros gerados identificando o Orval e proibindo edição manual.

## 16. Scripts e CI

Os scripts principais do `package.json`:

```sh
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run client:generate
npm run client:check
npm run contract:verify
```

A integração contínua executa em Node 24.15.0 com npm 12.2.0 fixado: verificação de formatação, lint, verificação do cliente gerado contra o contrato pinado, typecheck, testes e build. O workflow de contrato valida o cliente em cada PR e push para a branch principal, e o workflow de antevisão publica deploys efémeros apontados para API de homologação.
