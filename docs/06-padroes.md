# 🧱 Padrões: o que usamos, onde vive e o que evitamos

Catálogo dos padrões do frontend no formato onde vive → ganho → limite. As
decisões com alternativa rejeitada estão em [04-decisoes](04-decisoes.md); aqui
está o mapa de aplicação. Exemplos são trechos do código real.

## 📑 Índice

1. [Fatia de feature — anatomia](#-fatia-de-feature--anatomia)
2. [Servidor na Query, sessão e UI no Pinia](#-servidor-na-query-sessão-e-ui-no-pinia)
3. [Fronteira do gerado](#-fronteira-do-gerado)
4. [Transporte único e erros tipados](#-transporte-único-e-erros-tipados)
5. [Descritores de rota como fonte única](#-descritores-de-rota-como-fonte-única)
6. [Componentes compartilhados presentacionais](#-componentes-compartilhados-presentacionais)
7. [Mock no nível do protocolo](#-mock-no-nível-do-protocolo)
8. [Explicitamente não](#-explicitamente-não)

---

## 🧩 Fatia de feature — anatomia

**Onde vive:** `src/features/users/` — `api/users.api.ts` + `api/users.types.ts`,
`composables/useUsersList.ts`, `pages/UsersPage.vue` + `UserDetailPage.vue`,
`utils/cpf-mask.ts`, `README.md` por feature.

**Ganho.** Cada feature é dona do seu pedaço: chamada tipada, estado de servidor,
tela e util dono moram lado a lado. Recurso novo repete o molde; nada vaza para
`shared` antes de ter 2+ usos reais.

**Limite.** `auth` é o único com `stores` (sessão é transversal); `logs` é só
leitura; `manual` é conteúdo sem API. Regra de feature nunca mora em `shared` —
`shared` é apresentação e utilidade sem regra de negócio.

## 🔄 Servidor na Query, sessão e UI no Pinia

**Onde vive:** `useUsersList` — chave inclui os filtros, `keepPreviousData` na
troca de página, mutações invalidam as chaves no `onSuccess`:

```ts
queryKey: computed(() => [USERS_QUERY_KEY, { ...filters }]),
placeholderData: keepPreviousData,
```

```ts
const invalidate = async (): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
  await queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
};
```

**Ganho.** Uma fonte de verdade por dado: cache, deduplicação e refetch pós-mutação
vêm do framework. Sem retry nem refetch no foco — a SPA nunca dispara tráfego que
o usuário não pediu. Logout esvazia a cache de uma vez.

**Limite.** Resposta da API nunca é copiada para store manual. Filtro de tela é
`reactive` local no composable, não estado global.

## 🔌 Fronteira do gerado

**Onde vive:** `src/lib/api/generated/` (propriedade do Orval, cabeçalho proíbe
edição) + wrappers finos em `features/*/api/*.api.ts` sobre `transportApi`.

```ts
export const listUsers = (filters: UserFilters = {}): Promise<Paginated<AdminUser>> => {
  return transportApi<Paginated<AdminUser>>({
    url: "/api/v1/users", method: "GET", params: omitEmpty(filters),
  });
};
```

**Ganho.** Tipos vêm do contrato pinado (`client:check` barra divergência no
`build`); o wrapper da feature dá nome, params limpos (`omitEmpty`) e tipos de
domínio (`AdminUser`, `UserFilters`).

**Limite.** Nunca editar `generated/`, nunca chamar axios direto contornando o
mutador (perde origem pinada, CSRF e erro tipado).

## 🛡️ Transporte único e erros tipados

**Onde vive:** `src/lib/http/` — `orval-mutator.ts` (`transportApi`), `client.ts`,
`error-*.ts`, `user-messages.ts` (dicionário pt-BR de mensagens seguras).

**Ganho.** Toda chamada passa pelo mesmo ponto: origem validada e imutável,
`withCredentials` + CSRF, sinal de aborto, 401/419 virando sessão expirada e 403
virando `HttpError` com mensagem fixa — nunca detalhe do servidor na tela.

**Limite.** Mensagem de produto só via dicionário; texto novo de erro exige entrada
nele, não string solta no componente.

## 🧭 Descritores de rota como fonte única

**Onde vive:** `src/app/router/descriptors.ts` — caminho, componente lazy
(`() => import(...)`), `meta` (auth, guest, permissão, allowLimited) e `nav`.

**Ganho.** Guard, menu (`useAuthorization` deriva `APP_NAV_ITEMS` dos descritores)
e code-split por rota leem a mesma tabela. Rota nova é uma entrada, não três
edições.

**Limite.** Guard esconde e organiza; quem autoriza é a API. UI sem a permissão
nunca chama o endpoint, mas o 403 da rede continua tratado.

## 🧱 Componentes compartilhados presentacionais

**Onde vive:** `src/shared/components/` (`AdminPageLayout`, `BackButton`,
`RoleMultiSelect`, `SearchInput`, `Pagination`...), `src/shared/composables/`
(`useDebouncedSearch`, `useFormFeedback`, `usePageSelection`).

**Ganho.** Moldura e comportamento de tela repetidos viram prop (`eyebrow`,
`title`, `backFallback?`): `BackButton` só existe atrás de `back-fallback`, só em
detalhe.

**Limite.** Componente compartilhado não busca dado nem conhece feature; dado
entra por prop/slot. Composable compartilhado não importa store de feature.

## 🧪 Mock no nível do protocolo

**Onde vive:** `src/mocks/` (handlers, cenários, dados) + `src/test/setup.ts`
(servidor MSW) + `VITE_MOCK_API=1` (`dev:mock`, cenários via `?mock=`).

**Ganho.** O código monta URL, CSRF e timeout de verdade; só a resposta é
simulada. Mesmos handlers servem teste e desenvolvimento sem backend.

**Limite.** Mock não substitui validação contra a API real nem cobre divergência
de contrato (isso é `client:check` + smoke).

## 🚫 Explicitamente não

| Pattern | Por que não aqui |
| --- | --- |
| Servidor no Pinia | Duas fontes de verdade; sem invalidação automática (ver 04-decisoes) |
| Axios à mão por feature | Contorna mutador, CSRF e erro tipado; caça manual a cada contrato |
| Editar `generated/` | `client:check` barra; regeneração apaga |
| Token em `localStorage` | Sessão é cookie `HttpOnly`; nada persiste no navegador (ver 03-arquitetura) |
| Barramento global de eventos | Comunicação é prop/emits para baixo e Query invalidada para dado de servidor |
| Store por entidade espelhando a API | `users`/`roles` vivem na Query por chave; store só para sessão e UI |
| E2E neste repo | Vitest + MSW + smoke de navegador; E2E exige API real (ver 04-decisoes) |
