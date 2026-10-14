import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  makeAdminRole,
  makeAdminUser,
  makeUsersRouteMocks,
} from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import UserEditForm from "./UserEditForm.vue";

const user = makeAdminUser({
  id: 7,
  name: "Maria Silva",
  email: "maria@example.test",
  roles: ["user"],
  cpf: "12345678909",
});

const rolesListHandler = http.get(
  `${TEST_API_BASE}/api/v1/roles`,
  async ({ request }) =>
    HttpResponse.json(
      {
        data: [
          makeAdminRole({ id: 1, name: "admin" }),
          makeAdminRole({ id: 2, name: "user" }),
          makeAdminRole({ id: 3, name: "editor" }),
        ],
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          path: "",
          per_page: 50,
          to: null,
          total: 3,
        },
      },
      { headers: makeCorsHeaders(request) },
    ),
);

const mountedWrappers: VueWrapper[] = [];

const mountModal = async (
  permissions: readonly string[] = [...CATALOGUE_PERMISSIONS],
  actorRoles: readonly string[] = ["admin"],
) => {
  queryClient.clear();
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: [...actorRoles],
    permissions: [...permissions],
  };
  const wrapper = mount(UserEditForm, {
    attachTo: document.body,
    props: { modelValue: true, user },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  mountedWrappers.push(wrapper);
  await vi.waitFor(() =>
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull(),
  );
  return wrapper;
};

const dialogGet = <T extends HTMLElement = HTMLElement>(
  selector: string,
): T => {
  const element =
    document.body
      .querySelector<HTMLElement>('[role="dialog"]')
      ?.querySelector<T>(selector) ?? null;
  if (element === null) {
    throw new Error(`Elemento do diálogo não encontrado: ${selector}`);
  }
  return element;
};

const setValue = async (
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

const beforeUnload = (): Event => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("UserEditForm", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("envia apenas os campos alterados no PATCH", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountModal();

    await setValue('[data-testid="edit-name"]', "Maria Editada");
    dialogGet('[data-testid="save-user"]').click();

    await vi.waitFor(() =>
      expect(wrapper.emitted("profile-saved")).toBeTruthy(),
    );
    expect(
      mocks.calls.find(
        (call) => call.method === "PATCH" && call.path === "/api/v1/users/7",
      )?.body,
    ).toEqual({ name: "Maria Editada" });
  });

  it("salva perfis em chamada separada e não apaga o feedback do bloco de dados", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    server.use(
      http.patch(`${TEST_API_BASE}/api/v1/users/:userId`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: { email: ["O email já está em uso."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = await mountModal();

    await setValue('[data-testid="edit-email"]', "tomada@example.test");
    dialogGet('[data-testid="save-user"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("O email já está em uso."),
    );

    await setValue(
      '[aria-label="Perfis de Maria Silva"] input[aria-label^="editor — Perfil personalizado —"][role="option"]',
      true,
    );
    dialogGet('[aria-label="Salvar perfis de Maria Silva"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("roles-saved")).toBeTruthy());
    expect(
      mocks.calls.find(
        (call) =>
          call.method === "PUT" && call.path === "/api/v1/users/7/roles",
      )?.body,
    ).toEqual({ roles: ["user", "editor"] });

    expect(document.body.textContent).toContain("O email já está em uso.");
    expect(wrapper.emitted("profile-saved")).toBeUndefined();
  });

  it("bloqueia a saída com beforeunload sujo e libera depois de salvar", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountModal();

    expect(beforeUnload().defaultPrevented).toBe(false);

    await setValue('[data-testid="edit-name"]', "Maria Editada");
    expect(beforeUnload().defaultPrevented).toBe(true);

    dialogGet('[data-testid="save-user"]').click();
    await vi.waitFor(() =>
      expect(wrapper.emitted("profile-saved")).toBeTruthy(),
    );

    expect(beforeUnload().defaultPrevented).toBe(false);
  });

  it("remove o listener de beforeunload ao desmontar", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountModal();

    await setValue('[data-testid="edit-name"]', "Rascunho");
    wrapper.unmount();
    mountedWrappers.pop();

    expect(beforeUnload().defaultPrevented).toBe(false);
  });

  it("respeita users.update e users.assign-roles", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    await mountModal(["users.view", "users.assign-roles"]);

    expect(document.body.querySelector('[data-testid="save-user"]')).toBeNull();
    expect(dialogGet('[aria-label="Perfis selecionados"]')).not.toBeNull();

    document.body
      .querySelector('[role="dialog"]')
      ?.querySelectorAll("button")
      .forEach((button) => button.click());
    await Promise.resolve();
    expect(mocks.calls.filter((call) => call.method === "PATCH")).toHaveLength(
      0,
    );
  });

  it("sem users.assign-roles mostra os perfis como leitura", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    await mountModal(["users.view", "users.update"]);

    expect(
      document.body.querySelector('[aria-label="Perfis de Maria Silva"]'),
    ).toBeNull();
    expect(dialogGet("[data-testid=roles-readonly]").textContent).toBe(
      "Usuário",
    );
  });

  it("bloqueia atribuição vazia antes do PUT", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    await mountModal();

    dialogGet<HTMLButtonElement>('[aria-label="Remover perfil user"]').click();
    await vi.waitFor(() =>
      expect(dialogGet(".user-edit__roles").textContent).toContain(
        "Selecione ao menos um perfil. Uma atribuição vazia não pode ser salva.",
      ),
    );
    expect(
      dialogGet<HTMLButtonElement>(
        '[aria-label="Salvar perfis de Maria Silva"]',
      ).disabled,
    ).toBe(true);
    expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
  });

  it.each([403, 422])(
    "mantém o erro %i de atribuição dentro do bloco de perfis",
    async (status) => {
      const mocks = makeUsersRouteMocks([user]);
      let putCalls = 0;
      server.use(...mocks.handlers, rolesListHandler);
      server.use(
        http.put(
          `${TEST_API_BASE}/api/v1/users/:userId/roles`,
          async ({ request }) => {
            putCalls += 1;
            return HttpResponse.json(
              {
                message: status === 403 ? "Acesso negado." : "Dados inválidos.",
                ...(status === 422
                  ? { errors: { roles: ["Selecione perfis válidos."] } }
                  : {}),
              },
              { status, headers: makeCorsHeaders(request) },
            );
          },
        ),
      );
      await mountModal();

      await vi.waitFor(() =>
        expect(
          dialogGet('[aria-label^="editor — Perfil personalizado —"]'),
        ).toBeDefined(),
      );
      await setValue(
        '[aria-label="Perfis de Maria Silva"] [aria-label^="editor — Perfil personalizado —"]',
        true,
      );
      await dialogGet('[aria-label="Salvar perfis de Maria Silva"]').click();

      await vi.waitFor(() =>
        expect(
          dialogGet('.user-edit__roles [role="alert"]').textContent,
        ).not.toBe(""),
      );
      expect(
        document.body.querySelector('.user-edit [role="alert"]'),
      ).toBeNull();
      expect(putCalls).toBe(1);
    },
  );

  it("preserva chips e não consulta catálogo sem roles.view", async () => {
    const mocks = makeUsersRouteMocks([user]);
    let catalogCalls = 0;
    server.use(
      ...mocks.handlers,
      http.get(`${TEST_API_BASE}/api/v1/roles`, ({ request }) => {
        catalogCalls += 1;
        return HttpResponse.json(
          { data: [], links: {}, meta: {} },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    await mountModal(["users.assign-roles"]);

    expect(dialogGet('[role="status"]').textContent).toContain(
      "roles.view é necessária",
    );
    expect(
      dialogGet('[aria-label="Perfis selecionados"]').textContent,
    ).toContain("Usuário");
    expect(catalogCalls).toBe(0);
  });

  it("permite operador sem admin com roles.view e users.assign-roles", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountModal(
      ["roles.view", "users.assign-roles"],
      ["operator"],
    );

    await vi.waitFor(() =>
      expect(
        dialogGet('[aria-label^="editor — Perfil personalizado —"]'),
      ).toBeDefined(),
    );
    await setValue(
      '[aria-label="Perfis de Maria Silva"] [aria-label^="editor — Perfil personalizado —"]',
      true,
    );
    await dialogGet('[aria-label="Salvar perfis de Maria Silva"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("roles-saved")).toBeTruthy());
    expect(mocks.calls.find((call) => call.method === "PUT")?.body).toEqual({
      roles: ["user", "editor"],
    });
  });

  it("renderiza o rótulo Nome com asterisco inline", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    await mountModal();

    const label = dialogGet(".user-edit .form-label__text");
    expect(label.textContent?.replace(/\s+/g, " ")).toContain("Nome *");
    expect(label.querySelector(".required-mark")).not.toBeNull();
    expect(label.nextElementSibling?.tagName).toBe("INPUT");
  });
});
