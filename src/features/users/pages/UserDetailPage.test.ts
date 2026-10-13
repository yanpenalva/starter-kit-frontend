import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";
import { delay, http, HttpResponse } from "msw";
import {
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
  return mount(UserDetailPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], await makeRouter(userId)],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
};

const useUserHandlers = (user = makeUser()): UsersRouteMocks => {
  const mocks = makeUsersRouteMocks([user]);
  server.use(...mocks.handlers);
  return mocks;
};

describe("UserDetailPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("exibe email, status de verificação e papéis do usuário", async () => {
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
    expect(wrapper.text()).toContain("user");
  });

  it("oculta o CPF sem a permissão users.read-cpf", async () => {
    useUserHandlers();
    const wrapper = await mountPage("7", ["users.view", "users.update"]);

    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="user-email"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="user-cpf"]').exists()).toBe(false);
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

  it("salva edições de nome, email e cpf via PATCH", async () => {
    const mocks = useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[data-testid="edit-name"]').element
          .value,
      ).toBe("Maria Silva"),
    );
    await wrapper.get('[data-testid="edit-name"]').setValue("Maria Editada");
    await wrapper
      .get('[data-testid="edit-email"]')
      .setValue("maria.nova@example.test");
    await wrapper.get('[data-testid="edit-cpf"]').setValue("98765432100");
    await wrapper.get("form").trigger("submit");

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
  });

  it("bloqueia a saída com estado sujo e confirmação", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[data-testid="edit-name"]').element
          .value,
      ).toBe("Maria Silva"),
    );
    await wrapper.get('[data-testid="edit-name"]').setValue("Nome alterado");

    const guarded = (
      wrapper.vm as unknown as {
        beforeWindowUnload: (event: BeforeUnloadEvent) => void;
      }
    ).beforeWindowUnload;
    const event = new Event("beforeunload", { cancelable: true });
    guarded(event as BeforeUnloadEvent);
    expect(event.defaultPrevented).toBe(true);
  });

  it("não bloqueia a saída com estado limpo", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[data-testid="edit-name"]').element
          .value,
      ).toBe("Maria Silva"),
    );

    const guarded = (
      wrapper.vm as unknown as {
        beforeWindowUnload: (event: BeforeUnloadEvent) => void;
      }
    ).beforeWindowUnload;
    const event = new Event("beforeunload", { cancelable: true });
    guarded(event as BeforeUnloadEvent);
    expect(event.defaultPrevented).toBe(false);
  });

  it("reseta o formulário ao cancelar as edições", async () => {
    useUserHandlers();
    const wrapper = await mountPage();

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[data-testid="edit-name"]').element
          .value,
      ).toBe("Maria Silva"),
    );
    await wrapper.get('[data-testid="edit-name"]').setValue("Nome alterado");
    await wrapper.get('[data-testid="cancel-edit"]').trigger("click");

    expect(
      wrapper.get<HTMLInputElement>('[data-testid="edit-name"]').element.value,
    ).toBe("Maria Silva");
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

    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLInputElement>('[data-testid="edit-email"]').element
          .value,
      ).toBe("maria@example.test"),
    );
    await wrapper
      .get('[data-testid="edit-email"]')
      .setValue("tomada@example.test");
    await wrapper.get("form").trigger("submit");

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "O email já está em uso.",
      ),
    );
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
