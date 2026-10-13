import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";
import { delay, http, HttpResponse } from "msw";
import {
  makeAdminRole,
  makeAdminUser,
  makeUsersRouteMocks,
  type UsersRouteMocks,
} from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import UserDetailPage from "./UserDetailPage.vue";

const makeUser = () =>
  makeAdminUser({
    id: 7,
    name: "Maria Silva",
    email: "maria@example.test",
    email_verified_at: "2026-10-01T12:00:00Z",
    deactivated_at: null,
    roles: ["user"],
    cpf: "12345678909",
  });

const makeRouter = async (userId: string): Promise<Router> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      { path: "/users", name: "users", component: { template: "<div />" } },
      {
        path: "/users/:userId",
        name: "user-detail",
        component: { template: "<div />" },
      },
    ],
  });
  await router.push(`/users/${userId}`);
  await router.isReady();
  return router;
};

const rolesListHandler = http.get(
  `${TEST_API_BASE}/api/v1/roles`,
  async ({ request }) =>
    HttpResponse.json(
      {
        data: [
          makeAdminRole({ id: 1, name: "admin" }),
          makeAdminRole({ id: 2, name: "user" }),
        ],
        links: { first: null, last: null, prev: null, next: null },
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          path: "",
          per_page: 50,
          to: null,
          total: 2,
        },
      },
      { headers: makeCorsHeaders(request) },
    ),
);

const mountedWrappers: VueWrapper[] = [];

const mountPage = async (
  userId = "7",
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
  const wrapper = mount(UserDetailPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], await makeRouter(userId)],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
};

const useUserHandlers = (user = makeUser()): UsersRouteMocks => {
  const mocks = makeUsersRouteMocks([user]);
  server.use(...mocks.handlers, rolesListHandler);
  return mocks;
};

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

const setDialogValue = async (
  selector: string,
  value: string,
): Promise<void> => {
  const element = dialogGet<HTMLInputElement>(selector);
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const openEditModal = async (wrapper: VueWrapper): Promise<void> => {
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="edit-user"]').exists()).toBe(true),
  );
  await wrapper.get('[data-testid="edit-user"]').trigger("click");
  await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
};

const waitDialogClosed = async (): Promise<void> => {
  await vi.waitFor(() => expect(dialogElement()).toBeNull());
};

const confirmDialogButton = (label: string): HTMLButtonElement => {
  const dialog = [
    ...document.body.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ].at(-1);
  const button = [
    ...(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ].find((candidate) => candidate.textContent?.trim() === label);
  if (button === undefined)
    throw new Error(`Botão de confirmação não encontrado: ${label}`);
  return button;
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

describe("UserDetailPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("exibe email, status de verificação e perfis do usuário", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "maria@example.test",
      ),
    );
    expect(wrapper.find('[data-testid="user-verified"]').text()).toContain(
      "Verificado",
    );
    expect(wrapper.text()).toContain("Usuário");
    expect(wrapper.text()).toContain("Ver usuários");
    expect(wrapper.text()).not.toContain("users.view");
    expect(wrapper.get('a[href="/users"]').text()).toBe(
      "Voltar à lista de usuários",
    );
  });

  it("oculta o CPF sem a permissão users.read-cpf", async () => {
    useUserHandlers();
    const wrapper = await mountPage("7", ["users.view", "users.update"]);

    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="user-email"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="user-cpf"]').exists()).toBe(false);

    await openEditModal(wrapper);
    expect(
      dialogElement()?.querySelector('[data-testid="edit-cpf"]'),
    ).toBeNull();
  });

  it("exibe o CPF com a permissão users.read-cpf", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="user-cpf"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="user-cpf"]').text()).toContain(
      "123.456.789-09",
    );
  });

  it("salva edições de nome, email e cpf pelo mesmo modal da listagem", async () => {
    const mocks = useUserHandlers();
    const wrapper = await mountPage();

    await openEditModal(wrapper);
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLInputElement>('[data-testid="edit-name"]').value,
      ).toBe("Maria Silva"),
    );

    await setDialogValue('[data-testid="edit-name"]', "Maria Editada");
    await setDialogValue(
      '[data-testid="edit-email"]',
      "maria.nova@example.test",
    );
    await setDialogValue('[data-testid="edit-cpf"]', "98765432100");
    dialogGet('[data-testid="save-user"]').click();

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.method === "PATCH" &&
            call.path === "/api/v1/users/7" &&
            JSON.stringify(call.body) ===
              JSON.stringify({
                name: "Maria Editada",
                email: "maria.nova@example.test",
                cpf: "98765432100",
              }),
        ),
      ).toBe(true),
    );
    await waitDialogClosed();
    expect(wrapper.text()).toContain("Usuário atualizado com sucesso.");
  });

  it("bloqueia a saída nativa enquanto o estado está sujo", async () => {
    useUserHandlers();
    const wrapper = await mountPage();
    await openEditModal(wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Nome alterado");

    expect(beforeUnload().defaultPrevented).toBe(true);
  });

  it("não bloqueia a saída com estado limpo", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await openEditModal(wrapper);
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLInputElement>('[data-testid="edit-name"]').value,
      ).toBe("Maria Silva"),
    );

    expect(beforeUnload().defaultPrevented).toBe(false);
  });

  it("descarta as edições ao cancelar com confirmação e reabre limpo", async () => {
    useUserHandlers();
    const wrapper = await mountPage();
    await openEditModal(wrapper);
    await setDialogValue('[data-testid="edit-name"]', "Nome alterado");
    dialogGet('[data-testid="cancel-edit"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Descartar alterações").click();
    await waitDialogClosed();
    await openEditModal(wrapper);
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLInputElement>('[data-testid="edit-name"]').value,
      ).toBe("Maria Silva"),
    );
  });

  it("mostra erros por campo quando a edição recebe 422", async () => {
    useUserHandlers();
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
    const wrapper = await mountPage();

    await openEditModal(wrapper);
    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    await setDialogValue('[data-testid="edit-email"]', "tomada@example.test");
    dialogGet('[data-testid="save-user"]').click();

    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("O email já está em uso."),
    );

    expect(dialogElement()).not.toBeNull();
    expect(wrapper.find(".page-card [role=alert]").exists()).toBe(false);
  });

  it("mostra estado de carregamento enquanto busca o usuário", async () => {
    useUserHandlers();
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/users/:userId`, async ({ request }) => {
        await delay(80);
        return HttpResponse.json(
          { data: makeUser() },
          { headers: makeCorsHeaders(request) },
        );
      }),
    );
    const wrapper = await mountPage();

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it("mostra mensagem quando o usuário não existe", async () => {
    useUserHandlers();
    const wrapper = await mountPage("999");

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').exists()).toBe(true),
    );
    expect(wrapper.text()).toContain("não encontrado");
  });
});
