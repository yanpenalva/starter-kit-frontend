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
import { queryClient } from "@/app/providers/query";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import type { AdminRole } from "@/features/roles/api/roles.types";
import RoleDetails from "./RoleDetails.vue";

const adminRole = makeAdminRole({ id: 1, name: "admin" });
const userRole = makeAdminRole({
  id: 2,
  name: "user",
  permissions: ["users.view"],
});
const customRole = makeAdminRole({
  id: 3,
  name: "manager",
  permissions: ["users.view"],
});

let wrapper: VueWrapper | null = null;

const mountDetails = (
  role: AdminRole | null,
  permissions: readonly string[] = [...CATALOGUE_PERMISSIONS],
): VueWrapper => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...permissions],
  };
  wrapper = mount(RoleDetails, {
    attachTo: document.body,
    props: { modelValue: true, role },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  return wrapper;
};

const dialogElement = (): HTMLElement | null =>
  document.body.querySelector<HTMLElement>('[role="dialog"]');

const dialogText = (): string => dialogElement()?.textContent ?? "";

const expansionHeader = (label: string): HTMLElement => {
  const element = document.body.querySelector<HTMLElement>(
    `[aria-label="${label}"]`,
  );
  if (element === null) {
    throw new Error(`Expansão "${label}" não encontrada.`);
  }
  return element;
};

const setName = async (name: string): Promise<void> => {
  await vi.waitFor(() =>
    expect(
      dialogElement()?.querySelector('[aria-label="Novo nome do perfil"]'),
    ).not.toBeNull(),
  );
  const input = dialogElement()?.querySelector<HTMLInputElement>(
    '[aria-label="Novo nome do perfil"]',
  );
  if (input === null || input === undefined) {
    throw new Error("Campo para renomear perfil não encontrado.");
  }
  input.value = name;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  queryClient.clear();
  document.body.innerHTML = "";
});

describe("RoleDetails", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    queryClient.clear();
  });

  it("mostra nome e permissões do catálogo agrupadas em português", async () => {
    mountDetails(userRole);

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil user"),
    );
    expect(
      document.body.querySelector('[data-testid="role-detail-name"]')
        ?.textContent,
    ).toContain("user");
    expect(dialogText()).toContain("O nome Usuário é reservado");

    for (const label of [
      "Permissões do grupo Usuários",
      "Permissões do grupo Perfis",
      "Permissões do grupo Auditoria",
    ]) {
      const header = expansionHeader(label);
      expect(header.getAttribute("role")).toBe("button");
      expect(header.getAttribute("aria-expanded")).toBe("false");
    }

    expect(dialogText()).toContain("Ver usuários");
    expect(dialogText()).toContain("Concedida");
    expect(dialogText()).toContain("Não concedida");
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
  });

  it("recolhe e reabre os grupos por mouse e teclado", async () => {
    mountDetails(userRole);

    await vi.waitFor(() => expect(dialogText()).toContain("Ver usuários"));

    const header = expansionHeader("Permissões do grupo Usuários");
    header.click();
    await vi.waitFor(() =>
      expect(
        expansionHeader("Permissões do grupo Usuários").getAttribute(
          "aria-expanded",
        ),
      ).toBe("true"),
    );
    expect(dialogText()).toContain("Ver usuários");

    header.dispatchEvent(
      new KeyboardEvent("keyup", {
        key: "Enter",
        keyCode: 13,
        bubbles: true,
      }),
    );
    await vi.waitFor(() =>
      expect(
        expansionHeader("Permissões do grupo Usuários").getAttribute(
          "aria-expanded",
        ),
      ).toBe("false"),
    );
  });

  it("renomeia perfis personalizados pela API sem alterar permissões", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole, customRole]);
    server.use(...mocks.handlers);
    const details = mountDetails(customRole);

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil manager"),
    );
    await setName("operador");
    document.body
      .querySelector<HTMLButtonElement>('[data-testid="rename-role"]')
      ?.click();

    await vi.waitFor(() => expect(details.emitted("renamed")).toBeTruthy());
    expect(mocks.calls.find((call) => call.method === "PATCH")?.body).toEqual({
      name: "operador",
    });
    expect(details.emitted("renamed")?.[0]?.[0]).toMatchObject({
      id: 3,
      name: "operador",
      permissions: ["users.view"],
    });
    expect(dialogText()).toContain("Perfil renomeado com sucesso.");
  });

  it("mostra o erro de nome duplicado no campo e conserva o texto", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole, customRole]);
    server.use(...mocks.handlers);
    await mountDetails(customRole);

    await setName("user");
    document.body
      .querySelector<HTMLButtonElement>('[data-testid="rename-role"]')
      ?.click();

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Já existe um perfil com este nome."),
    );
    expect(
      dialogElement()?.querySelector<HTMLInputElement>(
        '[aria-label="Novo nome do perfil"]',
      )?.value,
    ).toBe("user");
    expect(mocks.calls.some((call) => call.method === "PATCH")).toBe(true);
  });

  it("mostra a recusa 403 do servidor mesmo com autorização local antiga", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole, customRole]);
    server.use(...mocks.handlers);
    server.use(
      http.patch(`${TEST_API_BASE}/api/v1/roles/:roleId`, ({ request }) =>
        HttpResponse.json(
          { message: "Não autorizado." },
          { status: 403, headers: makeCorsHeaders(request) },
        ),
      ),
    );
    const details = mountDetails(customRole);

    await setName("operador");
    document.body
      .querySelector<HTMLButtonElement>('[data-testid="rename-role"]')
      ?.click();

    await vi.waitFor(() =>
      expect(
        dialogElement()?.querySelector('[role="alert"]')?.textContent,
      ).toContain("Sua conta não tem permissão para esta ação"),
    );
    expect(details.emitted("renamed")).toBeUndefined();
  });

  it("protege o perfil Administrador e respeita a reserva do nome Usuário", async () => {
    const mocks = makeRolesRouteMocks([adminRole, userRole]);
    server.use(...mocks.handlers);
    mountDetails(adminRole);

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil admin"),
    );
    expect(dialogText()).toContain(
      "não pode ser renomeado, excluído nem ter permissões alteradas",
    );
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
    expect(
      dialogElement()?.querySelector('[data-testid="rename-role"]'),
    ).toBeNull();
    expect(mocks.calls.some((call) => call.method === "PATCH")).toBe(false);

    wrapper?.unmount();
    wrapper = null;
    queryClient.clear();
    mountDetails(userRole);
    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil user"),
    );
    expect(dialogText()).toContain("O nome Usuário é reservado");
    expect(
      dialogElement()?.querySelector('[data-testid="rename-role"]'),
    ).toBeNull();
    expect(mocks.calls.some((call) => call.method === "PATCH")).toBe(false);
  });

  it("mantém Escape sob o guard enquanto o nome está sujo", async () => {
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    const details = mountDetails(customRole);

    try {
      await setName("rascunho");
      for (const type of ["keydown", "keyup"]) {
        document.dispatchEvent(
          new KeyboardEvent(type, {
            key: "Escape",
            keyCode: 27,
            bubbles: true,
          }),
        );
      }

      await vi.waitFor(() => expect(confirmSpy).toHaveBeenCalledOnce());
      expect(details.emitted("update:modelValue")).toBeUndefined();
      expect(dialogElement()).not.toBeNull();
    } finally {
      confirmSpy.mockRestore();
    }
  });
});
