import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { delay, http, HttpResponse } from "msw";
import { Notify } from "quasar";
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
        path: "/users",
        name: "users",
        component: { template: "<div />" },
      },
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

const mountPage = async (
  permissions: readonly string[] = [...CATALOGUE_PERMISSIONS],
) => {
  queryClient.clear();
  const session = useSessionStore();
  session.user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...permissions],
  };
  session.status = "authenticated";
  const wrapper = mount(UsersPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], await makeRouter()],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
};

const detailLink = (wrapper: VueWrapper, index: number) =>
  wrapper.get(`[aria-label="Ver detalhe de Pessoa ${index}"]`);

const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogGet = <T extends HTMLElement = HTMLElement>(
  selector: string,
): T => {
  const element = dialogElement()?.querySelector<T>(selector) ?? null;
  if (element === null) {
    throw new Error(`Elemento do diálogo não encontrado: ${selector}`);
  }
  return element;
};

const confirmDialogButton = (text: string): HTMLButtonElement => {
  const dialog = [
    ...document.body.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ].at(-1);
  const button = [
    ...(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ].find((candidate) => candidate.textContent?.trim() === text);
  if (button === undefined)
    throw new Error(`Botão de confirmação não encontrado: ${text}`);
  return button;
};

const openDialog = async (selector: string, wrapper: VueWrapper) => {
  await wrapper.get(selector).trigger("click");
  await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
};

const waitDialogClosed = async () => {
  await vi.waitFor(() => expect(dialogElement()).toBeNull());
};

const setDialogValue = async (
  selector: string,
  value: string | boolean,
): Promise<void> => {
  const element = dialogGet<HTMLInputElement>(selector);
  if (typeof value === "boolean") {
    element.checked = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const selectDialogRole = async (name: string): Promise<void> => {
  const labels: Record<string, string> = {
    admin: "Administrador — Acesso administrativo ao sistema",
    manager: "Gerente — Gerencia usuários e operações",
  };
  const selector = labels[name]
    ? `[aria-label="${labels[name]}"][role="option"]`
    : `[aria-label^="${name} — Perfil personalizado —"][role="option"]`;
  await vi.waitFor(() => expect(dialogGet(selector)).toBeDefined());
  await setDialogValue(selector, true);
};

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("UsersPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("lists users and changes pages", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
    );
    const actionsCell = wrapper.get("tbody tr .actions-cell");
    expect(actionsCell.findAll("button")).toHaveLength(4);
    expect(actionsCell.classes()).toContain("actions-cell--nowrap");
    expect(
      wrapper.get('[aria-label="Ver detalhes de Pessoa 1"]').classes(),
    ).toContain("action-button--info");
    expect(wrapper.get('[aria-label="Editar Pessoa 1"]').classes()).toContain(
      "action-button--warning",
    );
    expect(
      wrapper.get('[aria-label="Desativar Pessoa 1"]').classes(),
    ).toContain("action-button--secondary");
    expect(wrapper.get(".user-status--active").text()).toBe("Ativo");
    expect(wrapper.get('[aria-label="Excluir Pessoa 1"]').classes()).toContain(
      "action-button--error",
    );
    expect(wrapper.get("tbody").text()).toContain("Administrador");
    expect(detailLink(wrapper, 1).text()).toBe("Pessoa 1");
    expect(detailLink(wrapper, 10).text()).toBe("Pessoa 10");
    expect(
      wrapper.find('[aria-label="Ver detalhe de Pessoa 11"]').exists(),
    ).toBe(false);

    await vi.waitFor(() =>
      expect(
        wrapper
          .get('button[aria-label="Próxima página"]')
          .attributes("disabled"),
      ).toBeUndefined(),
    );
    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 11"]').exists(),
      ).toBe(true),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
  });

  it("uses the same dirty-form guard for create cancel, Escape and backdrop", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await openDialog(".page-toolbar button", wrapper);
    await setDialogValue('[aria-label="Nome do novo usuário"]', "Rascunho");

    dialogGet('[data-testid="cancel-create"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar o novo usuário?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(dialogElement()).not.toBeNull();
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("filters users and submits status changes", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
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
    const notify = vi.spyOn(Notify, "create").mockReturnValue(() => undefined);
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
    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário desativado.",
          timeout: 4000,
          attrs: expect.objectContaining({ role: "status" }),
        }),
      ),
    );
  });

  it("shows a success toast and transitions the status when activating a user", async () => {
    const deactivatedUser = makeAdminUser({
      id: 5,
      name: "Pessoa 5",
      email: "pessoa5@example.test",
      deactivated_at: "2026-01-01T00:00:00Z",
    });
    const mocks = makeUsersRouteMocks([deactivatedUser]);
    server.use(
      http.post(
        `${TEST_API_BASE}/api/v1/users/:userId/status`,
        async ({ request }) => {
          deactivatedUser.deactivated_at = null;
          return HttpResponse.json(
            { data: deactivatedUser },
            {
              headers: makeCorsHeaders(request),
            },
          );
        },
      ),
      ...mocks.handlers,
      rolesListHandler,
    );
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.get(".user-status--deactivated").text()).toBe(
        "Desativado",
      ),
    );

    const notify = vi.spyOn(Notify, "create").mockReturnValue(() => undefined);
    await wrapper.get('[aria-label="Ativar Pessoa 5"]').trigger("click");

    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário ativado.",
          timeout: 4000,
          position: "bottom-right",
          color: "positive",
          attrs: expect.objectContaining({ role: "status" }),
        }),
      ),
    );
    await vi.waitFor(() =>
      expect(wrapper.get(".user-status--active").text()).toBe("Ativo"),
    );
    expect(
      wrapper.get('[aria-label="Desativar Pessoa 5"]').classes(),
    ).toContain("action-button--secondary");
  });

  it("shows an error toast when changing user status fails", async () => {
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/users/:userId/status`, ({ request }) =>
        HttpResponse.json(
          { message: "Falha interna." },
          { status: 500, headers: makeCorsHeaders(request) },
        ),
      ),
      ...makeUsersRouteMocks([users[0]!]).handlers,
      rolesListHandler,
    );
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Desativar Pessoa 1"]').exists()).toBe(
        true,
      ),
    );

    const notify = vi.spyOn(Notify, "create").mockReturnValue(() => undefined);
    await wrapper.get('[aria-label="Desativar Pessoa 1"]').trigger("click");

    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
          timeout: 4000,
          position: "bottom-right",
          color: "negative",
          attrs: expect.objectContaining({ role: "status" }),
        }),
      ),
    );
    expect(wrapper.get(".user-status--active").text()).toBe("Ativo");
  });

  it("keeps the user search editable and shows the latest result after a late response", async () => {
    const localUsers = [
      makeAdminUser({
        id: 1,
        name: "Lento",
        email: "lento@example.test",
      }),
      makeAdminUser({
        id: 2,
        name: "Rápido",
        email: "rapido@example.test",
      }),
    ];
    const requested: string[] = [];
    const completed: string[] = [];
    server.use(...makeUsersRouteMocks([]).handlers, rolesListHandler);
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/users`, async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        requested.push(search);
        await delay(search === "lento" ? 600 : 10);
        completed.push(search);
        const filtered = localUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()),
        );
        return HttpResponse.json(
          makePaginated(filtered, {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: filtered.length,
          }),
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const wrapper = await mountPage();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lento"));

    const search = wrapper.get<HTMLInputElement>('input[type="search"]');
    await search.setValue("lento");
    await vi.waitFor(() => expect(requested).toContain("lento"));
    expect(search.element.disabled).toBe(false);

    await search.setValue("rapido@example.test");
    await vi.waitFor(() => expect(requested).toContain("rapido@example.test"));
    await vi.waitFor(() =>
      expect(wrapper.get("tbody").text()).toContain("Rápido"),
    );
    await vi.waitFor(() => expect(completed).toContain("lento"));

    expect(wrapper.get("tbody").text()).toContain("Rápido");
    expect(wrapper.get("tbody").text()).not.toContain("Lento");
  });

  it("disables the modal save button and shows loading while saving", async () => {
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
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
    );
    await openDialog('[aria-label="Editar Pessoa 1"]', wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Pessoa 1 editada");

    const saveButton = dialogGet('[data-testid="save-user"]');
    saveButton.click();

    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLButtonElement>('[data-testid="save-user"]').disabled,
      ).toBe(true),
    );
    expect(dialogGet('[data-testid="save-user"]').textContent?.trim()).toBe(
      "Salvando...",
    );

    expect(
      dialogGet<HTMLButtonElement>('[data-testid="cancel-edit"]').disabled,
    ).toBe(true);

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Usuário atualizado com sucesso."),
    );
    await waitDialogClosed();
  });

  it("ignores duplicate submits while a request is pending", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
    );
    await openDialog('[aria-label="Editar Pessoa 1"]', wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Pessoa 1 editada");

    dialogGet('[data-testid="save-user"]').click();
    dialogGet('[data-testid="save-user"]').click();

    await vi.waitFor(() =>
      expect(
        mocks.calls.filter(
          (call) => call.method === "PATCH" && call.path === "/api/v1/users/1",
        ),
      ).toHaveLength(1),
    );
  });

  it("creates a user through the modal form", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(16));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await vi.waitFor(() =>
      expect(wrapper.find(".table-wrap").exists()).toBe(true),
    );
    const initialListRequests = mocks.calls.filter(
      (call) => call.method === "GET" && call.path === "/api/v1/users",
    ).length;
    await openDialog(".page-toolbar button", wrapper);

    await setDialogValue('[aria-label="Nome do novo usuário"]', "Novo Usuário");
    await setDialogValue(
      '[aria-label="Email do novo usuário"]',
      "novo@example.test",
    );
    await setDialogValue('[aria-label="CPF do novo usuário"]', "12345678909");
    await setDialogValue(
      '[aria-label="Senha do novo usuário"]',
      "Alterar123!x",
    );
    await selectDialogRole("admin");
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Ativar novo usuário imediatamente"]',
      ).checked,
    ).toBe(false);
    await setDialogValue(
      '[aria-label="Ativar novo usuário imediatamente"]',
      true,
    );
    dialogGet('[data-testid="submit-create-user"]').click();

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
      active: true,
      roles: ["admin"],
    });

    await vi.waitFor(() =>
      expect(
        mocks.calls.filter(
          (call) => call.method === "GET" && call.path === "/api/v1/users",
        ).length,
      ).toBeGreaterThan(initialListRequests),
    );

    await waitDialogClosed();
    expect(wrapper.text()).toContain("Usuário criado com sucesso.");
  });

  it("deletes a user after confirmation", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Excluir Pessoa 2"]').exists()).toBe(
        true,
      ),
    );
    await wrapper.get('[aria-label="Excluir Pessoa 2"]').trigger("click");
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Deseja excluir o usuário Pessoa 2?",
      ),
    );
    confirmDialogButton("Excluir usuário").click();
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) => call.method === "DELETE" && call.path === "/api/v1/users/2",
        ),
      ).toBe(true),
    );
  });

  it("shows field errors when the API rejects the form with 422", async () => {
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
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await openDialog(".page-toolbar button", wrapper);
    await setDialogValue('[aria-label="Nome do novo usuário"]', "Novo Usuário");
    await setDialogValue(
      '[aria-label="Email do novo usuário"]',
      "tomada@example.test",
    );
    await setDialogValue('[aria-label="CPF do novo usuário"]', "12345678909");
    await setDialogValue(
      '[aria-label="Senha do novo usuário"]',
      "Alterar123!x",
    );
    await selectDialogRole("admin");
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("O email já está em uso."),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Email do novo usuário"]').value,
    ).toBe("tomada@example.test");
    expect(wrapper.find(".page-card [role=alert]").exists()).toBe(false);
  });

  it("starts a countdown when the listing returns 429", async () => {
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

  it("exposes a shortcut to the user detail in the listing", async () => {
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

  it("assigns roles via searchable multi-select in the edit modal", async () => {
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
      expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
        true,
      ),
    );
    await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
    await vi.waitFor(() =>
      expect(
        dialogElement()?.querySelector(
          '[aria-label="Buscar perfis para Perfis de Pessoa 2"]',
        ),
      ).not.toBeNull(),
    );
    await setDialogValue(
      '[aria-label="Buscar perfis para Perfis de Pessoa 2"]',
      "edi",
    );
    await vi.waitFor(
      () =>
        expect(
          dialogElement()?.querySelector(
            '[aria-label="Perfis de Pessoa 2"] input[aria-label^="editor — Perfil personalizado —"][role="option"]',
          ),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    await setDialogValue(
      '[aria-label="Perfis de Pessoa 2"] input[aria-label^="editor — Perfil personalizado —"][role="option"]',
      true,
    );
    dialogGet('[aria-label="Salvar perfis de Pessoa 2"]').click();

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

    expect(mocks.calls.filter((call) => call.method === "PATCH")).toHaveLength(
      0,
    );
  });
});

describe("UsersPage modal forms", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("asks for discard confirmation for a dirty form on Cancel, Escape and backdrop", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
        true,
      ),
    );
    await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Rascunho");
    dialogGet('[data-testid="cancel-edit"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(dialogElement()).not.toBeNull();
    expect(mocks.calls.filter((call) => call.method === "PATCH")).toHaveLength(
      0,
    );
  });

  it("reopens another record without inheriting the draft or previous error", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
        true,
      ),
    );
    await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Rascunho 2");
    dialogGet('[data-testid="cancel-edit"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Descartar alterações").click();
    await waitDialogClosed();
    await openDialog('[aria-label="Editar Pessoa 3"]', wrapper);
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLInputElement>('[data-testid="edit-name"]').value,
      ).toBe("Pessoa 3"),
    );
    expect(dialogElement()?.textContent).not.toContain("Rascunho 2");
    expect(dialogElement()?.querySelector('[role="alert"]')).toBeNull();
  });

  it("closes the clean modal directly and keeps the pending mutation visible", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    server.use(
      http.patch(
        `${TEST_API_BASE}/api/v1/users/:userId`,
        async ({ request, params }) => {
          await delay(80);
          const user = makeUsers(3).find(
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
      expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
        true,
      ),
    );
    await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
    dialogGet('[data-testid="cancel-edit"]').click();
    await waitDialogClosed();

    await openDialog('[aria-label="Editar Pessoa 3"]', wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Pessoa 3 editada");
    dialogGet('[data-testid="save-user"]').click();
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLButtonElement>('[data-testid="save-user"]').disabled,
      ).toBe(true),
    );
    pressEscape();
    expect(dialogElement()).not.toBeNull();
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Usuário atualizado com sucesso."),
    );
    await waitDialogClosed();
  });

  it("hides actions without permission and writes nothing without it", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage(["users.view"]);

    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
    );
    expect(wrapper.find(".page-toolbar button").exists()).toBe(false);
    expect(wrapper.find('[aria-label="Editar Pessoa 1"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Excluir Pessoa 1"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[aria-label="Desativar Pessoa 1"]').exists()).toBe(
      false,
    );
    expect(dialogElement()).toBeNull();
  });
});

