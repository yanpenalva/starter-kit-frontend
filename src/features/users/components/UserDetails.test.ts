import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeAdminUser } from "@/test/admin-handlers";
import { useSessionStore } from "@/features/auth/stores/session";
import { CATALOGUE_PERMISSIONS } from "@/shared/types/contract";
import type { AdminUser } from "@/features/users/api/users.types";
import UserDetails from "./UserDetails.vue";

let wrapper: VueWrapper | null = null;

const permissionsWithout = (...excluded: string[]): string[] =>
  CATALOGUE_PERMISSIONS.filter(
    (permission) => !excluded.includes(permission),
  ) as string[];

const user: AdminUser = makeAdminUser({
  id: 9,
  name: "Pessoa de Teste",
  email: "pessoa.teste@example.test",
  email_verified_at: "2026-10-01T12:00:00Z",
  deactivated_at: null,
  roles: ["admin", "user"],
  cpf: "00000000000",
});

const mountDetails = (
  data: AdminUser | null,
  options: {
    permissions?: readonly string[];
    isPending?: boolean;
    isError?: boolean;
  } = {},
): VueWrapper => {
  useSessionStore().user = {
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    roles: ["admin"],
    permissions: [...(options.permissions ?? CATALOGUE_PERMISSIONS)],
  };
  wrapper = mount(UserDetails, {
    attachTo: document.body,
    props: {
      modelValue: true,
      user: data,
      isPending: options.isPending ?? false,
      isError: options.isError ?? false,
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

const clickExpansion = async (label: string): Promise<void> => {
  expansionHeader(label).click();
  await vi.waitFor(() =>
    expect(expansionHeader(label).getAttribute("role")).toBe("button"),
  );
};

const activateExpansionByKeyboard = async (
  label: string,
  keyCode: number,
): Promise<void> => {
  expansionHeader(label).dispatchEvent(
    new KeyboardEvent("keyup", {
      key: keyCode === 13 ? "Enter" : " ",
      keyCode,
      bubbles: true,
    }),
  );
  await vi.waitFor(() =>
    expect(expansionHeader(label).getAttribute("role")).toBe("button"),
  );
};

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = "";
});

describe("UserDetails", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("shows the Account and Profiles groups in announced expansions", async () => {
    mountDetails(user);

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes de Pessoa de Teste"),
    );
    expect(dialogText()).toContain("pessoa.teste@example.test");
    expect(dialogText()).toContain("Verificado");
    expect(dialogText()).toContain("Ativo");

    for (const label of ["Informações da conta", "Perfis do usuário"]) {
      const header = expansionHeader(label);
      expect(header.getAttribute("role")).toBe("button");
      expect(header.getAttribute("aria-expanded")).toBe(
        label === "Informações da conta" ? "true" : "false",
      );
      expect(header.getAttribute("aria-controls")).not.toBeNull();
    }
    await clickExpansion("Perfis do usuário");
    expect(dialogText()).toContain("Administrador");
    expect(dialogText()).toContain("Usuário");
  });

  it("collapses dense content without losing data and reopens via mouse and keyboard", async () => {
    mountDetails(user);

    await vi.waitFor(() => expect(dialogText()).toContain("Pessoa de Teste"));

    await clickExpansion("Perfis do usuário");
    expect(
      expansionHeader("Perfis do usuário").getAttribute("aria-expanded"),
    ).toBe("true");

    expect(dialogText()).toContain("Administrador");

    await activateExpansionByKeyboard("Perfis do usuário", 13);
    expect(
      expansionHeader("Perfis do usuário").getAttribute("aria-expanded"),
    ).toBe("false");

    await activateExpansionByKeyboard("Perfis do usuário", 32);
    expect(
      expansionHeader("Perfis do usuário").getAttribute("aria-expanded"),
    ).toBe("true");

    await clickExpansion("Perfis do usuário");
    expect(
      expansionHeader("Perfis do usuário").getAttribute("aria-expanded"),
    ).toBe("false");
    expect(dialogText()).toContain("Administrador");
  });

  it("shows CPF only with users.read-cpf", async () => {
    mountDetails(user, {
      permissions: permissionsWithout("users.read-cpf"),
    });

    await vi.waitFor(() => expect(dialogText()).toContain("Pessoa de Teste"));
    expect(dialogText()).not.toContain("000.000.000-00");
    expect(
      document.body.querySelector('[data-testid="user-detail-cpf"]'),
    ).toBeNull();

    await clickExpansion("Informações da conta");
    await clickExpansion("Perfis do usuário");

    expect(dialogText()).not.toContain("000.000.000-00");
    expect(dialogText()).not.toContain("***");
    expect(
      document.body.querySelector('[data-testid="user-detail-cpf"]'),
    ).toBeNull();
  });

  it("shows formatted CPF when the permission exists", async () => {
    mountDetails(user);

    await vi.waitFor(() =>
      expect(
        document.body.querySelector('[data-testid="user-detail-cpf"]')
          ?.textContent,
      ).toContain("000.000.000-00"),
    );
  });

  it("read-only query: no write controls in the dialog", async () => {
    mountDetails(
      makeAdminUser({
        id: 1,
        name: "Administrador",
        email: "admin@example.test",
        roles: ["admin"],
      }),
    );

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes de Administrador"),
    );

    const dialog = dialogElement() as HTMLElement;
    expect(dialog.querySelectorAll("input")).toHaveLength(0);
    expect(dialog.querySelectorAll("select")).toHaveLength(0);
    expect(
      [...dialog.querySelectorAll("button")].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(["Fechar"]);
  });

  it("reports loading and query failure", async () => {
    mountDetails(null, { isPending: true });

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Carregando usuário"),
    );

    wrapper?.unmount();
    document.body.innerHTML = "";
    mountDetails(null, { isError: true });

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Usuário não encontrado ou indisponível."),
    );
    expect(
      document.body.querySelector('[role="dialog"] [role="alert"]'),
    ).not.toBeNull();
  });
});
