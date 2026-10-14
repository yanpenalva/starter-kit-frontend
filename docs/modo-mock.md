# 🎭 Modo mock (UI sem API)

Valide layout, responsividade, tabelas, filtros, paginação e detalhes das
páginas reais sem backend rodando. O navegador usa as mesmas páginas,
componentes, guards e clientes HTTP de produção; só a camada de rede é
interceptada pelo MSW com dados fictícios em memória.

Validar a interface no modo mock **não** valida a integração real. Erros de
contrato, CORS, CSRF, cookies e comportamento do backend só aparecem contra
a API de verdade (`npm run dev` + API local).

## Pré-requisitos

- Node.js `24.15.0`, o valor do `.nvmrc` (`engines` exige `>= 24.15.0 < 25`).
  Com `nvm`, `nvm use` é suficiente; sem `nvm`, use o Node pinado direto:
  `PATH=/opt/data/node24/bin:$PATH`.
- Dependências instaladas com `npm ci` na raiz do projeto. O mock resolve
  `axios`, `msw`, `vue` e `@mswjs/interceptors` do `node_modules` local;
  `npm install` não serve
  para instalação limpa, porque ignora o que o `package-lock.json` trava.
- `.env` criado a partir de `.env.development.example` (o mock lê
  `VITE_API_URL` do mesmo arquivo; nenhuma API precisa responder).

O `npm run dev:mock` roda antes do Vite o script `predev:mock`
(`node scripts/check-dev-deps.mjs`), que confirma a resolução de `axios`,
`msw`, `vue` e `@mswjs/interceptors` em `node_modules`. Com instalação ausente ou parcial o passo
falha em pt-BR, sem subir servidor nenhum, listando o pacote, o arquivo que
o importa e o comando de correção (`nvm use` + `npm ci`, ou o Node pinado).
O script também roda sozinho, sem o Vite, para diagnosticar:

```sh
node scripts/check-dev-deps.mjs
```

Sem essa checagem o sintoma apareceria mais tarde e menos claro, no Vite:

```
Failed to resolve import "axios" from "src/lib/http/client.ts"
```

Esse erro é de instalação, não de código: `axios` é dependência normal,
pinada em `package.json`, e não pode simplesmente faltar. Ele aparece com
`node_modules` ausente (nunca instalado, ou apagado) ou parcial (instalação
interrompida, `npm ci` feito com outro Node). A correção é sempre `npm ci`
na raiz do projeto, com o Node 24.15.0 do `.nvmrc`.

## Início rápido

```sh
npm run dev:mock
```

Abra com o cenário na query (troque o caminho pela página desejada):

- `http://localhost:5173/users?mock=full` — lista preenchida (padrão)
- `http://localhost:5173/users?mock=empty` — lista vazia
- `http://localhost:5173/users?mock=slow` — listas com atraso de 1,5 s
- `http://localhost:5173/users?mock=error` — listas com erro 500 simulado

`npm run dev` mantém o comportamento atual (API real, sem mocks).

## Páginas acessíveis

`/users`, `/roles`, `/logs` (exigem `users.view`, `roles.view`,
`logs.view` — o perfil fictício tem todas as permissões do catálogo, então
os guards passam sem alteração), além de `/dashboard`, `/manual` e do fluxo
de login em `/login` (qualquer credencial entra; a senha não é verificada).

## Sessão fictícia

- Perfil: `alice.admin@example.test`, papel `admin`, e-mail verificado,
  todas as permissões de `CATALOGUE_PERMISSIONS`.
- `POST /api/v1/login` aceita qualquer credencial e responde `204`;
  `GET /api/v1/auth/my-profile` devolve o perfil; CSRF responde `204`.
- Base de dados: 32 usuários (nomes longos, mistura de ativos,
  desativados e não verificados), 5 papéis (`admin` imutável + `manager`,
  `support`, `auditor`, `user`) e 48 registros de auditoria com textos
  longos — volume suficiente para paginação (`per_page` padrão 15).

## Cenários

Seleção pelo parâmetro `?mock=` na URL, sem nenhum controle na interface
e sem nada persistido:

- `full` (padrão, também usado quando o valor é desconhecido): dados
  completos, respostas imediatas.
- `empty`: listas com zero itens (filtros e paginação continuam
  funcionando); sessão e perfil seguem autenticados.
- `slow`: listas de usuários, papéis e auditoria atrasam 1,5 s para expor
  estados de carregamento.
- `error`: as três listas falham com 500 simulado para expor estados de
  erro; sessão e escritas seguem funcionando.

## Escritas e ações não suportadas

