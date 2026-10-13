export interface ManualSection {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export interface ManualFaq {
  question: string;
  answer: string;
}

export const MANUAL_SECTIONS: readonly ManualSection[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    summary:
      "Use o Início para acessar as áreas disponíveis para sua conta, sua página Minha Conta e este Manual.",
    items: [
      "Crie sua conta em “Criar conta”, informando nome, e-mail e uma senha de pelo menos 12 caracteres. O CPF é opcional no cadastro.",
      "Confirme o endereço pelo link enviado por e-mail. Enquanto a confirmação estiver pendente, a sessão fica limitada e permite acessar a verificação e o Manual.",
      "Entre com e-mail e senha. Se a tela solicitar uma verificação adicional, siga as instruções apresentadas para concluir o acesso.",
      "Os atalhos administrativos aparecem conforme as permissões da sua conta. Se uma área não estiver disponível, peça acesso a um administrador.",
      UI_HELP_TEXT.immutableRole,
    ],
  },
  {
    id: "login-e-perfis",
    title: "Acesso, conta e perfis",
    summary:
      "A autenticação usa uma sessão segura. As permissões da sua conta determinam quais áreas administrativas você pode abrir.",
    items: [
      "Em Minha Conta, consulte seu e-mail, situação de verificação, perfis atribuídos e permissões. Os detalhes de perfis e permissões abrem em janelas próprias.",
      "A página Minha Conta permite atualizar o nome e alterar a senha. A senha atual é solicitada para a troca.",
      "Em “Ver sessões ativas”, confira os dispositivos conectados e encerre sessões que não reconhece.",
      "Perfis agrupam permissões. Uma conta pode ter mais de um perfil, e as permissões disponíveis são a união dos acessos concedidos.",
      "Se o acesso solicitar código de autenticação, use o código do aplicativo ou um código de recuperação. A página Minha Conta não configura esse recurso.",
      "Use “Esqueci a senha” na tela de login para solicitar a redefinição. A mensagem não revela se um endereço está cadastrado.",
    ],
  },
  {
    id: "usuarios",
    title: "Usuários",
    summary:
      "A área Usuários permite consultar contas e, conforme as permissões disponíveis, criar, editar ou alterar seu estado.",
    items: [
      "Use a busca para localizar pelo nome ou e-mail. A busca não pesquisa CPF.",
      "Os filtros permitem restringir a lista por situação e perfil. Alterar busca ou filtro volta à primeira página.",
      "Criar e editar usuários acontece em janelas. Na edição, selecione perfis pelo seletor múltiplo; a seleção pode incluir mais de um perfil.",
      "A criação da conta e a atribuição de perfis podem ser etapas separadas. Depois, abra a edição do usuário para ajustar os perfis disponíveis para sua autorização.",
      "A lista é paginada. “Itens por página” altera quantos registros são exibidos em cada página.",
      "Ações nas linhas usam ícones; cada botão tem um nome acessível que identifica a ação e a conta correspondente.",
      "O serviço impede desativar a própria conta e remover o último administrador ativo. A interface mostra a resposta quando uma regra bloqueia a ação.",
    ],
  },
  {
    id: "papeis-permissoes",
    title: "Perfis e permissões",
    summary:
      "A área Perfis exibe os perfis disponíveis e as permissões em português, organizadas por assunto.",
    items: [
      "Use a busca para localizar pelo nome do perfil; permissões não fazem parte da busca. A lista permite escolher quantos itens aparecem por página.",
      "Criar perfil e consultar detalhes abrem janelas. Na edição de permissões, selecione tudo de um grupo ou todas as permissões do catálogo.",
      "Perfis personalizados podem ser renomeados. O nome duplicado é informado no campo; os nomes Administrador e Usuário são reservados.",
      "O perfil Administrador não pode ser renomeado, excluído nem ter permissões alteradas. Um perfil atribuído a usuários não pode ser excluído; a interface informa esse motivo quando o servidor recusa a ação.",
      "A disponibilidade de cada ação depende da autorização da sua conta. A interface e o servidor aplicam essas restrições.",
      "Os ícones das ações têm nomes acessíveis para que seja possível identificar a operação antes de selecioná-la.",
      Object.values(UI_HELP_TEXT).join(" "),
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria",
    summary:
      "A área Auditoria permite consultar eventos registrados e é somente leitura.",
    items: [
      "Use os filtros de busca, ação, evento e tipo de entidade para localizar registros. A busca e os filtros podem ser combinados.",
      "A descrição resume o evento registrado. Abra os detalhes para consultar as informações disponíveis daquele registro.",
      "As datas são exibidas no formato brasileiro. Os registros não podem ser editados ou apagados pela interface.",
      "A lista é paginada; use os controles ao final para mudar de página e, quando disponível, escolher itens por página.",
      "Os botões de detalhes usam ícones com nomes acessíveis.",
    ],
  },
  {
    id: "filtros-e-paginacao",
    title: "Busca e paginação",
    summary:
      "As listas mantêm seus resultados durante atualizações e oferecem controles para navegar pelos registros.",
    items: [
      "Na lista de usuários, a busca combina nome ou e-mail; ela não pesquisa CPF. Na lista de perfis, a busca considera o nome do perfil.",
      "Ao alterar busca ou filtro, a lista volta à primeira página. Use “Itens por página” para ajustar o tamanho da página quando esse controle estiver disponível.",
      "“Nenhum registro encontrado” significa que não há resultado para os filtros atuais. Limpe a busca ou os filtros para consultar a lista novamente.",
      "Ações representadas por ícones têm nomes acessíveis, disponíveis para leitores de tela e como identificação do botão.",
    ],
  },
];

export const MANUAL_FAQ: readonly ManualFaq[] = [
  {
    question: "Por que não vejo o menu “Usuários” ou “Perfis”?",
    answer:
      "Os menus administrativos aparecem conforme as permissões da conta. Peça a um administrador para verificar se o acesso necessário foi atribuído ao seu perfil.",
  },
  {
    question: "Por que minha conta aparece como “Pendente”?",
    answer:
      "O e-mail ainda não foi confirmado. Abra o link enviado no cadastro ou use “Reenviar e-mail” na tela de verificação.",
  },
  {
    question: "Quanto tempo dura a sessão?",
    answer:
      "Você permanece conectado por uma sessão mantida pelo servidor. Por padrão, ela dura 120 minutos; um administrador pode configurar outro prazo.",
  },
  {
    question: "A sessão terminou. O que faço com alterações não enviadas?",
    answer:
      "Entre novamente e revise o que estava preenchendo. Alterações que não chegaram a ser enviadas ao serviço não são reaplicadas automaticamente.",
  },
  {
    question: "Como encontro uma conta de usuário?",
    answer:
      "Na lista de usuários, busque pelo nome ou e-mail. A busca não inclui CPF; você também pode combinar a busca com os filtros disponíveis.",
  },
  {
    question: "Por que uma alteração em usuário ou perfil foi recusada?",
    answer:
      "A operação pode exigir uma permissão que sua conta não tem ou ser bloqueada por uma proteção, como impedir a desativação da própria conta ou a remoção do último administrador ativo. A mensagem na tela informa o motivo retornado pelo serviço.",
  },
  {
    question: "O que fazer se muitas tentativas forem limitadas?",
    answer:
      "O serviço limita tentativas dentro de uma janela de tempo. Aguarde o intervalo indicado na mensagem e tente novamente.",
  },
];
import { UI_HELP_TEXT } from "@/shared/utils/ui-help";
