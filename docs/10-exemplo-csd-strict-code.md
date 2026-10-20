# Exemplo: handoff entre CSD e strict-code

Este fluxo é ilustrativo; não implementa uma feature. CSD conduz o trabalho e
registra evidências. strict-code fornece critérios de engenharia. A documentação
do projeto e sua configuração continuam sendo a fonte dos fatos locais.

## 1. CSD estrutura o escopo

Para uma nova busca paginada de usuários, CSD classifica a solicitação, escolhe
o contexto necessário e organiza descoberta, especificação, plano e gates. O PO
humano aprova problema, público, resultado esperado e critérios de aceitação;
CSD registra essa aprovação e acompanha o trabalho. CSD não inventa requisitos
nem substitui a decisão humana.

O plano aponta para a arquitetura local e para o contrato OpenAPI. Se o endpoint
ou seus campos mudarem, a especificação identifica essa mudança e seus critérios
de aceitação. Engenharia implementa apenas o escopo aprovado.

## 2. Handoff de engenharia

Na revisão, strict-code é a fonte pretendida dos critérios de implementação,
qualidade, segurança de engenharia e revisão. Ele consome a classificação, a
especificação aprovada, a arquitetura local e as evidências dos checks. Um risco
de engenharia volta ao fluxo CSD para reclassificação ou esclarecimento; não
altera o escopo aprovado por conta própria.

Esta instalação ainda distribui a política legada
`.context/policies/core/code-quality.md`, que mistura workflow e critérios de
engenharia. A separação acima descreve o destino de responsabilidade; a política
legada permanece instalada até uma migração upstream. Identidade e instalação
de strict-code neste repositório: **NOT FOUND**. Este exemplo não afirma que a
skill está instalada nem duplica seus critérios.

## 3. Checks configurados

Os workflows são gates configurados; esta tabela não afirma que foram executados
para um trabalho específico.

| Workflow | Comandos, na ordem configurada |
| --- | --- |
| Frontend (`frontend-checks.yml`) | `npm run format:check` → `npm run lint` → `npm run typecheck` → `npm run test:coverage` → `npm run build` |
| Cliente de contrato (`contract-client.yml`) | `npm run format:check` → `npm run lint` → `npm run client:check` → `npm run typecheck` → `npm test` → `npm run build` → `python3 scripts/validate_context.py --strict --examples` → `python3 -m unittest discover -s tests -v` → `npx --yes @owlcodium/context-spec-develop@1.2.1 doctor --scope project` |

O build também executa `client:check`, `vue-tsc --noEmit` e `vite build`.
`client:check` valida e regenera o cliente de forma determinística. Os limites
medidos de cobertura são 87% linhas, 83% funções, 80% ramos e 87% instruções.
Complexidade e duplicação não têm limites configurados: **NOT FOUND**.

`npm run smoke:browser` é um check local que requer servidor Vite e Chrome; não
faz parte desses workflows de CI. Sua execução, se necessária, é registrada como
evidência separada. Hooks locais não substituem os checks de CI. Métricas de
engenharia além dos limites de cobertura: **NOT FOUND**.

## 4. Evidência e conclusão

CSD registra comandos e resultados observados no item de trabalho e agenda a
revisão de engenharia. Check configurado não significa check executado; resultado
ausente permanece desconhecido. Revisão técnica não aprova escopo de produto nem
autoriza release: aceitação e progressão seguem os gates humanos e locais.

Fontes locais: [qualidade e comandos](../.context/project/quality.md),
[checks de frontend](../.github/workflows/frontend-checks.yml),
[checks do cliente](../.github/workflows/contract-client.yml) e
[receitas de features](07-receitas-de-features.md).
