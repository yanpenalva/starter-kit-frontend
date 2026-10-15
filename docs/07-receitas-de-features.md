# 🧭 Receitas de features: quero fazer X, por onde parto

Como seria em cima da arquitetura atual, arquivo a arquivo e na ordem. O processo
(TDD, gates, contrato) segue o mesmo espírito da API; aqui está o **mapa**.
Padrões e limites em [06-padroes](06-padroes.md).

Checklist comum: fatia mínima observável → teste MSW que falha → menor
implementação → `npm run test -- <arquivo>`, `typecheck`, `lint` → contrato se
endpoint mudou (`client:generate` + `client:check`) → thresholds de cobertura
seguem fechando (87% linhas, 83% funções, 80% ramos, 87% instruções).

---

## A. Feature CRUD nova (espelha `users`)

| # | Arquivo | Papel |
| --- | --- | --- |
| 1 | `src/features/<x>/api/<x>.types.ts` | tipos de domínio + filtros (não os gerados crus) |
| 2 | `src/features/<x>/api/<x>.api.ts` | wrappers finos sobre `transportApi` (GET/POST/PATCH/DELETE) |
| 3 | `src/features/<x>/composables/use<X>List.ts` | `useQuery` com chave `[KEY, {...filtros}]` + `useMutation` invalidando no `onSuccess` |
| 4 | `src/features/<x>/pages/<X>Page.vue` | `AdminPageLayout` + componentes shared; sem fetch direto |
| 5 | `src/app/router/descriptors.ts` | rota lazy (`() => import(...)`) + `meta` de permissão + `nav` |
| 6 | `src/mocks/mock-handlers.ts` + `mock-data.ts` | respostas para teste e `dev:mock` |
| 7 | `*.test.ts` ao lado de cada arquivo | MSW: monta pedido de verdade, só resposta simulada |

**Armadilhas.** Guard sem permissão no backend correspondente = tela que nunca
abre; `queryKey` sem os filtros = troca de filtro mostrando dado velho; mutação
sem `invalidate` = tela obsoleta até F5.

## B. Página nova em feature existente

1. `pages/<X>Page.vue` + teste MSW.
2. Entrada em `descriptors.ts` (lazy + meta + nav se aparece no menu).
3. Reuso primeiro: `AdminPageLayout`, `SearchInput`, `Pagination`,
   `useDebouncedSearch`, `usePageSelection` — componente novo só com 2+ usos.

## C. Mutação nova (criar, status, papéis)

1. Função em `api/<x>.api.ts` com tipos gerados no payload.
2. `useMutation` no composable da feature com `invalidate()` das chaves afetadas.
3. Feedback via `useFormFeedback` + `FieldErrors`; mensagens pelo dicionário
   `user-messages.ts`.
4. Teste: sucesso invalida e relista; 403 vira mensagem fixa; 422 marca campos.

## D. Componente compartilhado novo

1. Só com 2+ usos confirmados — o segundo uso paga a abstração.
2. `src/shared/components/<X>.vue` presentacional (props/slots, sem fetch nem
   store de feature) + `*.test.ts`.
3. Comportamento de tela repetido vira `src/shared/composables/` no mesmo molde.

## E. Mudança de contrato (endpoint novo ou campo novo)

1. Atualize `openapi/openapi.json` pelo fluxo oficial (pin + receipt).
2. `npm run client:generate` e confira `client:check` verde — nunca edite
   `src/lib/api/generated/` à mão.
3. Ajuste wrappers e tipos de domínio; rode a suíte da feature (tipos mudam,
   testes acusam).
4. Campo sensível novo: exponha na tela só sob a permissão correspondente,
   espelhando o backend.

## F. Rota protegida / item de menu novo

1. Entrada em `descriptors.ts` com `meta.permissions`/`roles` + `nav` —
   `useAuthorization` deriva o menu sozinho.
2. Sessão limitada: marque `allowLimited` só se a rota faz sentido sem e-mail
   verificado (`/manual`, `/limited`); o resto redireciona.
3. Anônimo cai no login com `redirect`; sem credencial, `/403` com motivo.

---

## 🗺️ Como partir, em 5 passos

1. Descreva a fatia em uma frase observável ("gestor com `users.view` lista,
   filtra e pagina usuários") e liste permissão, estados e erros.
2. Comece pelo teste MSW da página (vermelho primeiro).
3. Implemente de dentro para fora: `api` → composable → página → descritor →
   mocks.
4. Rode focado (`vitest` no arquivo), depois `typecheck` + `lint`.
5. Revise o diff: só a fatia, sem camada "para o futuro" ([06-padroes](06-padroes.md)
   diz o que não construir).
