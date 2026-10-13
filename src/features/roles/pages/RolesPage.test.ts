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

const makeRoles = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    makeAdminRole({
      id: index + 1,
      name: index === 0 ? "admin" : `perfil-${index + 1}`,
      permissions: index === 1 ? ["users.view"] : [],
    }),
  );

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

const counter = (wrapper: VueWrapper) => wrapper.get(".selection-counter");
const headerCheckbox = (wrapper: VueWrapper) =>
  wrapper.get<HTMLInputElement>(
    '[aria-label="Selecionar todos os perfis desta página"]',
  );
const rowCheckbox = (wrapper: VueWrapper, name: string) =>
  wrapper.get<HTMLInputElement>(`[aria-label="Selecionar ${name}"]`);

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

const dialogClose = (): HTMLButtonElement | undefined =>
  [...(dialogElement()?.querySelectorAll("button") ?? [])].find(
    (button) => button.textContent?.trim() === "Fechar",
  );

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

const pressEscape = (): void => {
  for (const type of ["keydown", "keyup"]) {
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", keyCode: 27, bubbles: true }),
    );
  }
};

const pressBackdrop = (): void => {
  document.body
    .querySelector(".q-dialog__backdrop")
    ?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
};

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("RolesPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("shows the disabled admin action tooltip on hover and keyboard focus in the scrollable action row", async () => {
    server.use(...makeRolesRouteMocks(roles).handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("admin"));
    const actionsCell = wrapper.get("tbody tr .actions-cell--nowrap");
    const shell = wrapper
      .get('[aria-label="Editar permissões do perfil admin"]')
      .element.closest(".action-button-shell");
    const tooltip = shell?.querySelector('[role="tooltip"]');

    expect(actionsCell.classes()).toContain("actions-cell--nowrap");
    shell?.dispatchEvent(new Event("mouseenter"));
    await vi.waitFor(() =>
      expect(tooltip?.classList).toContain("action-button-tooltip--visible"),
    );
    shell?.dispatchEvent(new Event("mouseleave"));
    shell?.dispatchEvent(new Event("focusin"));
    await vi.waitFor(() =>
      expect(tooltip?.classList).toContain("action-button-tooltip--visible"),
    );
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
    const blockedAdminShell = blockedAdminEdit.element.parentElement;
    expect(blockedAdminShell?.getAttribute("tabindex")).toBe("0");
    expect(blockedAdminShell?.getAttribute("aria-describedby")).toBeTruthy();
    expect(blockedAdminEdit.attributes("title")).toBeUndefined();
    expect(
      blockedAdminShell?.querySelector('[role="tooltip"]')?.textContent,
    ).toBe("Ação indisponível para o perfil Administrador.");
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
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
      await wrapper.get('[aria-label="Excluir perfil user"]').trigger("click");

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
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("applies the creation guard to cancel, Escape and backdrop", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    try {
      await vi.waitFor(() =>
        expect(wrapper.find(".page-toolbar button").exists()).toBe(true),
      );
      await openDialog(".page-toolbar button", wrapper);
      await setDialogValue('[aria-label="Nome do novo perfil"]', "Rascunho");

      dialogGet('[data-testid="cancel-role-form"]').click();
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(dialogElement()).not.toBeNull();

      pressEscape();
      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(dialogElement()).not.toBeNull();

      pressBackdrop();
      expect(confirmSpy).toHaveBeenCalledTimes(3);
      expect(dialogElement()).not.toBeNull();

      confirmSpy.mockReturnValue(true);
      pressEscape();
      await waitDialogClosed();
      expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
        0,
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("deletes a non-immutable role after confirmation", async () => {
    const mocks = makeRolesRouteMocks(roles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    try {
      await vi.waitFor(() =>
        expect(
          wrapper.find('[aria-label="Excluir perfil user"]').exists(),
        ).toBe(true),
      );
      expect(wrapper.find('[aria-label="Excluir perfil admin"]').exists()).toBe(
        false,
      );
      await wrapper.get('[aria-label="Excluir perfil user"]').trigger("click");

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

    expect(counter(wrapper).text()).toContain("0 de 2 selecionados");
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
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    try {
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
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(dialogElement()).not.toBeNull();

      confirmSpy.mockReturnValue(true);
      dialogGet('[data-testid="cancel-role-form"]').click();
      await waitDialogClosed();
      expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(
        0,
      );

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
    } finally {
      confirmSpy.mockRestore();
    }
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

describe("RolesPage — seleção por página", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("altera itens por página, volta à primeira e limpa a seleção", async () => {
    const mocks = makeRolesRouteMocks(makeRoles(20));
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(
        mocks.calls.some((call) => call.query.get("per_page") === "15"),
      ).toBe(true),
    );
    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");
    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    await rowCheckbox(wrapper, "perfil-16").setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 5 selecionados");

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
    expect(counter(wrapper).text()).toContain("0 de 5 selecionados");
  });

  it("seleciona todos os IDs da página e limpa com um novo clique no header", async () => {
    const localRoles = makeRoles(5);
    const mocks = makeRolesRouteMocks(localRoles);
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    expect(headerCheckbox(wrapper).attributes("disabled")).toBeUndefined();

    await rowCheckbox(wrapper, "perfil-2").setValue(true);

    expect(headerCheckbox(wrapper).element.indeterminate).toBe(true);
    expect(counter(wrapper).text()).toContain("1 de 5 selecionados");

    await headerCheckbox(wrapper).setValue(true);

    expect(counter(wrapper).text()).toContain("5 de 5 selecionados");
    expect(rowCheckbox(wrapper, "admin").element.checked).toBe(true);
    expect(headerCheckbox(wrapper).element.indeterminate).toBe(false);

    await headerCheckbox(wrapper).setValue(false);

    expect(counter(wrapper).text()).toContain("0 de 5 selecionados");
    expect(rowCheckbox(wrapper, "perfil-2").element.checked).toBe(false);

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

    await wrapper.get("label.ui-search input").setValue("perfil-2");
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
    await rowCheckbox(wrapper, "perfil-2").setValue(true);
    expect(counter(wrapper).text()).toContain("1 de 15 selecionados");

    await wrapper.get('button[aria-label="Próxima página"]').trigger("click");

    await vi.waitFor(() =>
      expect(counter(wrapper).text()).toContain("0 de 5 selecionados"),
    );
    expect(mocks.calls.some((call) => call.query.get("page") === "2")).toBe(
      true,
    );
    expect(wrapper.text()).toContain("perfil-20");

    await wrapper.get("label.ui-search input").setValue("perfil-1");
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.query.get("page") === "1" &&
            call.query.get("search") === "perfil-1",
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
    await rowCheckbox(wrapper, "perfil-3").setValue(true);
    await rowCheckbox(wrapper, "perfil-4").setValue(true);
    expect(counter(wrapper).text()).toContain("2 de 5 selecionados");

    localRoles.splice(
      localRoles.findIndex((role) => role.name === "perfil-4"),
      1,
    );
    await queryClient.invalidateQueries({ queryKey: ["roles"] });

    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Selecionar perfil-4"]').exists()).toBe(
        false,
      ),
    );
    expect(counter(wrapper).text()).toContain("1 de 4 selecionados");
    expect(rowCheckbox(wrapper, "perfil-3").element.checked).toBe(true);
  });

  it("abre a consulta do perfil em modal somente leitura sem selecionar a linha", async () => {
    const mocks = makeRolesRouteMocks(makeMinimalRoles());
    server.use(...mocks.handlers);
    const wrapper = mountPage();

    await vi.waitFor(() => expect(wrapper.text()).toContain("user"));
    await wrapper
      .get('[aria-label="Ver detalhes do perfil user"]')
      .trigger("click");

    await vi.waitFor(() => expect(dialogElement()).not.toBeNull());
    const dialog = dialogElement() as HTMLElement;
    expect(dialog.textContent).toContain("Detalhes do perfil Usuário");
    expect(dialog.textContent).toContain("Usuários");
    expect(dialog.textContent).toContain("Perfis");
    expect(dialog.textContent).toContain("Auditoria");
    expect(dialog.textContent).toContain("Ver usuários");
    expect(dialog.textContent).not.toMatch(/concedida/i);

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
