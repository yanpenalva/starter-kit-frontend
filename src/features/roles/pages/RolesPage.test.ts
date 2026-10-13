import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const makeRoles = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    makeAdminRole({
      id: index + 1,
      name: index === 0 ? "admin" : `papel-${index + 1}`,
      permissions: index === 1 ? ["users.view"] : [],
    }),
  );

// Fixture própria dos casos novos: os handlers de criação/exclusão mutam o
// array recebido, então cada caso parte de uma lista nova.
const makeMinimalRoles = () => [
  makeAdminRole({ id: 1, name: "admin" }),
  makeAdminRole({ id: 2, name: "user", permissions: ["users.view"] }),
];

const mountedWrappers: VueWrapper[] = [];

const mountPage = () => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...CATALOGUE_PERMISSIONS],
  };
  // Cache limpo por caso: o queryClient é compartilhado pelo arquivo.
  queryClient.clear();
  const wrapper = mount(RolesPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
};

const counter = (wrapper: VueWrapper) => wrapper.get(".selection-counter");
const headerCheckbox = (wrapper: VueWrapper) =>
  wrapper.get<HTMLInputElement>(
    '[aria-label="Selecionar todos os papéis desta página"]',
  );
const rowCheckbox = (wrapper: VueWrapper, name: string) =>
  wrapper.get<HTMLInputElement>(`[aria-label="Selecionar ${name}"]`);

// O diálogo é renderizado em Teleport no document.body pelo Quasar.
const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogClose = (): HTMLButtonElement | undefined =>
  [...(dialogElement()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent?.trim() === "Fechar",
  );

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
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
    await wrapper.get("label.ui-search input").setValue("user");
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

  it("mantém as permissões densas recolhidas e editáveis na expansão", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));

    const expansion = wrapper.get('[aria-label="Permissões de user"]');
    expect(expansion.attributes("role")).toBe("button");
    expect(expansion.attributes("aria-expanded")).toBe("false");
    expect(wrapper.text()).toContain("1 de 10 concedidas");

    await expansion.trigger("click");
    expect(
      wrapper
        .get('[aria-label="Permissões de user"]')
        .attributes("aria-expanded"),
    ).toBe("true");
    expect(wrapper.text()).toContain("Editar permissões de papéis");

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
            (call.body as { permissions: string[] }).permissions.includes(
              "logs.view",
            ),
        ),
      ).toBe(true),
    );
  });
});

describe("RolesPage — seleção por página", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("seleciona todos os IDs da página e limpa com um novo clique no header", async () => {
    const localRoles = makeRoles(5);
    const mocks = makeRolesRouteMocks(localRoles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined();

    await rowCheckbox(wrapper, "papel-2").setValue(true);

    expect(headerCheckbox(wrapper).element.indeterminate).toBe(true);
    expect(counter(wrapper).text()).toContain("1 de 5 selecionados");

    await headerCheckbox(wrapper).setValue(true);

    expect(counter(wrapper).text()).toContain("5 de 5 selecionados");
    expect(rowCheckbox(wrapper, "admin").element.checked).toBe(true);
    expect(headerCheckbox(wrapper).element.indeterminate).toBe(false);

    await headerCheckbox(wrapper).setValue(false);

    expect(counter(wrapper).text()).toContain("0 de 5 selecionados");
    expect(rowCheckbox(wrapper, "papel-2").element.checked).toBe(false);

    // Selecionar papéis não dispara escrita nenhuma.
    expect(mocks.calls.filter((call) => call.method !== "GET")).toHaveLength(0);
  });

  it("limpa a seleção ao buscar e ao paginar uma fixture multipágina", async () => {
    const localRoles = makeRoles(20);
    const mocks = makeRolesRouteMocks(localRoles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await rowCheckbox(wrapper, "admin").setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get("label.ui-search input").setValue("papel-2");
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 2 selecionados"),
    );

    await wrapper.get("label.ui-search input").setValue("");
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 15 selecionados"),
    );
    await vi.waitFor(() =>
      expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined(),
    );
    await rowCheckbox(wrapper, "papel-2").setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
    expect(wrapper.text()).toContain("papel-20");

    // A busca volta para a primeira página mesmo estando na segunda.
    await wrapper.get("label.ui-search input").setValue("papel-1");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("page") === "1" &&
            call.query.get("search") === "papel-1",
        ),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 10 selecionados"),
    );
  });

  it("mantém após refetch somente os IDs ainda presentes", async () => {
    const localRoles = makeRoles(5);
    const mocks = makeRolesRouteMocks(localRoles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    await rowCheckbox(wrapper, "papel-3").setValue(true);
    await rowCheckbox(wrapper, "papel-4").setValue(true);
    expect(counter(wrapper).text()).toContain("2 de 5 selecionados");

    localRoles.splice(
      localRoles.findIndex((role) => role.name === "papel-4"),
      1,
    );
    await queryClient.invalidateQueries({ queryKey: ["roles"] });

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Selecionar papel-4"]').exists()).toBe(
        false,
      ),
    );
    expect(counter(wrapper).text()).toContain("1 de 4 selecionados");
    expect(rowCheckbox(wrapper, "papel-3").element.checked).toBe(true);
  });

  it("abre a consulta do papel em modal somente leitura sem selecionar a linha", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await wrapper
      .get('[aria-label="Ver detalhes do papel user"]')
      .trigger("click");

    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    const dialog = dialogElement() as HTMLElement;
    expect(dialog.textContent).toContain("Detalhes do papel user");
    expect(dialog.textContent).toContain("Usuários");
    expect(dialog.textContent).toContain("Papéis");
    expect(dialog.textContent).toContain("Auditoria");
    expect(dialog.textContent).toContain("Ver usuários");
    expect(dialog.textContent).toContain("Não concedida");
    // Somente leitura: nenhum controle de escrita é oferecido na consulta.
    expect(dialog.querySelectorAll("input")).toHaveLength(0);
    expect(
      [...dialog.querySelectorAll("button")].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(["Fechar"]);

    expect(counter(wrapper).text()).toContain("0 de 2 selecionados");

    dialogClose()?.click();
    await vi.waitFor(() => expect(dialogElement()).toBeNull());
  });
});
