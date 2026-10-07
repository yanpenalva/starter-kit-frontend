import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAdminUser, makeUsersRouteMocks } from "@/test/admin-handlers";
import { server } from "@/test/server";
import UsersPage from "./UsersPage.vue";

const users = Array.from({ length: 16 }, (_, index) =>
  makeAdminUser({
    id: index + 1,
    name: `Pessoa ${index + 1}`,
    email: `pessoa${index + 1}@example.test`,
    roles: index === 0 ? ["admin"] : ["user"],
  }),
);

const mountPage = () =>
  mount(UsersPage, {
    global: {
      plugins: [VueQueryPlugin],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });

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
});
