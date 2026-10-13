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

  it("cria o papel com o payload atual de nome", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo papel"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() => expect(wrapper.emitted("created")).toBeTruthy());
    expect(
      mocks.calls.find(
        (call) => call.method === "POST" && call.path === "/api/v1/roles",
      )?.body,
    ).toEqual({ name: "auditor" });
  });

  it("pede descarte para nome sujo e não grava sem roles.manage", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    const wrapper = await mountModal({ mode: "create" }, ["roles.view"]);

    try {
      await setValue('[aria-label="Nome do novo papel"]', "rascunho");
      dialogGet('[data-testid="cancel-role-form"]').click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();

      dialogGet('[data-testid="submit-create-role"]').click();
      await Promise.resolve();
      expect(mocks.calls.filter((call) => call.method === "POST")).toHaveLength(
        0,
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it("preserva o nome digitado quando a API responde 422", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
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
    const wrapper = await mountModal({ mode: "create" });

    await setValue('[aria-label="Nome do novo papel"]', "auditor");
    dialogGet('[data-testid="submit-create-role"]').click();

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("O nome do papel já existe."),
    );
    expect(
      dialogGet<HTMLInputElement>('[aria-label="Nome do novo papel"]').value,
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

  it("não grava nada para o papel admin nem sem roles.update-permissions", async () => {
    const mocks = makeRolesRouteMocks([adminRole]);
    server.use(...mocks.handlers);
    const wrapper = await mountModal({ mode: "edit", role: adminRole });

    expect(document.body.textContent).toContain(
      "Papel protegido: permissões não podem ser alteradas.",
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
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    const wrapper = await mountModal({ mode: "edit", role: userRole });

    try {
      await setValue('[aria-label="Permissão Ver auditoria para user"]', true);
      dialogGet('[data-testid="cancel-role-form"]').click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
      expect(mocks.calls.filter((call) => call.method === "PUT")).toHaveLength(
        0,
      );
    } finally {
      confirmSpy.mockRestore();
    }
  });
});
