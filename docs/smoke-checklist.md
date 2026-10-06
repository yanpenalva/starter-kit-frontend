# Checklist Executável: Smoke Pós-Deploy

Guia prático e conciso para validação manual ou semi-automatizada imediatamente após o deploy em ambiente de Preview, Staging ou Produção.

---

## Pré-requisitos
- SPA carregada no navegador com DevTools (aba Rede / Network e Console) aberto.
- Nenhuma falha de carregamento de assets (arquivos `.js` ou `.css` com status 404/500).

---

## 1. Carregamento Inicial e Assets
- [ ] **Acesso à Raiz (`/`)**: A landing page / tela pública inicial carrega sem erros de console.
- [ ] **Assets Versionados**: Requisições de arquivos sob `/assets/` retornam status `200` com hashes de integridade.
- [ ] **Favicon e Título**: Título da aba e ícones carregados normalmente.

---

## 2. Autenticação e CSRF
- [ ] **Bootstrap CSRF Cookie**: Ao navegar para `/login`, a requisição `GET /sanctum/csrf-cookie` ocorre com sucesso (204) e o cookie `XSRF-TOKEN` é armazenado no navegador.
- [ ] **Login Válido**:
  1. Submeter credenciais válidas.
  2. Requisição `POST /api/v1/login` inclui cabeçalho `X-XSRF-TOKEN` e retorna `200`.
  3. Redirecionamento automático para a tela `/dashboard`.
- [ ] **Sessão Persistente**: Atualizar a página (F5) no `/dashboard` mantém o usuário autenticado sem redirecionar para `/login`.

---

## 3. Route Guards e Proteção de Rotas
- [ ] **Guest Guard**: Enquanto autenticado, tentar acessar diretamente `/login` redireciona imediatamente de volta para `/dashboard`.
- [ ] **Auth Guard**: Em aba anônima (sem sessão), tentar acessar `/dashboard`, `/users` ou `/roles` redireciona para `/login?redirect=...`.
- [ ] **Forbidden Route (`/403`)**: Acesso sem permissão adequada exibe a interface de acesso negado sem crashes de aplicação.

---

## 4. Navegação e Telas Administrativas
- [ ] **Navegação no Menu**: Menus laterais/superiores respondem ao clique sem recarregamento completo da página (SPA client-side routing).
- [ ] **Tela de Usuários (`/users`)**: Tabela de listagem renderiza os dados retornados pela API; paginação e filtros de status/busca funcionam.
- [ ] **Tela de Papéis (`/roles`)**: Matriz de papéis e permissões renderiza corretamente.
- [ ] **Logs de Auditoria (`/logs`)**: Feed de eventos de auditoria é carregado com status 200.

---

## 5. Logout
- [ ] **Ação de Sair**: Clicar em "Sair" dispara `POST /api/v1/logout`.
- [ ] **Limpeza de Estado**: Armazenamento em memória (Pinia) é redefinido.
- [ ] **Redirecionamento**: Usuário é redirecionado para a tela de login ou home pública.
- [ ] **Tentativa de Retorno**: Clicar no botão "Voltar" do navegador não permite acessar páginas restritas sem nova autenticação.
