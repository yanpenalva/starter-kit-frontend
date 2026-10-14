import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { makeAdminRole, makeRolesRouteMocks } from "@/test/admin-handlers";
import { makeCorsHeaders, TEST_API_BASE } from "@/test/http-handlers";
import { server } from "@/test/server";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import { queryClient } from "@/app/providers/query";
import RoleFormModal from "./RoleFormModal.vue";

const userRole = makeAdminRole({
  id: 2,
  name: "user",
  permissions: ["users.view"],
});
const adminRole = makeAdminRole({ id: 1, name: "admin" });

const mountedWrappers: VueWrapper[] = [];

const mountModal = async (
  props: { mode: "create" | "edit"; role?: ReturnType<typeof makeAdminRole> },
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
  const wrapper = mount(RoleFormModal, {
    attachTo: document.body,
    props: { modelValue: true, ...props },
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

afterEach(() => {
  while (mountedWrappers.length > 0) {
    mountedWrappers.pop()?.unmount();
  }
  document.body.innerHTML = "";
});

describe("RoleFormModal — criação", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("cria o perfil com o payload atual de nome", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(
      mocks.calls.find(
        (call) => call.method === "POST" && call.path === "/api/v1/roles",
      )?.body,
    ).toEqual({ name: "auditor" });
  });

  it("cria primeiro o perfil e depois atribui as permissões selecionadas", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    await setValue(
      '[aria-label="Permissão Ver auditoria para novo perfil"]',
      true,
    );
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(mocks.calls.find((call) => call.method === "POST")?.body).toEqual({
      name: "auditor",
    });
    expect(mocks.calls.find((call) => call.method === "PUT")?.body).toEqual({
      permissions: ["logs.view"],
    });
  });

  it("locks permission selectors while assigning the submitted selection", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    let releasePut: (() => void) | undefined;
    let putStarted: (() => void) | undefined;
    let releasePost: (() => void) | undefined;
    let postStarted: (() => void) | undefined;
    let submittedPermissions: string[] = [];
    let submittedName = "";
    const putPending = new Promise<void>((resolve) => {
      releasePut = resolve;
    });
    const started = new Promise<void>((resolve) => {
      putStarted = resolve;
    });
    const postPending = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postStartedPromise = new Promise<void>((resolve) => {
      postStarted = resolve;
    });
    server.use(...mocks.handlers);
    server.use(
      http.post(`${TEST_API_BASE}/api/v1/roles`, async ({ request }) => {
        submittedName = ((await request.json()) as { name: string }).name;
        postStarted?.();
        await postPending;
        return HttpResponse.json(
          { data: makeAdminRole({ id: 3, name: "auditor", permissions: [] }) },
          { status: 201, headers: makeCorsHeaders(request) },
        );
      }),
      http.put(
        `${TEST_API_BASE}/api/v1/roles/:roleId/permissions`,
        async ({ request }) => {
          putStarted?.();
          submittedPermissions = (
            (await request.clone().json()) as { permissions: string[] }
          ).permissions;
          await putPending;
          return HttpResponse.json(
            {
              data: {
                ...makeAdminRole({ id: 3, name: "auditor" }),
                permissions: ["users.view"],
              },
            },
            { headers: makeCorsHeaders(request) },
          );
        },
      ),
    );
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    await setValue(
      '[aria-label="Permissão Ver usuários para novo perfil"]',
      true,
    );
    dialogGet('[data-testid="submit-create-role"]').click();
    await postStartedPromise;

    for (const selector of [
      '[aria-label="Selecionar todas as permissões"]',
      '[aria-label="Selecionar todas as permissões de Usuários"]',
      '[aria-label="Permissão Ver usuários para novo perfil"]',
    ]) {
      expect(dialogGet<HTMLInputElement>(selector).disabled).toBe(true);
    }
    expect(submittedName).toBe("auditor");
    releasePost?.();
    await started;

    for (const selector of [
      '[aria-label="Selecionar todas as permissões"]',
      '[aria-label="Selecionar todas as permissões de Usuários"]',
      '[aria-label="Permissão Ver usuários para novo perfil"]',
    ]) {
      expect(dialogGet<HTMLInputElement>(selector).disabled).toBe(true);
    }
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Nome do novo perfil"]')
        .disabled,
    ).toBe(true);
    expect(submittedName).toBe("auditor");

    releasePut?.();
    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(submittedPermissions).toEqual(["users.view"]);
  });

  it("preserva a criação parcial e tenta novamente só a atribuição após um 422", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    let permissionAttempts = 0;
    server.use(
      http.put(
        `${TEST_API_BASE}/api/v1/roles/:roleId/permissions`,
        async ({ request, params }) => {
          permissionAttempts += 1;
          if (permissionAttempts === 1) {
            return HttpResponse.json(
              { message: "Dados inválidos.", errors: {} },
              { status: 422, headers: makeCorsHeaders(request) },
            );
          }
          return HttpResponse.json(
            {
              data: makeAdminRole({
                id: Number(params.roleId),
                name: "auditor",
                permissions: ["logs.view"],
              }),
            },
            { headers: makeCorsHeaders(request) },
          );
        },
      ),
    );
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    await setValue(
      '[aria-label="Permissão Ver auditoria para novo perfil"]',
      true,
    );
    dialogGet('[data-testid="submit-create-role"]').click();
    await vi.waitFor(() =>
      expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
        1,
      ),
    );
    await vi.waitFor(() =>
      expect(
        dialogGet<HTMLButtonElement>('[data-testid="submit-create-role"]')
          .disabled,
      ).toBe(false),
    );

    dialogGet('[data-testid="submit-create-role"]').click();
    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      1,
    );
    expect(permissionAttempts).toBe(2);
  });

  it("allows name-only creation without roles.update-permissions", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "create" }, ["roles.manage"]);

    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para novo perfil"]',
      ).disabled,
    ).toBe(true);
    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      1,
    );
    expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
  });

  it("mantém o marcador de campo obrigatório no nome", async () => {
    await mountModal({ mode: "create" });
    expect(document.body.querySelectorAll(".required-mark")).toHaveLength(1);
    expect(document.body.textContent).not.toContain("(obrigatório)");
  });

  it("pede descarte para nome sujo e não grava sem roles.manage", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "create" }, ["roles.view"]);
    await setValue('[aria-label="Nome do novo perfil"]', "rascunho");
    dialogGet('[data-testid="cancel-role-form"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    dialogGet('[data-testid="submit-create-role"]').click();
    await Promise.resolve();
    expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
      0,
    );
  });

  it("preserva o nome digitado quando a API responde 422", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
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
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo perfil"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        "O nome do perfil já existe.",
      ),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Nome do novo perfil"]').value,
    ).toBe("auditor");
    expect(wrapper.emitted("created")).toBeUndefined();
  });
});

