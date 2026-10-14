# 🎨 Design de cores

Este documento registra a paleta já usada pela interface, os tokens semânticos e seu uso por componente e tela. É um guia vivo e pode ser alterado conforme o projeto evolui. O tema visual base permanece inalterado.

## Paleta e tokens

| Papel | Cor | Token CSS | Vuetify equivalente | Quasar |
| --- | --- | --- | --- | --- |
| Primária | `#456b56` | `--color-primary`, `--color-evergreen` | `primary` | `primary` |
| Primária escura | `#365744` | `--color-evergreen-deep` | — | — |
| Sucesso | `#587b61` | `--color-success` | `success` | `positive` |
| Alerta | `#c18a48` | `--color-warning` | `warning` | `warning` |
| Erro | `#a4473e` | `--color-error` | `error` | `negative` |
| Informação | `#557e88` | `--color-info` | `info` | `info` |
| Neutro escuro | `#252a25` | `--color-ink`, `--color-neutral-900` | `on-surface` | `dark` |
| Neutro médio | `#73766e` | `--color-muted`, `--color-neutral-500` | `secondary` | `secondary` |
| Neutro claro | `#f4f2ec` | `--color-canvas`, `--color-neutral-100` | `background` | `background` |
| Névoa | `#edf0e8` | `--color-mist` | — | — |
| Superfície | `#fffefb` | `--color-panel` | `surface` | `background` |
| Foco | `#71987a` | `--color-focus` | — | — |

O frontend usa Quasar 2 e CSS próprio; a coluna Vuetify é apenas uma correspondência semântica, não uma dependência instalada.

## Uso por componente

| Componente | Uso |
| --- | --- |
| Botão primário | Verde primário; mantém contraste branco do tema atual. |
| Ícones de ação | Ver detalhes: informação/azul; editar: alerta/âmbar; excluir: erro/vermelho; ativar: sucesso/verde; desativar: neutro/secondary (`--color-muted`). Cada ação mantém sua cor semântica distinta; ativar e desativar não reutilizam a cor de editar. Ícones de 18 px. |
| Badges | Fundo neutro verde claro e texto evergreen; estado pendente usa alerta. |
| Indicador de status | Ativo: sucesso/verde; desativado: neutro/secondary. A mudança de cor e fundo transiciona sem alterar o espaço ocupado. |
| Toast de sucesso (Quasar Notify) | Fundo `positive`/verde (`#587b61`) e texto branco; `role="status"`. |
| Toast de erro (Quasar Notify) | Fundo `negative`/vermelho (`#a4473e`) e texto branco; `role="status"`. |
| Toast de alerta (Quasar Notify) | Fundo `warning`/âmbar (`#c18a48`) e texto escuro (`#252a25`); `role="status"`. |
| Toast informativo (Quasar Notify) | Fundo `info`/azul (`#557e88`) e texto branco; `role="status"`. Toasts usam duração e posição informadas pela chamada ou padrões do helper. O token `dark` não é usado em toasts. |
| Header | Superfície clara, texto neutro escuro, avatar evergreen. |
| Sidebar | Superfície clara; item selecionado com fundo verde translúcido e texto evergreen. |
| Tooltips | Fundo neutro escuro e texto branco; link em verde claro. |

## Uso por tela

| Tela | Uso |
| --- | --- |
| Users | Ações informativas, de edição, estado e exclusão seguem as cores semânticas acima; perfis usam badges evergreen. Ativar/desativar atualiza o indicador de status com transição e informa sucesso ou falha por toast. |
| Roles | Detalhes informativos, edição âmbar, exclusão vermelha; perfil Administrador protegido mantém indicação neutra. |
| Logs | Consulta de detalhes em azul; tela somente leitura. |
| Detalhes | Superfícies claras, títulos neutros e permissões concedidas em texto neutro escuro. |
| Manual | Fundo claro, links e títulos evergreen, texto auxiliar neutro médio. |
| Login | Fundo canvas, painel branco quente e marca evergreen; campos seguem o tema existente. |
