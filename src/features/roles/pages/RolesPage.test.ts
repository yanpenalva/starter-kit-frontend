import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { makeAdminRole, makeRolesRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import RolesPage from "./RolesPage.vue";

const roles = [
  makeAdminRole({ id: 1, name: "admin" }),
  makeAdminRole({ id: 2, name: "user", permissions: ["users.view"] }),
];

const mountPage = () =>
  mount(RolesPage, {
    global: {
      plugins: [VueQueryPlugin],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });

describe("RolesPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("lists roles and saves editable permissions while protecting admin", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    expect(wrapper.text()).toContain("user");
    expect(
      wrapper
        .get('[aria-label="Editar permissões de admin"]')
        .attributes("disabled"),
    ).toBeDefined();

    await wrapper
      .get('[aria-label="Permissão Ver auditoria para user"]')
      .setValue(true);
    await wrapper
      .get('[aria-label="Editar permissões de user"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.path === "/api/v1/roles/2/permissions" &&
            Array.isArray(
              (call.body as { permissions?: unknown[] }).permissions,
            ) &&
            (call.body as { permissions: string[] }).permissions.includes(
              "logs.view",
            ),
        ),
      ).toBe(true),
    );
  });

  it("filters and paginates roles", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    await wrapper.get('input[aria-label="Buscar papéis"]').setValue("user");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("search") === "user"),
      ).toBe(true),
    );
  });

  it("disables the save button and shows loading while saving", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    server.use(
      http.put(
        `${TEST_API_BASE}/api/v1/roles/:roleId/permissions`,
        async ({ request, params }) => {
          await delay(80);
          const role = roles.find(
            (candidate) => String(candidate.id) === String(params.roleId),
          );
          return HttpResponse.json(
            { data: role },
            { headers: makeCorsHeaders(request) },
          );
        },
      ),
    );
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    const saveButton = wrapper.get('[aria-label="Editar permissões de user"]');
    void saveButton.trigger("click");

    await vi.waitFor(() =>
      expect(saveButton.attributes("disabled")).toBeDefined(),
    );
    expect(saveButton.text()).toBe("Salvando...");

    await vi.waitFor(() =>
      expect(
        wrapper.get('[aria-label="Editar permissões de user"]').text(),
      ).toBe("Salvar permissões"),
    );
  });

  it("ignores duplicate submits while a request is pending", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    void wrapper
      .get('[aria-label="Editar permissões de user"]')
      .trigger("click");
    void wrapper
      .get('[aria-label="Editar permissões de user"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(
        mocks.calls.filter(
          (call) =>
            call.method === "PUT" &&
            call.path === "/api/v1/roles/2/permissions",
        ),
      ).toHaveLength(1),
    );
  });
});