describe("RoleFormModal — edição de permissões", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("salva as permissões por grupo do catálogo vigente", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "edit", role: userRole });

    expect(document.body.textContent).toContain("1 de 10 concedidas");
    await setValue('[aria-label="Permissão Ver auditoria para user"]', true);
    dialogGet('[data-testid="submit-role-permissions"]').click();

    await vi.waitFor(() =>
      expect(wrapper.emitted("permissions-saved")).toBeTruthy(),
    );
    expect(
      mocks.calls.find(
        (call) =>
          call.method === "PUT" && call.path === "/api/v1/roles/2/permissions",
      )?.body,
    ).toEqual({ permissions: ["users.view", "logs.view"] });
  });

  it("não grava nada para o perfil admin nem sem roles.update-permissions", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "edit", role: adminRole });

    expect(document.body.textContent).toContain(
      "Perfil Administrador protegido: permissões não podem ser alteradas.",
    );
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para admin"]',
      ).disabled,
    ).toBe(true);
    expect(
      dialogGet<HTMLButtonElement>('[data-testid="submit-role-permissions"]')
        .disabled,
    ).toBe(true);
    expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
    expect(wrapper.emitted("permissions-saved")).toBeUndefined();

    wrapper.unmount();
    mountedWrappers.pop();

    server.use(...mocks.handlers);
    await mountModal({ mode: "edit", role: userRole }, ["roles.view"]);
    expect(
      dialogGet<HTMLButtonElement>('[data-testid="submit-role-permissions"]')
        .disabled,
    ).toBe(true);
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para user"]',
      ).disabled,
    ).toBe(true);
  });

  it("pede confirmação de descarte para permissões sujas", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "edit", role: userRole });
    await setValue('[aria-label="Permissão Ver auditoria para user"]', true);
    dialogGet('[data-testid="cancel-role-form"]').click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Descartar as mudanças?"),
    );
    confirmDialogButton("Cancelar").click();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(0);
  });

  it("seleciona e limpa todas as permissões de uma seção sem afetar as outras", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole]);
    server.use(...mocks.handlers);
    await mountModal({ mode: "edit", role: userRole });

    await setValue(
      '[aria-label="Selecionar todas as permissões de Auditoria"]',
      true,
    );
    await setValue(
      '[aria-label="Selecionar todas as permissões de Usuários"]',
      true,
    );
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para user"]',
      ).checked,
    ).toBe(true);
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Selecionar todas as permissões"]',
      ).indeterminate,
    ).toBe(true);

    await setValue(
      '[aria-label="Selecionar todas as permissões de Usuários"]',
      false,
    );
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver usuários para user"]',
      ).checked,
    ).toBe(false);
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Permissão Ver auditoria para user"]',
      ).checked,
    ).toBe(true);
  });

  it("seleciona globalmente os slugs do catálogo e mantém o scroll no diálogo", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole]);
    server.use(...mocks.handlers);
    await mountModal({ mode: "edit", role: userRole });

    const dialog = dialogGet<HTMLElement>(".ui-dialog");
    const body = dialogGet<HTMLElement>(".ui-dialog__body");
    expect(dialog.style.maxHeight).toContain("48rem");
    expect(getComputedStyle(body).overflowY).toBe("auto");

    await setValue('[aria-label="Selecionar todas as permissões"]', true);
    expect(
      dialogGet<HTMLInputElement>(
        '[aria-label="Selecionar todas as permissões"]',
      ).checked,
    ).toBe(true);
    const permissionCheckboxes = [
      ...document.body.querySelectorAll<HTMLInputElement>(
        '[role="dialog"] input[type="checkbox"][aria-label^="Permissão"]',
      ),
    ];
    expect(permissionCheckboxes).toHaveLength(CATALOGUE_PERMISSIONS.length);
    expect(permissionCheckboxes.every((checkbox) => checkbox.checked)).toBe(
      true,
    );

    dialogGet('[data-testid="submit-role-permissions"]').click();
    await vi.waitFor(() =>
      expect(
        mocks.calls.some(
          (call) =>
            call.method === "PUT" &&
            call.path === "/api/v1/roles/2/permissions" &&
            JSON.stringify(call.body) ===
              JSON.stringify({ permissions: [...CATALOGUE_PERMISSIONS] }),
        ),
      ).toBe(true),
    );
  });
});
