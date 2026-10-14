import { readFileSync } from "node:fs";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import {
  makeAdminRole,
  makePaginated,
  makeRolesRouteMocks,
} from "@/test/admin-handlers";
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

const makeMinimalRoles = () => [
  makeAdminRole({ id: 1, name: "admin" }),
  makeAdminRole({ id: 2, name: "user", permissions: ["users.view"] }),
];

const mountedWrappers: VueWrapper[] = [];

const mountPage = (
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
  const wrapper = mount(RolesPage, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { AppLayout: { template: "<div><slot /></div>" } },
    },
  });
  mountedWrappers.push(wrapper);
  return wrapper;
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

const confirmDialogButton = (text: string): HTMLButtonElement => {
  const dialog = [
    ...document.body.querySelectorAll<HTMLElement>('[role="dialog"]'),
  ].at(-1);
  const button = [
    ...(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ].find((candidate) => candidate.textContent?.trim() === text);
  if (button === undefined)
    throw new Error(`Botão de confirmação não encontrado: ${text}`);
  return button;
};

const openDialog = async (selector: string, wrapper: VueWrapper) => {
  await wrapper.get(selector).trigger("click");
  await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
};

const waitDialogClosed = async (): Promise<void> => {
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

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("RolesPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("teleports the disabled admin tooltip outside overflowing ancestors on hover and keyboard focus", async () => {
    server.use(...makeRolesRouteMocks(roles).handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    const actionsCell = wrapper.get("tbody tr .actions-cell--nowrap");
    const scrollContainer = wrapper.get(".table-wrap");
    const shell = wrapper
      .get('[aria-label="Editar permissões do perfil admin"]')
      .element.closest<HTMLElement>(".action-button-shell");
    const stylesheet = readFileSync(
      "src/features/roles/pages/RolesPage.vue",
      "utf8",
    );
    const actionsCellStyles = stylesheet.match(
      /\.actions-cell--nowrap\s*\{([^}]*)\}/,
    )?.[1];
    const tableWrapStyles = stylesheet.match(/\.table-wrap\s*\{([^}]*)\}/)?.[1];

    expect(scrollContainer.element.contains(actionsCell.element)).toBe(true);
    expect(tableWrapStyles).toMatch(/overflow-x:\s*auto/);
    expect(actionsCellStyles).toBeDefined();
    expect(actionsCellStyles).not.toMatch(/overflow(?:-[xy])?\s*:/);

    const assertTooltipIsOutsideOverflowingAncestors = () => {
      const describedBy = shell?.getAttribute("aria-describedby");
      const tooltip = describedBy ? document.getElementById(describedBy) : null;
      expect(tooltip).not.toBeNull();
      const portal = tooltip?.closest('[id^="q-portal--tooltip"]') ?? null;
      expect(portal?.parentElement).toBe(document.body);
      expect(scrollContainer.element.contains(portal)).toBe(false);
      let ancestor = portal?.parentElement ?? null;
      while (ancestor !== null) {
        expect(getComputedStyle(ancestor).overflow).toMatch(/^(visible|)$/);
        ancestor = ancestor.parentElement;
      }
      return tooltip;
    };

    shell?.dispatchEvent(new MouseEvent("mouseenter"));
    await vi.waitFor(() => {
      const tooltip = assertTooltipIsOutsideOverflowingAncestors();
      expect(tooltip?.textContent).toContain("Administrador");
    });
    shell?.dispatchEvent(new MouseEvent("mouseleave"));
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')).toBeNull(),
    );
    shell?.focus();
    shell?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await vi.waitFor(() => {
      const tooltip = assertTooltipIsOutsideOverflowingAncestors();
      expect(tooltip?.textContent).toContain("Administrador");
    });
  });

  it("lists roles and saves editable permissions while protecting admin", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    expect(wrapper.get("tbody").text()).toContain("Administrador");
    expect(wrapper.get("tbody").text()).toContain("Usuário");
    expect(wrapper.text()).toContain("Gerenciamento de Perfis");
    expect(wrapper.get('input[type="search"]').attributes("placeholder")).toBe(
      "Nome do perfil",
    );
    expect(wrapper.text()).toContain("user");
    const blockedAdminEdit = wrapper.get(
      '[aria-label="Editar permissões do perfil admin"]',
    );
    expect(blockedAdminEdit.attributes("disabled")).toBeDefined();
    const blockedAdminShell = blockedAdminEdit.element
      .parentElement as HTMLElement;
    expect(blockedAdminShell?.getAttribute("tabindex")).toBe("0");
    blockedAdminShell.focus();
    blockedAdminShell.dispatchEvent(
      new FocusEvent("focusin", { bubbles: true }),
    );
    await vi.waitFor(() =>
      expect(blockedAdminShell.getAttribute("aria-describedby")).toBeTruthy(),
    );
    expect(blockedAdminEdit.attributes("title")).toBeUndefined();
    const tooltipId = blockedAdminShell.getAttribute("aria-describedby");
    expect(document.getElementById(tooltipId ?? "")?.textContent).toBe(
      "Ação indisponível para o perfil Administrador.",
    );
    expect(blockedAdminEdit.attributes("aria-description")).toBe(
      "Ação indisponível para o perfil Administrador.",
    );
    expect(
      wrapper.get('[aria-label="Ver detalhes do perfil admin"]').classes(),
    ).toContain("action-button--info");

    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );
    expect(dialogElement()?.textContent).toContain("1 de 10 concedidas");
    await setDialogValue(
      '[aria-label="Permissão Ver auditoria para user"]',
      true,
    );
    dialogGet('[data-testid="submit-role-permissions"]').click();

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
    await waitDialogClosed();
    expect(wrapper.text()).toContain("Permissões atualizadas com sucesso.");
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

  it("keeps role search editable and displays the newest result first", async () => {
    const localRoles = [
      makeAdminRole({ id: 3, name: "Lento", permissions: [] }),
      makeAdminRole({ id: 4, name: "Rapido", permissions: [] }),
    ];
    const requested: string[] = [];
    const completed: string[] = [];
    server.use(...makeRolesRouteMocks([]).handlers);
    server.use(
      http.get(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        requested.push(search);
        await delay(search === "lento" ? 600 : 10);
        completed.push(search);
        const filtered = localRoles.filter((role) =>
          role.name.toLowerCase().includes(search.toLowerCase()),
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
    const wrapper = mountPage();
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lento"));

    const search = wrapper.get<HTMLInputElement>('input[type="search"]');
    await search.setValue("lento");
    await vi.waitFor(() => expect(requested).toContain("lento"));
    expect(search.element.disabled).toBe(false);

    await search.setValue("rapi");
    await vi.waitFor(() => expect(requested).toContain("rapi"));
    await vi.waitFor(() =>
      expect(wrapper.get("tbody").text()).toContain("Rapido"),
    );
    await vi.waitFor(() => expect(completed).toContain("lento"));

    expect(wrapper.get("tbody").text()).toContain("Rapido");
    expect(wrapper.get("tbody").text()).not.toContain("Lento");
  });

  it("disables the save button and shows loading while saving", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const permissionsWritten: unknown[] = [];
    server.use(
      http.put(
        `${TEST_API_BASE}/api/v1/roles/:roleId/permissions`,
        async ({ request, params }) => {
          await delay(80);
          permissionsWritten.push(await request.json());
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
    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );
    await setDialogValue(
      '[aria-label="Permissão Ver auditoria para user"]',
      true,
    );
    dialogGet('[data-testid="submit-role-permissions"]').click();

    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLButtonElement>('[data-testid="submit-role-permissions"]')
          .disabled,
      ).toBe(true),
    );
    expect(
      dialogGet('[data-testid="submit-role-permissions"]').textContent?.trim(),
    ).toBe("Salvando...");

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Permissões atualizadas com sucesso."),
    );
    await waitDialogClosed();
    expect(permissionsWritten).toHaveLength(1);
  });

  it("ignores duplicate submits while a request is pending", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );
    await setDialogValue(
      '[aria-label="Permissão Ver auditoria para user"]',
      true,
    );
    dialogGet('[data-testid="submit-role-permissions"]').click();
    dialogGet('[data-testid="submit-role-permissions"]').click();

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

  it("creates a role through the creation modal", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await openDialog(".page-toolbar button", wrapper);
    await setDialogValue('[aria-label="Nome do novo perfil"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

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
    await waitDialogClosed();
    expect(wrapper.text()).toContain("Perfil criado com sucesso.");
  });

  it("renames a custom role and invalidates user lists and profile chips", async () => {
    const localRoles = [
      ...makeMinimalRoles(),
      makeAdminRole({ id: 3, name: "manager", permissions: ["users.view"] }),
    ];
    const mocks = makeRolesRouteMocks(localRoles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("manager"));
    queryClient.setQueryData(["users", { page: 1 }], {
      data: [{ id: 7, roles: ["manager"] }],
    });
    queryClient.setQueryData(["user", 7], {
      data: { id: 7, roles: ["manager"] },
    });

    await openDialog('[aria-label="Ver detalhes do perfil manager"]', wrapper);
    await setDialogValue('[aria-label="Novo nome do perfil"]', "operador");
    dialogGet('[data-testid="rename-role"]').click();

    await vi.waitFor(() =>
      expect(wrapper.get("tbody").text()).toContain("operador"),
    );
    expect(mocks.calls.find((call) => call.method === "PATCH")?.body).toEqual({
      name: "operador",
    });
    expect(dialogGet('[data-testid="role-detail-name"]').textContent).toContain(
      "operador",
    );
    expect(
      queryClient.getQueryState(["users", { page: 1 }])?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(["user", 7])?.isInvalidated).toBe(true);
  });

  it("explica a recusa do servidor quando um perfil atribuído não pode ser excluído", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles(), {
      assignedRoleNames: ["user"],
    });
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await wrapper.get('[aria-label="Excluir perfil user"]').trigger("click");
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "Deseja excluir o perfil user?",
      ),
    );
    confirmDialogButton("Excluir perfil").click();
    await vi.waitFor(() =>
      expect(wrapper.get('[role="alert"]').text()).toContain(
        "O perfil user está atribuído a usuários e não pode ser excluído.",
      ),
    );
    expect(
      mocks.calls.some(
        (call) => call.method === "DELETE" && call.path === "/api/v1/roles/2",
      ),
    ).toBe(true);
  });

  it("applies the creation guard to cancel, Escape and backdrop", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await openDialog(".page-toolbar button", wrapper);
    await setDialogValue('[aria-label="Nome do novo perfil"]', "Rascunho");
    dialogGet('[data-testid="cancel-role-form"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(dialogElement()).not.toBeNull();
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("deletes a non-immutable role after confirmation", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Excluir perfil user"]').exists()).toBe(
        true,
      ),
    );
    expect(wrapper.find('[aria-label="Excluir perfil admin"]').exists()).toBe(
      false,
    );
    await wrapper.get('[aria-label="Excluir perfil user"]').trigger("click");
    confirmDialogButton("Excluir perfil").click();
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) => call.method === "DELETE" && call.path === "/api/v1/roles/2",
        ),
      ).toBe(true),
    );
  });

  it("mostra erros por campo quando a criação recebe 422", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) =>
        HttpResponse.json(
          {
            message: "Dados inválidos.",
            errors: { name: ["O nome do perfil já existe."] },
          },
          { status: 422, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
    );
    await openDialog(".page-toolbar button", wrapper);
    await setDialogValue('[aria-label="Nome do novo perfil"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain(
        "O nome do perfil já existe.",
      ),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Nome do novo perfil"]').value,
    ).toBe("auditor");
    expect(wrapper.find(".page-card [role=alert]").exists()).toBe(false);
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

  it("edita as permissões em modal com grupos expansíveis sem selecionar a linha", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );

    const expansion = dialogGet('[aria-label="Permissões do grupo Usuários"]');
    expect(expansion.getAttribute("role")).toBe("button");
    expect(expansion.getAttribute("aria-expanded")).toBe("true");

    await expansion.dispatchEvent(new Event("click", { bubbles: true }));
    await vi.waitFor(() =>
      expect(
        dialogGet('[aria-label="Permissões do grupo Usuários"]').getAttribute(
          "aria-expanded",
        ),
      ).toBe("false"),
    );

    await dialogGet(
      '[aria-label="Permissões do grupo Usuários"]',
    ).dispatchEvent(new Event("click", { bubbles: true }));
    await setDialogValue(
      '[aria-label="Permissão Ver auditoria para user"]',
      true,
    );
    dialogGet('[data-testid="submit-role-permissions"]').click();

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

