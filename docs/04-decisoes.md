# 🧭 Decisões

Cada decisão arquitetural explicada com o motivo e a alternativa que foi considerada e rejeitada. Leia este documento antes de propor trocar qualquer uma delas: o custo da alternativa já foi avaliado.

---

## 📑 Índice

1. [Resumo](#-resumo)
2. [Pinia só para UI e sessão](#-pinia-só-para-ui-e-sessão-tanstack-query-para-estado-de-servidor)
3. [MSW em vez de mock manual](#-msw-em-vez-de-mock-manual)
4. [Cliente Orval gerado e pinado](#-cliente-orval-gerado-e-pinado-nunca-escrito-à-mão)
5. [Alias `@/`](#-alias--mais-features-shared-lib)
6. [Arrow functions](#-arrow-functions-como-padrão)
7. [Sem comentários no código](#-sem-comentários-no-código)
8. [Testes em inglês, produto em pt-BR](#-testes-descritos-em-inglês-mensagens-de-produto-em-pt-br)
9. [Cobertura com thresholds](#-cobertura-com-includeexclude-e-thresholds)
10. [nginx com fallback SPA](#-nginx-com-fallback-spa)
11. [E2E fora do repositório](#-e2e-fora-do-repositório-aqui-vitest--smoke-de-navegador)

---

## 📋 Resumo

| Decisão | Motivo em uma linha |
|---|---|
| Pinia só para UI/sessão, Query para servidor | Evita duas fontes de verdade e dá invalidação automática |
| MSW em vez de mock manual | Fidelidade: o pedido real é montado, só a resposta é simulada |
| Cliente Orval gerado e pinado | Contrato como única especificação; zero divergência manual |
| Alias `@/` (mais `@features`, `@shared`, `@lib`) | Refatoração barata e arquitetura visível nas importações |
| Arrow functions como padrão | Uniformidade com setup do Pinia/composables e `this` léxico |
| Sem comentários no código | Comentário envelhece; nomes, tipos e testes carregam a intenção |
| Testes em inglês, mensagens em pt-BR | Separa audiência: devs vs. usuários brasileiros |
| Cobertura com include/exclude e thresholds | Porta de CI real em vez de número decorativo |
| nginx com fallback SPA | Refresh em rota do cliente não pode dar 404 do servidor |
| E2E fora do repo; Vitest + smoke aqui | E2E exige API real; aqui teste rápido a cada mudança |

---

## 🗃️ Pinia só para UI e sessão; TanStack Query para estado de servidor

O Pinia guarda o usuário em memória, filtros locais de tela e estado de interface. Tudo que vem da API e pode mudar no servidor — listagens, detalhe, contagens — passa pela Query, que dá cache por chave, invalidação após mutação e deduplicação de pedidos. O motivo é evitar duas fontes de verdade: se a resposta da API fosse copiada para uma store manual, qualquer mutação precisaria atualizar os dois lugares, e um deles ficaria obsoleto. A alternativa rejeitada foi gerenciar servidor no Pinia com ações manuais de busca — mais código, sem invalidação automática e com risco permanente de tela exibindo dado velho.

---

## 🧪 MSW em vez de mock manual

Os testes interceptam rede com o Mock Service Worker ao nível do protocolo, com servidor registrado em `src/test/setup.ts` e handlers partilhados para HTTP e cenários administrativos. O motivo é fidelidade: o código testado monta URL, cabeçalho CSRF, credenciais e timeout de verdade, e só a resposta é simulada. A alternativa rejeitada foi mockar o axios ou as funções geradas — mais frágil, porque o mock esconderia erros de montagem de pedido e quebraria em silêncio a cada regeneração do cliente.

---

## 🔌 Cliente Orval gerado e pinado, nunca escrito à mão

Tipos, hooks e DTOs vêm do Orval `8.39.0` a partir do contrato aprovado em `openapi/openapi.json`, com pin verificável (origem, commit, execução e resumo criptográfico do artefato). O `client:check` falha se o gerado divergir do revisado, e o `build` roda o `client:check` antes de compilar. O motivo é que o contrato é a única especificação confiável da API: gerar elimina divergência de tipos, nomes de campo e caminhos. A alternativa rejeitada foi escrever chamadas axios à mão por funcionalidade — funcionaria no início, mas cada mudança de contrato viraria caça manual a todos os pontos de uso, sem nada que acusasse o esquecimento.

---

## 📛 Alias `@/` (mais `@features`, `@shared`, `@lib`)

Importações usam `@` para `src` e os atalhos de área, definidos no Vite e espelhados no TypeScript. O motivo é que import relativo profundo (`../../../lib/http`) quebra a cada reorganização de pasta e esconde a arquitetura nas importações. A alternativa rejeitada foi relativo puro — zero configuração, mas refatoração de pastas cara e leitura pior, porque dois arquivos idênticos em pastas distintas geram prefixos diferentes para o mesmo destino.

---

## ➡️ Arrow functions como padrão

Funções são escritas como arrow functions, incluindo composables, utilitários, guardas e o mutador. O motivo é uniformidade com o estilo de setup do Pinia e dos composables do Vue, onde closures sobre `ref` e `computed` são a norma, além de `this` léxico previsível. A alternativa rejeitada foi declaração `function` convivendo com arrows — válida em TypeScript, mas dois estilos no mesmo módulo geram discussão de estilo a cada revisão sem ganho de comportamento.

---

## 💬 Sem comentários no código

O código não leva comentários: nomes, tipos e testes carregam a intenção. Quando a explicação é necessária, ela mora nestes documentos, não espalhada em trechos que envelhecem. O motivo é manutenção — comentário desatualizado mente com autoridade, enquanto código legível e teste nomeado envelhecem juntos. A alternativa rejeitada foi comentar fluxos complexos (CSRF, guards, bootstrap) inline — ajuda na primeira leitura, mas cada refatoração precisaria atualizar dois lugares, e o segundo é sempre esquecido.

---

## 🌍 Testes descritos em inglês, mensagens de produto em pt-BR

Os blocos `describe`/`it` e os nomes de teste são em inglês (por exemplo, `"csrf bootstrap flow"`, `"typed error mapping"`), enquanto todas as mensagens exibidas ao usuário são em pt-BR via dicionário fixo de mensagens seguras. O motivo é separar audiência: teste é lido por desenvolvedores em convenção internacional de tooling, mensagem é lida por usuários brasileiros. A alternativa rejeitada foi tudo em um idioma só — testes em pt-BR isolariam colaboradores, e mensagens em inglês entregariam produto na língua errada.

---

## 📊 Cobertura com include/exclude e thresholds

A cobertura v8 mede `src/**/*.ts` e `src/**/*.vue`, excluindo o gerado pelo Orval, utilitários de teste e os próprios testes, com mínimos de 87% linhas, 83% funções, 80% ramos e 87% instruções. O motivo de cada parte: medir `src` inteiro impede áreas sem teste; excluir o gerado evita inflar o número com código que não se escreve nem se testa diretamente; thresholds numéricos transformam cobertura em porta de CI em vez de curiosidade. A alternativa rejeitada foi cobertura sem excluir gerado e sem mínimos — número alto e inútil, que cai em silêncio a cada PR.

---

## 🌐 nginx com fallback SPA

O nginx de produção serve `index.html` para qualquer caminho desconhecido (`try_files ... /index.html`), com cache imutável de um ano em `/assets/`, cabeçalhos de segurança e gzip. O motivo do fallback é o roteamento do lado do cliente: rotas como `/users` não existem como arquivos, então sem o fallback o refresh nessas páginas daria 404 do servidor. A alternativa rejeitada foi renderização no servidor ou pré-render de rotas — complexidade operacional e de cache para uma SPA administrativa que não precisa de SEO.

---

## 🧭 E2E fora do repositório; aqui Vitest + smoke de navegador

Não há Cypress ou Playwright neste repositório: a pirâmide local é Vitest com MSW para comportamento mais um smoke em Chrome headless real que prova ausência de tráfego externo. O motivo é custo-benefício — E2E completo exige ambiente com API de verdade e dados controlados, o que pertence a uma camada de entrega, não ao ciclo de desenvolvimento do frontend. A alternativa rejeitada foi suíte E2E local com API real — testes lentos, frágeis a estado compartilhado e quebrando o `npm test` rápido que o desenvolvedor roda a cada mudança.
