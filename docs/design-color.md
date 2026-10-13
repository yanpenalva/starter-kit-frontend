# Design de cores

Este documento registra a paleta já usada pela interface e os tokens semânticos aplicados às ações. O tema visual base permanece inalterado.

## Paleta e tokens

| Papel | Cor | Token CSS | Vuetify equivalente | Quasar |
| --- | --- | --- | --- | --- |
| Primária | `#456b56` | `--color-primary`, `--color-evergreen` | `primary` | `primary` |
| Sucesso | `#587b61` | `--color-success` | `success` | `positive` |
| Alerta | `#c18a48` | `--color-warning` | `warning` | `warning` |
| Erro | `#a4473e` | `--color-error` | `error` | `negative` |
| Informação | `#557e88` | `--color-info` | `info` | `info` |
| Neutro escuro | `#252a25` | `--color-ink`, `--color-neutral-900` | `on-surface` | `dark` |
| Neutro médio | `#73766e` | `--color-muted`, `--color-neutral-500` | `secondary` | `secondary` |
| Neutro claro | `#f4f2ec` | `--color-canvas`, `--color-neutral-100` | `background` | `background` |
| Superfície | `#fffefb` | `--color-panel` | `surface` | `background` |

O frontend usa Quasar 2 e CSS próprio; a coluna Vuetify é apenas uma correspondência semântica, não uma dependência instalada.

## Uso por componente

| Componente | Uso |
| --- | --- |
| Botão primário | Verde primário; mantém contraste branco do tema atual. |
| Ícones de ação | Ver detalhes: informação/azul; editar: alerta/âmbar; excluir: erro/vermelho; ativar: sucesso/verde; desativar: alerta/âmbar. Ícones de 18 px. |
| Badges | Fundo neutro verde claro e texto evergreen; estado pendente usa alerta. |
| Header | Superfície clara, texto neutro escuro, avatar evergreen. |
| Sidebar | Superfície clara; item selecionado com fundo verde translúcido e texto evergreen. |
| Tooltips | Fundo neutro escuro e texto branco; link em verde claro. |

## Uso por tela

| Tela | Uso |
| --- | --- |
| Users | Ações informativas, de edição, estado e exclusão seguem as cores semânticas acima; perfis usam badges evergreen. |
| Roles | Detalhes informativos, edição âmbar, exclusão vermelha; perfil Administrador protegido mantém indicação neutra. |
| Logs | Consulta de detalhes em azul; tela somente leitura. |
| Detalhes | Superfícies claras, títulos neutros e permissões concedidas em texto neutro escuro. |
| Manual | Fundo claro, links e títulos evergreen, texto auxiliar neutro médio. |
| Login | Fundo canvas, painel branco quente e marca evergreen; campos seguem o tema existente. |