Funcionam em memória nesta sessão: criar, editar, ativar/desativar,
atribuir papéis e excluir usuários; criar e excluir papéis; editar
permissões de papéis não imutáveis (o papel `admin` devolve 403 como o
contrato real). Cadastro, recuperação e redefinição de senha, reenvio e
confirmação de verificação respondem `501` com mensagem clara — nunca são
encaminhadas à API real.

## Efemeridade e reset

Tudo vive só na memória da página: recarregar restaura os dados iniciais
e a sessão fictícia padrão (o parâmetro `?mock=` permanece na URL, mas os
dados voltam ao zero). Nada usa `localStorage`, IndexedDB, cookies
persistentes ou backend. Sair do modo mock: pare o `dev:mock` e suba o
`npm run dev` normal — nenhuma interceptação sobrevive, porque o worker só
existe enquanto a página do mock está aberta.

## Proteção contra produção

A ativação exige duas condições simultâneas: build de desenvolvimento
(`import.meta.env.DEV`) **e** `VITE_MOCK_API=1`. Em `vite build`, `DEV` é
falso e o ramo do mock é eliminado — mesmo com a variável configurada por
engano, produção nunca registra o worker. Em desenvolvimento, fixtures e inicialização viajam em chunk separado
carregado só sob a condição acima; no build de produção a condição é
falsa em tempo de compilação e o ramo é eliminado — o bundle não contém
dados fictícios nem o MSW (verificado por inspeção do `dist/`).

## Service Worker residual

Se alguma página parar de chamar a API após usar o mock (ou o contrário),
um registro antigo do worker pode ter ficado no navegador: abra DevTools →
Application → Service Workers, marque “Update on reload”, clique em
“Unregister” para a origem `localhost:5173` e recarregue. Em navegação
normal (sem `VITE_MOCK_API=1`) o worker nunca é registrado.

## Service Worker indisponível na página

Existem contextos em que a página não pode usar Service Workers: previews
embutidos (o Simple Browser do VS Code, por exemplo), webviews de IDE, iframes
restritos e navegadores ou perfis com cookies/dados do site bloqueados para a
origem. Neles o Chromium recusa a primeira chamada do MSW com
`Failed to get ServiceWorkerRegistration objects: The document is in an invalid
state.`

O modo mock trata esse caso em dois passos:

1. Tenta registrar o worker MSW, como sempre. Documentos em pré-render esperam
   o evento `prerenderingchange` antes da tentativa.
2. Se a página não puder usar Service Worker nenhum, a interceptação passa a
   acontecer na própria página (`fetch` e `XMLHttpRequest`), com os mesmos
   handlers e os mesmos cenários `?mock=`. Um aviso no console —
   `[mock] este documento não pode usar Service Workers (...)` — indica o modo
   ativo, e nesse caminho nada é registrado no navegador.

A garantia continua a mesma nos dois caminhos: chamadas à base da API sem
handler falham alto (`defaults.error()`) em vez de sair para a API real, e a
aplicação só monta depois que a interceptação está de pé. Aplicação que exibe
`Modo mock indisponível` significa que nem o worker nem a interceptação na
página iniciaram; a mensagem traz a causa, e a receita é abrir a URL em uma aba
normal do navegador, fora de previews, webviews ou iframes, conferindo que
cookies e dados do site não estão bloqueados para a origem.

## Onde mexer

- `src/mocks/mock-env.ts` — condição de ativação (pura, testada).
- `src/mocks/mock-scenario.ts` — cenários e leitura de `?mock=`.
- `src/mocks/mock-data.ts` — `createMockDatabase()`: fixtures sintéticas.
- `src/mocks/mock-handlers.ts` — `createMockHandlers({ apiBaseUrl, database,
scenario })`: handlers MSW espelhando os contratos reais.
- `src/mocks/browser.ts` — `startMockWorker()`: registra o worker; quando o
  documento não pode usar Service Workers, cai para `in-page-mock.ts`. Chamadas
  à base da API sem handler falham alto (`defaults.error()`), enquanto
  o resto (chunks do Vite, HMR) passa direto.
- `src/mocks/mock-worker.ts` — classificação do erro de documento (Service
  Worker indisponível) e espera da ativação do pré-render (puros, testados).
- `src/mocks/in-page-mock.ts` — interceptação na própria página (`fetch` e
  `XMLHttpRequest`) usada como saída quando o documento não pode usar Service
  Workers.
- `src/main.ts` — importa o worker dinamicamente antes do bootstrap de
  sessão; se ele não inicializar, a aplicação nem monta e mostra erro claro.
- Testes em `src/mocks/*.test.ts`, no padrão MSW já usado em `src/test/`.
