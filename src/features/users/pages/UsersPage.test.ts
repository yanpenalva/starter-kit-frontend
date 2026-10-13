import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { delay, http, HttpResponse } from "msw";
import {
  makeAdminRole,
  makeAdminUser,
  makePaginated,
  makeUsersRouteMocks,
} from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import UsersPage from "./UsersPage.vue";

const makeUsers = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    makeAdminUser({
      id: index + 1,
      name: `Pessoa ${index + 1}`,
      email: `pessoa${index + 1}@example.test`,
      roles: index === 0 ? ["admin"] : ["user"],
    }),
  );

const users = makeUsers(16);

const makeRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/users/:userId",
        name: "user-detail",
        component: { template: "<div />" },
      },
    ],
  });
  await router.push("/users");
  await router.isReady();
  return router;
};

const rolesListHandler = http.get(
  `${TEST_API_BASE}/api/v1/roles`,
  async ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const all = [
      makeAdminRole({ id: 1, name: "admin" }),
      makeAdminRole({ id: 2, name: "user" }),
      makeAdminRole({ id: 3, name: "editor" }),
      makeAdminRole({ id: 4, name: "auditor" }),
    ];
    const filtered = all.filter(
      (role) => search === "" || role.name.toLowerCase().includes(search),
    );
    return HttpResponse.json(
      {
        data: filtered,
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          path: "",
          per_page: 50,
          to: null,
          total: filtered.length,
        },
      },
      { headers: makeCorsHeaders(request) },
    );
  },
);

const mountedWrappers: VueWrapper[] = [];

const mountPage = async () => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...CATALOGUE_PERMISSIONS],
  };
  // Cada caso parte de um cache limpo: o queryClient é compartilhado pelo
  // arquivo e dados de fixtures anteriores mudariam as contagens de seleção.
  queryClient.clear();
  const wrapper = mount(UsersPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], await makeRouter()],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
};

const counter = (wrapper: VueWrapper) => wrapper.get(".selection-counter");
const headerCheckbox = (wrapper: VueWrapper) =>
  wrapper.get<HTMLInputElement>(
    '[aria-label="Selecionar todos os usuários desta página"]',
  );
const rowCheckbox = (wrapper: VueWrapper, index: number) =>
  wrapper.get<HTMLInputElement>(`[aria-label="Selecionar Pessoa ${index}"]`);

