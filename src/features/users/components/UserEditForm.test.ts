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
) => {
  queryClient.clear();
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
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

  it("salva papéis em chamada separada e não apaga o feedback do bloco de dados", async () => {
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

    // A falha dos dados não impede o salvamento separado dos papéis.
    await setValue(
      '[aria-label="Papéis de Maria Silva"] input[aria-label="Papel editor"][role="option"]',
      true,
    );
    dialogGet('[aria-label="Salvar papéis de Maria Silva"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("roles-saved")).toBeTruthy());
    expect(
      mocks.calls.find(
        (call) =>
          call.method === "PUT" && call.path === "/api/v1/users/7/roles",
      )?.body,
    ).toEqual({ roles: ["user", "editor"] });
    // Erro do bloco de dados continua visível e não vira erro de papéis.
    expect(document.body.textContent).toContain("O email já está em uso.");
    expect(wrapper.emitted("profile-saved")).toBeUndefined();
  });

  it("bloqueia a saída com beforeunload sujo e libera depois de salvar", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    const wrapper = await mountModal();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    try {
      expect(beforeUnload().defaultPrevented).toBe(false);

      await setValue('[data-testid="edit-name"]', "Maria Editada");
      expect(beforeUnload().defaultPrevented).toBe(true);

      confirmSpy.mockReturnValue(true);
      dialogGet('[data-testid="save-user"]').click();
      await vi.waitFor(() =>
        expect(wrapper.emitted("profile-saved")).toBeTruthy(),
      );

      // Salvo: o estado deixou de ser sujo.
      expect(beforeUnload().defaultPrevented).toBe(false);
    } finally {
      confirmSpy.mockRestore();
    }
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
    expect(
      document.body.querySelector('[aria-label="Papéis de Maria Silva"]'),
    ).not.toBeNull();

    document.body
      .querySelector('[role="dialog"]')
      ?.querySelectorAll("button")
      .forEach((button) => button.click());
    await Promise.resolve();
    expect(mocks.calls.filter((call) => call.method === "PATCH")).toHaveLength(
      0,
    );
  });

  it("sem users.assign-roles mostra os papéis como leitura", async () => {
    const mocks = makeUsersRouteMocks([user]);
    server.use(...mocks.handlers, rolesListHandler);
    await mountModal(["users.view", "users.update"]);

    expect(
      document.body.querySelector('[aria-label="Papéis de Maria Silva"]'),
    ).toBeNull();
    expect(dialogGet("[data-testid=roles-readonly]").textContent).toBe("user");
  });
});
