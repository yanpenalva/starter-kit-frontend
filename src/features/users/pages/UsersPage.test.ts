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

const counter = (wrapper: VueWrapper) => wrapper.get(".selection-counter");
const rowCheckbox = (wrapper: VueWrapper, index: number) =>
  wrapper.get<HTMLInputElement>(`[aria-label="Selecionar Pessoa ${index}"]`);
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

const dialogClose = (): HTMLButtonElement | undefined =>
  [...(dialogElement()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent?.trim() === "Fechar",
  );

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

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

const pressBackdrop = (): void => {
  document.body
    .querySelector(".q-dialog__backdrop")
    ?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
};

afterEach(() => {
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
        wrapper.find('[aria-label="Ver detalhe de Pessoa 1"]').exists(),
      ).toBe(true),
    );
    expect(detailLink(wrapper, 1).text()).toBe("Pessoa 1");
    expect(detailLink(wrapper, 15).text()).toBe("Pessoa 15");
    expect(
      wrapper.find('[aria-label="Ver detalhe de Pessoa 16"]').exists(),
    ).toBe(false);

    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(
        wrapper.find('[aria-label="Ver detalhe de Pessoa 16"]').exists(),
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
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
      );
      await openDialog(".page-toolbar button", wrapper);
      await setDialogValue('[aria-label="Nome do novo usuário"]', "Rascunho");

      dialogGet('[data-testid="cancel-create"]').click();
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(dialogElement()).not.toBeNull();

      pressEscape();
      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(dialogElement()).not.toBeNull();

      pressBackdrop();
      expect(confirmSpy).toHaveBeenCalledTimes(3);
      expect(dialogElement()).not.toBeNull();

      confirmSpy.mockReturnValue(true);
      pressEscape();
      await waitDialogClosed();
      expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
        0,
      );
    } finally {
      confirmSpy.mockRestore();
    }
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

  it("desabilita o salvar do modal e mostra loading enquanto grava", async () => {
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
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
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
    });

    await waitDialogClosed();
    expect(wrapper.text()).toContain("Usuário criado com sucesso.");
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
    dialogGet('[data-testid="submit-create-user"]').click();

    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("O email já está em uso."),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Email do novo usuário"]').value,
    ).toBe("tomada@example.test");
    expect(wrapper.find(".page-card [role=alert]").exists()).toBe(false);
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

  it("atribui perfis via multi-select pesquisável no modal de edição", async () => {
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
            '[aria-label="Perfis de Pessoa 2"] input[aria-label="Perfil editor"][role="option"]',
          ),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    await setDialogValue(
      '[aria-label="Perfis de Pessoa 2"] input[aria-label="Perfil editor"][role="option"]',
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

describe("UsersPage — forms em modal", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("pede confirmação de descarte para form sujo em Cancelar, Escape e backdrop", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
          true,
        ),
      );
      await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
      await setDialogValue('[data-testid="edit-name"]', "Rascunho");

      dialogGet('[data-testid="cancel-edit"]').click();
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(dialogElement()).not.toBeNull();

      pressEscape();
      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(dialogElement()).not.toBeNull();

      pressBackdrop();
      expect(confirmSpy).toHaveBeenCalledTimes(3);
      expect(dialogElement()).not.toBeNull();

      confirmSpy.mockReturnValue(true);
      pressEscape();
      await waitDialogClosed();

      expect(
        mocks.calls.filter((call) => call.method === "PATCH"),
      ).toHaveLength(0);
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("reabre outro registro sem herdar draft nem erro anterior", async () => {
    const mocks = makeUsersRouteMocks(makeUsers(3));
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
          true,
        ),
      );
      await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
      await setDialogValue('[data-testid="edit-name"]', "Rascunho 2");
      dialogGet('[data-testid="cancel-edit"]').click();
      await waitDialogClosed();

      await openDialog('[aria-label="Editar Pessoa 3"]', wrapper);
      await vi.waitFor(() =>
        expect(
          dialogGet<HTMLInputElement>('[data-testid="edit-name"]').value,
        ).toBe("Pessoa 3"),
      );
      expect(dialogElement()?.textContent).not.toContain("Rascunho 2");
      expect(dialogElement()?.querySelector('[role="alert"]')).toBeNull();
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("fecha o modal limpo direto e mantém a mutação pendente visível", async () => {
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
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Editar Pessoa 2"]').exists()).toBe(
          true,
        ),
      );
      await openDialog('[aria-label="Editar Pessoa 2"]', wrapper);
      dialogGet('[data-testid="cancel-edit"]').click();
      await waitDialogClosed();
      expect(confirmSpy).not.toHaveBeenCalled();

      await openDialog('[aria-label="Editar Pessoa 3"]', wrapper);
      await setDialogValue('[data-testid="edit-name"]', "Pessoa 3 editada");
      dialogGet('[data-testid="save-user"]').click();
      await vi.waitFor(() =>
        expect(
          dialogGet<HTMLButtonElement>('[data-testid="save-user"]').disabled,
        ).toBe(true),
      );

      pressEscape();
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(dialogElement()).not.toBeNull();

      await vi.waitFor(() =>
        expect(wrapper.text()).toContain("Usuário atualizado com sucesso."),
      );
      await waitDialogClosed();
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("esconde as ações sem permissão e não grava sem ela", async () => {
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

describe("UsersPage — seleção por página", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("seleciona usuários individualmente sem seletor de todos", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    expect(
      wrapper
        .find('[aria-label="Selecionar todos os usuários desta página"]')
        .exists(),
    ).toBe(false);

    await rowCheckbox(wrapper, 1).setValue(true);

    expect(counter(wrapper).text()).toContain("1 de 7 selecionados");

    await rowCheckbox(wrapper, 7).setValue(true);

    expect(counter(wrapper).text()).toContain("2 de 7 selecionados");

    await rowCheckbox(wrapper, 1).setValue(false);

    expect(counter(wrapper).text()).toContain("1 de 7 selecionados");

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
      expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeUndefined(),
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
    expect(rowCheckbox(wrapper, 16).attributes("disabled")).toBeUndefined();

    await wrapper.get("label.ui-search input").setValue("Pessoa 2");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("page") === "1" &&
            call.query.get("search") === "Pessoa 2",
        ),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 2 selecionados"),
    );
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
    expect(wrapper.find('[aria-label^="Selecionar "]').exists()).toBe(false);
  });

  it("desabilita a seleção enquanto a listagem recarrega e quando falha", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
    );
    expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeUndefined();

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
      expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeDefined(),
    );
    await vi.waitFor(() =>
      expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeUndefined(),
    );

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
    expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeDefined();
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

    expect(counter(wrapper).text()).toContain("0 de 7 selecionados");
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
    expect(
      wrapper.get('[aria-label="Ver detalhe de Pessoa 1"]').attributes("href"),
    ).toBe("/users/1");

    dialogClose()?.click();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());
  });

  it("limpa a seleção ao ir para a última página e permite selecioná-la inteira", async () => {
    const localUsers = makeUsers(32);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await rowCheckbox(wrapper, 1).setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get('button[aria-label="Última página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 2 selecionados"),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "3")).toBe(
      true,
    );
    expect(
      wrapper.find('[aria-label="Ver detalhe de Pessoa 32"]').exists(),
    ).toBe(true);

    await rowCheckbox(wrapper, 32).setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 2 selecionados");

    await wrapper.get('button[aria-label="Primeira página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await vi.waitFor(() =>
      expect(rowCheckbox(wrapper, 1).attributes("disabled")).toBeUndefined(),
    );
    expect(rowCheckbox(wrapper, 1).element.checked).toBe(false);
    expect(rowCheckbox(wrapper, 15).element.checked).toBe(false);
  });

  it("remove da seleção o usuário excluído após o refetch", async () => {
    const localUsers = makeUsers(7);
    const mocks = makeUsersRouteMocks(localUsers);
    server.use(...mocks.handlers, rolesListHandler);
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    const wrapper = await mountPage();

    try {
      await vi.waitFor(() =>
        expect(counter(wrapper).text()).toContain("0 de 7 selecionados"),
      );
      await rowCheckbox(wrapper, 2).setValue(true);
      await rowCheckbox(wrapper, 3).setValue(true);
      expect(counter(wrapper).text()).toContain("2 de 7 selecionados");

      await wrapper.get('[aria-label="Excluir Pessoa 2"]').trigger("click");

      await vi.waitFor(() =>
        expect(
          wrapper.find('[aria-label="Selecionar Pessoa 2"]').exists(),
        ).toBe(false),
      );
      expect(counter(wrapper).text()).toContain("1 de 6 selecionados");
      expect(rowCheckbox(wrapper, 3).element.checked).toBe(true);
      expect(
        mocks.calls.some(
          (call) => call.method === "DELETE" && call.path === "/api/v1/users/2",
        ),
      ).toBe(true);
    } finally {
      confirmSpy.mockRestore();
    }
  });
});