// O diálogo é renderizado em Teleport no document.body pelo Quasar, então as
// asserções usam o documento e não o wrapper (sem stub que apague o modal).
const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogClose = (): HTMLButtonElement | undefined =>
  [...(dialogElement()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent?.trim() === "Fechar",
  );

afterEach(() => {
  // Componentes abandonados entre casos reagiriam ao cache compartilhado e
  // disparariam requisições sem handler.
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("UsersPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("lists users and changes pages", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[aria-label="Nome de Pessoa 1"]').element
          .value,
      ).toBe("Pessoa 1"),
    );
    expect(wrapper.find('[aria-label="Nome de Pessoa 15"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[aria-label="Nome de Pessoa 16"]').exists()).toBe(
      false,
    );

    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Nome de Pessoa 16"]').exists()).toBe(
        true,
      ),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
  });

  it("filters users and submits status changes", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Nome de Pessoa 1"]').exists()).toBe(
        true,
      ),
    );
    await wrapper.get("label.ui-search input").setValue("Pessoa 2");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("search") === "Pessoa 2"),
      ).toBe(true),
    );
    await wrapper
      .get('select[aria-label="Filtrar por status"]')
      .setValue("active");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("status") === "active"),
      ).toBe(true),
    );
    await wrapper
      .get('button[aria-label="Desativar Pessoa 2"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.path === "/api/v1/users/2/status" &&
            JSON.stringify(call.body) ===
              JSON.stringify({ status: "deactivated" }),
        ),
      ).toBe(true),
    );
  });

  it("disables action buttons and shows loading while saving", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    server.use(
      http.patch(
        `${TEST_API_BASE}/api/v1/users/:userId`,
        async ({ request, params }) => {
          await delay(80);
          const user = users.find(
            (candidate) => String(candidate.id) === String(params.userId),
          );
          return HttpResponse.json(
            { data: user },
            { headers: makeCorsHeaders(request) },
          );
        },
      ),
    );
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Nome de Pessoa 1"]').exists()).toBe(
        true,
      ),
    );
    const saveButton = wrapper.get('[aria-label="Salvar nome de Pessoa 1"]');
    void saveButton.trigger("click");

    await vi.waitFor(() =>
      expect(saveButton.attributes("disabled")).toBeDefined(),
    );
    expect(saveButton.text()).toBe("Salvando...");
    expect(
      wrapper
        .get('[aria-label="Salvar papéis de Pessoa 1"]')
        .attributes("disabled"),
    ).toBeDefined();

    await vi.waitFor(() =>
      expect(wrapper.get('[aria-label="Salvar nome de Pessoa 1"]').text()).toBe(
        "Salvar nome",
      ),
    );
  });

  it("ignores duplicate submits while a request is pending", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Nome de Pessoa 1"]').exists()).toBe(
        true,
      ),
    );
    void wrapper.get('[aria-label="Salvar nome de Pessoa 1"]').trigger("click");
    void wrapper.get('[aria-label="Salvar nome de Pessoa 1"]').trigger("click");

    await vi.waitFor(() =>
      expect(
        mocks.calls.filter(
          (call) => call.method === "PATCH" && call.path === "/api/v1/users/1",
        ),
      ).toHaveLength(1),
    );
  });

  it("creates a user through the creation form", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Criar usuário"]').exists()).toBe(true),
    );
    await wrapper
      .get('[aria-label="Nome do novo usuário"]')
      .setValue("Novo Usuário");
    await wrapper
      .get('[aria-label="Email do novo usuário"]')
      .setValue("novo@example.test");
    await wrapper
      .get('[aria-label="CPF do novo usuário"]')
      .setValue("12345678909");
    await wrapper
      .get('[aria-label="Senha do novo usuário"]')
      .setValue("Alterar123!x");
    await wrapper.get('[aria-label="Criar usuário"]').trigger("submit");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) => call.method === "POST" && call.path === "/api/v1/users",
        ),
      ).toBe(true),
    );
    expect(
      mocks.calls.find(
        (call) => call.method === "POST" && call.path === "/api/v1/users",
      )?.body,
    ).toMatchObject({
      name: "Novo Usuário",
      email: "novo@example.test",
      cpf: "12345678909",
      active: false,
    });
  });

  it("deletes a user after confirmation", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Excluir Pessoa 2"]').exists()).toBe(
          true,
        ),
      );
      await wrapper.get('[aria-label="Excluir Pessoa 2"]').trigger("click");

      await vi.waitFor(() =>
        expect(
          mocks.calls.some(
            (call) =>
              call.method === "DELETE" && call.path === "/api/v1/users/2",
          ),
        ).toBe(true),
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("mostra erros por campo quando a API rejeita o formulário com 422", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: { email: ["O email já está em uso."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Criar usuário"]').exists()).toBe(true),
    );
    await wrapper
      .get('[aria-label="Nome do novo usuário"]')
      .setValue("Novo Usuário");
    await wrapper
      .get('[aria-label="Email do novo usuário"]')
      .setValue("tomada@example.test");
    await wrapper
      .get('[aria-label="CPF do novo usuário"]')
      .setValue("12345678909");
    await wrapper
      .get('[aria-label="Senha do novo usuário"]')
      .setValue("Alterar123!x");
    await wrapper.get('[aria-label="Criar usuário"]').trigger("submit");

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "O email já está em uso.",
      ),
    );
    expect(wrapper.find(".create-form [role=alert]").exists()).toBe(true);
  });

  it("inicia contagem regressiva quando a listagem recebe 429", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          { message: "Muitas tentativas." },
          {
            status: 429,
            headers: {
              ...makeCorsHeaders(request),
              "Retry-After": "30",
            },
          },
        ),
      ),
    );
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "Aguarde 30 segundos",
      ),
    );
  });

  it("expõe atalho para o detalhe do usuário na listagem", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper
          .get('[aria-label="Ver detalhe de Pessoa 1"]')
          .attributes("href"),
      ).toBe("/users/1"),
    );
  });

  it("atribui papéis via multi-select pesquisável em vez de texto livre", async () => {
    const localUsers = Array.from({ length: 3 }, (_, index) =>
      makeAdminUser({
        id: index + 1,
        name: `Pessoa ${index + 1}`,
        email: `pessoa${index + 1}@example.test`,
        roles: index === 0 ? ["admin"] : ["user"],
      }),
    );
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper
          .find('[aria-label="Buscar papéis para Papéis de Pessoa 2"]')
          .exists(),
      ).toBe(true),
    );
    await wrapper
      .get('[aria-label="Buscar papéis para Papéis de Pessoa 2"]')
      .setValue("edi");
    await vi.waitFor(
      () =>
        expect(
          wrapper
            .find(
              '[aria-label="Papéis de Pessoa 2"] input[aria-label="Papel editor"][role="option"]',
            )
            .exists(),
        ).toBe(true),
      { timeout: 4000 },
    );
    await wrapper
      .get(
        '[aria-label="Papéis de Pessoa 2"] input[aria-label="Papel editor"][role="option"]',
      )
      .setValue(true);
    await wrapper
      .get('[aria-label="Salvar papéis de Pessoa 2"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.method === "PUT" &&
            call.path === "/api/v1/users/2/roles" &&
            JSON.stringify(call.body) ===
              JSON.stringify({ roles: ["user", "editor"] }),
        ),
      ).toBe(true),
    );
  });
});

