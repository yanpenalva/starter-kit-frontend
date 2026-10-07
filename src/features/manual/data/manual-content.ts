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
      "O Starter Kit é o painel administrativo com contas, papéis, permissões e trilha de auditoria. O caminho inicial é sempre o mesmo:",
    items: [
      "Crie sua conta em “Criar conta”, informando nome, e-mail e uma senha de pelo menos 12 caracteres. O CPF é opcional.",
      "Abra o e-mail de confirmação e clique no link para ativar a conta. Enquanto isso, o painel mostra a tela de verificação e o selo “Pendente”.",
      "Entre com e-mail e senha. Depois da confirmação, você passa a ver os menus liberados pelas suas permissões.",
      "Se algum menu não aparecer, sua conta ainda não recebeu a permissão correspondente. Peça a um administrador para atribuí-la em “Papéis”.",
    ],
  },
  {
    id: "login-e-perfis",
    title: "Login e perfis",
    summary:
      "O acesso é feito por sessão autenticada, com cookies de segurança. Toda ação administrativa só é liberada para contas confirmadas e autorizadas.",
    items: [
      "Entrar: informe e-mail e senha. Após cinco tentativas incorretas seguidas, o serviço bloqueia novas tentativas por alguns instantes.",
      "Esqueci a senha: em “Recuperar senha”, informe o e-mail cadastrado. Por segurança, a resposta é sempre a mesma, exista ou não a conta, para não revelar quem está registrado.",
      "Redefinir senha: abra o link recebido por e-mail e defina uma nova senha. Depois você volta ao login com uma confirmação na tela.",
      "Confirmar e-mail: o link de verificação ativa a conta. Se o prazo expirar, use “Reenviar confirmação” na tela de verificação.",
      "Papéis: “admin” administra contas, papéis e permissões; “user” usa o painel com as permissões concedidas.",
      "Permissões: cada tela administrativa exige uma permissão própria, como users.view, roles.view ou logs.view. Um usuário pode ter roles.view sem ser administrador.",
      "Sessão expirada: quando o serviço responde que a sessão não é mais válida, você volta ao login e precisa entrar de novo. Nenhuma alteração pendente é reaplicada automaticamente.",
    ],
  },
  {
    id: "usuarios",
    title: "Gestão de usuários",
    summary:
      "A tela “Usuários” lista as contas da plataforma e permite ajustar nome, papéis e status. Ela exige a permissão users.view.",
    items: [
      "Busca: filtra por nome, e-mail ou CPF. A busca reinicia a listagem na primeira página.",
      "Filtros de status e papel: “Ativos” mostra contas em uso; “Desativados” mostra contas bloqueadas. O filtro de papel separa administradores de usuários comuns.",
      "Editar nome: altere o campo na linha e clique em “Salvar nome”. Requer users.update.",
      "Atribuir papéis: informe os papéis separados por vírgula, por exemplo “admin, user”, e clique em “Salvar papéis”. Requer users.assign-roles.",
      "Ativar e desativar: o botão alterna o status da conta. Requer users.set-status.",
      "Proteções: você não pode desativar a própria conta nem remover o último administrador ativo; o serviço recusa a operação e explica o motivo na tela.",
      "CPF: aparece mascarado para quem tem users.read-cpf e fica oculto para os demais. Ao editar, informe os 11 dígitos com dígitos verificadores válidos.",
    ],
  },
  {
    id: "papeis-permissoes",
    title: "Gestão de papéis e permissões",
    summary:
      "A tela “Papéis” mostra a matriz de permissões de cada papel. Ela exige a permissão roles.view e a edição exige roles.update-permissions.",
    items: [
      "Marque ou desmarque as permissões do papel e clique em “Salvar permissões”.",
      "O papel “admin” é imutável: os campos ficam desabilitados para impedir que o painel perca o acesso de administração.",
      "As permissões disponíveis cobrem contas, papéis, auditoria e leitura de CPF; cada uma é aplicada também pelo servidor, não apenas pela interface.",
      "Depois de salvar, os usuários com aquele papel passam a ver os menus correspondentes no próximo login ou recarregamento da sessão.",
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria",
    summary:
      "A tela “Auditoria” registra quem alterou o quê. Ela exige a permissão logs.view e é somente leitura.",
    items: [
      "Evento: mostra o tipo da ação, como criação, atualização ou exclusão lógica.",
      "Descrição: resume a alteração registrada, com os campos afetados.",
      "Entidade: identifica o tipo e o número do registro alterado.",
      "Data: exibida no formato brasileiro, com dia, mês, ano, hora e minuto.",
      "Os registros não podem ser editados nem apagados pela interface.",
    ],
  },
  {
    id: "filtros-e-paginacao",
    title: "Filtros e paginação",
    summary:
      "As telas administrativas usam o mesmo padrão de filtros e paginação, para você saber sempre onde está e o que está vendo.",
    items: [
      "A listagem é paginada; o rodapé mostra “Página X de Y” e os botões “Anterior” e “Próxima”.",
      "Ao mudar qualquer filtro, a listagem volta para a primeira página.",
      "Filtros vazios são ignorados pelo servidor, então “Todos” sempre traz o conjunto completo.",
      "“Nenhum registro encontrado” significa que os filtros atuais não têm resultado; limpe os filtros para ver a listagem completa.",
    ],
  },
];

export const MANUAL_FAQ: readonly ManualFaq[] = [
  {
    question: "Por que não vejo o menu “Usuários”?",
    answer:
      "A sua conta não tem a permissão users.view. Peça a um administrador para conceder essa permissão na tela “Papéis”.",
  },
  {
    question: "Por que a minha conta aparece como “Pendente”?",
    answer:
      "O e-mail ainda não foi confirmado. Abra o link enviado no cadastro ou use “Reenviar confirmação” na tela de verificação.",
  },
  {
    question: "Quanto tempo dura a sessão? Por que ela expira?",
    answer:
      "A sessão tem duração limitada e pode expirar por inatividade, conforme a configuração do servidor. O encerramento automático existe por segurança, para que uma sessão esquecida aberta não permaneça válida por tempo indeterminado. Ao expirar, as proteções de rota redirecionam para o login e as alterações que ainda não foram enviadas não são reenviadas automaticamente. Para renovar, entre novamente com e-mail e senha; depois do login, você retorna à tela solicitada quando houver redirecionamento.",
  },
  {
    question: "A sessão expirou. Perdi o que estava fazendo?",
    answer:
      "Entre novamente para continuar. Alterações que não foram enviadas não são reenviadas automaticamente, então revise os dados antes de repetir a operação.",
  },
  {
    question:
      "Por que não consigo desativar um usuário ou retirar os papéis dele?",
    answer:
      "O serviço impede desativar a própria conta e remover o último administrador ativo, para o painel não ficar sem acesso. A tela mostra o motivo retornado pelo servidor.",
  },
  {
    question: "Por que o CPF aparece mascarado?",
    answer:
      "O CPF é dado pessoal. Ele só é exibido para contas com a permissão users.read-cpf; as demais veem a listagem sem esse campo.",
  },
  {
    question: "Muitas tentativas aparecem como erro. O que fazer?",
    answer:
      "O serviço limita tentativas repetidas em pouco tempo. Aguarde o tempo indicado na mensagem e tente novamente.",
  },
];
