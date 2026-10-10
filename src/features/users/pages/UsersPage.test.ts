import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { makeAdminUser, makeUsersRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import UsersPage from "./UsersPage.vue";

const users = Array.from({ length: 16 }, (_, index) =>
  makeAdminUser({
    id: index + 1,
    name: `Pessoa ${index + 1}`,
    email: `pessoa${index + 1}@example.test`,
    roles: index === 0 ? ["admin"] : ["user"],
  }),
);

const mountPage = () => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...CATALOGUE_PERMISSIONS],
  };
  return mount(UsersPage, {
    global: {
      plugins: [VueQueryPlugin],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
};

describe("UsersPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("lists users and changes pages", async () => {
    const mocks = makeUsersRouteMocks(users);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

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

    await wrapper.get('[aria-label="Próxima página"]').trigger("click");
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
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Nome de Pessoa 1"]').exists()).toBe(
        true,
      ),
    );
    await wrapper
      .get('input[aria-label="Buscar usuários"]')
      .setValue("Pessoa 2");
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
    server.use(...mocks.handlers);
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
    const wrapper = mountPage();

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
    server.use(...mocks.handlers);
    const wrapper = mountPage();

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
    server.use(...mocks.handlers);
    const wrapper = mountPage();

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
    server.use(...mocks.handlers);
    const wrapper = mountPage();
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
});