describe("RolesPage — forms em modal", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("não abre edição de permissões para o perfil protegido nem grava nada", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    const adminTrigger = wrapper.get(
      '[aria-label="Editar permissões do perfil admin"]',
    );
    expect(adminTrigger.attributes("disabled")).toBeDefined();

    adminTrigger.element.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    await Promise.resolve();
    expect(dialogElement()).toBeNull();
    expect(
      mocks.calls.filter(
        (call) => call.method === "PUT" && call.path.includes("/permissions"),
      ),
    ).toHaveLength(0);
  });

  it("pede descarte para permissões sujas e reabre sem herdar draft", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );
    await setDialogValue(
      '[aria-label="Permissão Ver auditoria para user"]',
      true,
    );
    dialogGet('[data-testid="cancel-role-form"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(dialogElement()).not.toBeNull();
    expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(0);

    dialogGet('[data-testid="cancel-role-form"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Descartar alterações").click();
    await waitDialogClosed();
    await openDialog(
      '[aria-label="Editar permissões do perfil user"]',
      wrapper,
    );
    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain("1 de 10 concedidas"),
    );
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para user"]',
      ).checked,
    ).toBe(false);
  });

  it("esconde as ações sem permissão de perfis", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage(["roles.view"]);

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    expect(wrapper.find(".page-toolbar button").exists()).toBe(false);
    expect(
      wrapper.find('[aria-label="Editar permissões do perfil user"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[aria-label="Excluir perfil user"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[aria-label="Ver detalhes do perfil user"]').exists(),
    ).toBe(true);
    expect(dialogElement()).toBeNull();
  });
});

