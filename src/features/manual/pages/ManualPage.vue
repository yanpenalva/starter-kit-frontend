<template>
  <AppLayout>
    <article class="manual">
      <header class="manual__header">
        <p class="manual__eyebrow">AJUDA</p>
        <h1 class="manual__title">Manual de uso</h1>
        <p class="manual__lead">
          Guia rápido do Starter Kit: o que cada tela faz, o que você precisa
          para acessá-la e o que fazer quando algo não sai como esperado.
        </p>
      </header>

      <nav class="manual__toc" aria-label="Seções do manual">
        <h2 class="manual__toc-title">Nesta página</h2>
        <ul class="manual__toc-list">
          <li v-for="section in MANUAL_SECTIONS" :key="section.id">
            <a :href="`#${section.id}`">{{ section.title }}</a>
          </li>
        </ul>
      </nav>

      <section
        v-for="section in MANUAL_SECTIONS"
        :id="section.id"
        :key="section.id"
        class="manual__section"
        :aria-labelledby="`${section.id}-title`"
      >
        <h2 :id="`${section.id}-title`" class="manual__section-title">
          {{ section.title }}
        </h2>
        <p class="manual__paragraph">{{ section.summary }}</p>
        <ul class="manual__steps">
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="manual__section" aria-labelledby="duvidas-title">
        <h2 id="duvidas-title" class="manual__section-title">
          Perguntas frequentes
        </h2>
        <dl class="manual__faq">
          <template v-for="faq in MANUAL_FAQ" :key="faq.question">
            <dt class="manual__faq-question">{{ faq.question }}</dt>
            <dd class="manual__faq-answer">{{ faq.answer }}</dd>
          </template>
        </dl>
      </section>
    </article>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/shared/layouts/AppLayout.vue";

interface ManualSection {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

interface ManualFaq {
  question: string;
  answer: string;
}

const MANUAL_SECTIONS: readonly ManualSection[] = [
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

const MANUAL_FAQ: readonly ManualFaq[] = [
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
    question: "A sessão expirou. Perdi o que estava fazendo?",
    answer:
      "Entre novamente para continuar. Alterações que não foram enviadas não são reenviadas automaticamente, então revise os dados antes de repetir a operação.",
  },
  {
    question: "Por que não consigo desativar um usuário ou retirar os papéis dele?",
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
</script>

<style scoped>
.manual {
  display: flex;
  max-width: 48rem;
  flex-direction: column;
  gap: 2rem;
}

.manual__header {
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  padding-bottom: 1rem;
}

.manual__eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.manual__title {
  margin: 0 0 0.5rem;
  color: var(--color-ink, #252b25);
  font-family: var(--type-display, inherit);
  font-size: 2rem;
  font-weight: 400;
}

.manual__lead {
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.manual__toc {
  padding: 1rem 1.25rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.5rem;
  background: rgb(49 72 48 / 4%);
}

.manual__toc-title {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-evergreen, #314830);
}

.manual__toc-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.manual__toc-list a {
  color: var(--color-evergreen, #314830);
  font-size: 0.875rem;
}

.manual__section {
  scroll-margin-top: 1rem;
}

.manual__section-title {
  margin: 0 0 0.5rem;
  color: var(--color-ink, #252b25);
  font-size: 1.25rem;
  font-weight: 600;
}

.manual__paragraph {
  margin: 0 0 0.75rem;
  color: var(--color-ink, #252b25);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.manual__steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
  line-height: 1.6;
}

.manual__faq {
  margin: 0;
}

.manual__faq-question {
  margin-top: 1rem;
  color: var(--color-ink, #252b25);
  font-size: 0.9375rem;
  font-weight: 600;
}

.manual__faq-answer {
  margin: 0.25rem 0 0;
  color: var(--color-muted, #666);
  font-size: 0.875rem;
  line-height: 1.6;
}
</style>