describe("UsersPage selection", () => {
  it("renders the users list without selection checkboxes", async () => {
    server.use(...makeUsersRouteMocks(users).handlers, rolesListHandler);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    expect(wrapper.find("input[type=checkbox]").exists()).toBe(false);
  });
});

describe("UsersPage pagination and querying", () => {
  it("returns to the first page when changing page size", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(20));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 11"]').exists(),
      ).toBe(true),
    );
    await wrapper
      .get<HTMLSelectElement>('select[aria-label="Itens por página"]')
      .setValue("5");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("page") === "1" &&
            call.query.get("per_page") === "5",
        ),
      ).toBe(true),
    );
    expect(
      wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
    ).toBe(true);
  });

  it("opens and closes the user details without selecting the row", async () => {
    const localUsers = makeUsers(3);
    localUsers[0] = makeAdminUser({
      id: 1,
      name: "Pessoa 1",
      email: "pessoa1@example.test",
      roles: ["admin"],
      cpf: "12345678909",
    });
    server.use(...makeUsersRouteMocks(localUsers).handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    await wrapper
      .get('[aria-label="Ver detalhes de Pessoa 1"]')
      .trigger("click");
    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("Detalhes de Pessoa 1"),
    );
    expect(dialogElement()?.textContent).toContain("123.456.789-09");
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
    expect(
      wrapper.get('[aria-label="Ver detalhe de Pessoa 1"]').attributes("href"),
    ).toBe("/users/1");
    [...(dialogElement()?.querySelectorAll<HTMLButtonElement>("button") ?? [])]
      .find((button) => button.textContent?.trim() === "Fechar")
      ?.click();
    await waitDialogClosed();
  });
});