describe("UsersPage — seleção por página", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("seleciona a linha, deixa o header indeterminado e limpa ao clicar de novo", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined();

    await rowCheckbox(wrapper, 1).setValue(true);

    expect(headerCheckbox(wrapper).element.indeterminate).toBe(true);
    expect(headerCheckbox(wrapper).element.checked).toBe(false);
    expect(counter(wrapper).text()).toContain("1 de 7 selecionados");

    await headerCheckbox(wrapper).setValue(true);

    expect(counter(wrapper).text()).toContain("7 de 7 selecionados");
    expect(headerCheckbox(wrapper).element.checked).toBe(true);
    expect(headerCheckbox(wrapper).element.indeterminate).toBe(false);
    expect(rowCheckbox(wrapper, 7).element.checked).toBe(true);

    await headerCheckbox(wrapper).setValue(false);

    expect(counter(wrapper).text()).toContain("0 de 7 selecionados");
    expect(rowCheckbox(wrapper, 1).element.checked).toBe(false);

    // Selecionar é independente das permissões: nenhuma escrita é disparada.
    expect(mocks.calls.filter((call) => call.method !== "GET")).toHaveLength(0);
  });

  it("limpa a seleção ao buscar e ao trocar de página", async () => {
    const localUsers = makeUsers(20);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await rowCheckbox(wrapper, 1).setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get("label.ui-search input").setValue("Pessoa 2");
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 2 selecionados"),
    );

    await wrapper.get("label.ui-search input").setValue("");
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await vi.waitFor(() =>
      expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined(),
    );
    await rowCheckbox(wrapper, 3).setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined();
  });

  it("mantém após refetch somente os IDs ainda presentes", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    await rowCheckbox(wrapper, 1).setValue(true);
    await rowCheckbox(wrapper, 3).setValue(true);
    expect(counter(wrapper).text()).toContain("2 de 7 selecionados");

    // Pessoa 1 sai da listagem: o refetch da mesma página não pode manter um
    // ID que não está mais visível.
    localUsers.splice(
      localUsers.findIndex((user) => user.id === 1),
      1,
    );
    await queryClient.invalidateQueries({ queryKey: ["users"] });

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Selecionar Pessoa 1"]').exists()).toBe(
        false,
      ),
    );
    expect(counter(wrapper).text()).toContain("1 de 6 selecionados");
    expect(rowCheckbox(wrapper, 3).element.checked).toBe(true);
  });

  it("esvazia a seleção quando a busca não encontra resultados", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    await rowCheckbox(wrapper, 2).setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 7 selecionados");

    await wrapper.get("label.ui-search input").setValue("inexistente");

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Nenhum usuário encontrado."),
    );
    expect(counter(wrapper).text()).toContain("0 de 0 selecionados");
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeDefined();

    await headerCheckbox(wrapper).setValue(true);
    expect(counter(wrapper).text()).toContain("0 de 0 selecionados");
  });

  it("desabilita o header enquanto a listagem recarrega e quando falha", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined();

    // Refetch da mesma página com resposta lenta: dados antigos continuam na
    // tela, mas não podem ser selecionados durante o trânsito.
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/users`, async ({ request }) => {
        await delay(300);
        return HttpResponse.json(
          makePaginated(localUsers.slice(0, 7), {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 7,
          }),
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    void queryClient.invalidateQueries({ queryKey: ["users"] });

    await vi.waitFor(() =>
      expect(headerCheckbox(wrapper).attributes("disabled")).toBeDefined(),
    );
    await vi.waitFor(() =>
      expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined(),
    );

    // Falha na listagem mantém os dados antigos visíveis e o header desabilitado.
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/users`, async ({ request }) =>
        HttpResponse.json(
          { message: "Erro interno." },
          { status: 500, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    void queryClient.invalidateQueries({ queryKey: ["users"] });

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').exists()).toBe(true),
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeDefined();
  });

  it("abre a consulta em modal sem selecionar a linha e mantém o link da rota", async () => {
    const localUsers = makeUsers(7);
    localUsers[0] = makeAdminUser({
      id: 1,
      name: "Pessoa 1",
      email: "pessoa1@example.test",
      roles: ["admin"],
      cpf: "12345678909",
    });
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    await wrapper
      .get('[aria-label="Ver detalhes de Pessoa 1"]')
      .trigger("click");

    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("Detalhes de Pessoa 1"),
    );
    expect(dialogElement()?.textContent).toContain("123.456.789-09");

    // Consultar não seleciona e não libera edição: o detalhe é só leitura.
    expect(counter(wrapper).text()).toContain("0 de 7 selecionados");
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
    expect(
      wrapper.get('[aria-label="Ver detalhe de Pessoa 1"]').attributes("href"),
    ).toBe("/users/1");

    dialogClose()?.click();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());
  });
});