describe("RolesPage — seleção", () => {
  it("renders the roles list without selection checkboxes", async () => {
    server.use(...makeRolesRouteMocks(makeMinimalRoles()).handlers);
    const wrapper = await mountPage();
    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    expect(wrapper.find("input[type=checkbox]").exists()).toBe(false);
  });
});

describe("RolesPage — paginação e consulta", () => {
  it("volta à primeira página ao alterar itens por página", async () => {
    const roles = Array.from({ length: 20 }, (_, index) =>
      makeAdminRole({
        id: index + 1,
        name: `perfil-${index + 1}`,
        permissions: [],
      }),
    );
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
        true,
      ),
    );
    await wrapper
      .get<HTMLSelectElement>('select[aria-label="Itens por página"]')
      .setValue("5");

    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("page") === "1" &&
            call.query.get("per_page") === "5",
        ),
      ).toBe(true),
    );
    expect(wrapper.text()).toContain("perfil-1");
  });

  it("abre e fecha a consulta do perfil em modo somente leitura", async () => {
    server.use(...makeRolesRouteMocks(makeMinimalRoles()).handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(wrapper.find("tbody tr").exists()).toBe(true),
    );
    await wrapper
      .get('[aria-label="Ver detalhes do perfil user"]')
      .trigger("click");
    await vi.waitFor(() =>
      expect(dialogElement()?.textContent).toContain(
        "Detalhes do perfil Usuário",
      ),
    );
    expect(dialogElement()?.textContent).toContain("Ver usuários");
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
    expect(
      [...dialogElement()!.querySelectorAll("button")].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(["Fechar"]);
    dialogGet('[data-testid="close-role-details"]').click();
    await waitDialogClosed();
  });
});
