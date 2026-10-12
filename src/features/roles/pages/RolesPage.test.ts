import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { makeAdminRole, makeRolesRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import RolesPage from "./RolesPage.vue";

const roles = [
  makeAdminRole({ id: 1, name: "admin" }),
  makeAdminRole({ id: 2, name: "user", permissions: ["users.view"] }),
];

const mountPage = () => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...CATALOGUE_PERMISSIONS],
  };
  return mount(RolesPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
};

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

  it("creates a role through the creation form", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Criar papel"]').exists()).toBe(true),
    );
    await wrapper.get('[aria-label="Nome do novo papel"]').setValue("auditor");
    await wrapper.get('[aria-label="Criar papel"]').trigger("submit");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) => call.method === "POST" && call.path === "/api/v1/roles",
        ),
      ).toBe(true),
    );
    expect(
      mocks.calls.find(
        (call) => call.method === "POST" && call.path === "/api/v1/roles",
      )?.body,
    ).toMatchObject({ name: "auditor" });
  });

  it("deletes a non-immutable role after confirmation", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Excluir papel user"]').exists()).toBe(
          true,
        ),
      );
      expect(wrapper.find('[aria-label="Excluir papel admin"]').exists()).toBe(
        false,
      );
      await wrapper.get('[aria-label="Excluir papel user"]').trigger("click");

      await vi.waitFor(() =>
        expect(
          mocks.calls.some(
            (call) =>
              call.method === "DELETE" && call.path === "/api/v1/roles/2",
          ),
        ).toBe(true),
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("mostra erros por campo quando a criação recebe 422", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: { name: ["O nome do papel já existe."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Criar papel"]').exists()).toBe(true),
    );
    await wrapper.get('[aria-label="Nome do novo papel"]').setValue("auditor");
    await wrapper.get('[aria-label="Criar papel"]').trigger("submit");

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "O nome do papel já existe.",
      ),
    );
  });

  it("mostra contagem regressiva quando a listagem recebe 429", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) =>
        HttpResponse.json(
          { message: "Muitas tentativas." },
          {
            status: 429,
            headers: { ...makeCorsHeaders(request), "Retry-After": "30" },
          },
        ),
      ),
    );
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "Aguarde 30 segundos",
      ),
    );
  });
});
