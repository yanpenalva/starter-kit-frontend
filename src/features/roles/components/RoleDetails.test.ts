import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeAdminRole } from "@/test/admin-handlers";
import type { AdminRole } from "@/features/roles/api/roles.types";
import RoleDetails from "./RoleDetails.vue";

let wrapper: VueWrapper | null = null;

const mountDetails = (role: AdminRole | null): VueWrapper => {
  wrapper = mount(RoleDetails, {
    attachTo: document.body,
    props: { modelValue: true, role },
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

describe("RoleDetails", () => {
  it("mostra o nome e os grupos de permissões do catálogo com o estado de cada uma", async () => {
    mountDetails(
      makeAdminRole({ id: 2, name: "user", permissions: ["users.view"] }),
    );

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil user"),
    );
    expect(
      document.body.querySelector('[data-testid="role-detail-name"]')
        ?.textContent,
    ).toContain("user");

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
  });

  it("recolhe e reabre os grupos por mouse e teclado", async () => {
    mountDetails(makeAdminRole({ id: 2, name: "user" }));

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

    await activateExpansionByKeyboard("Permissões do grupo Usuários", 13);
    expect(
      expansionHeader("Permissões do grupo Usuários").getAttribute(
        "aria-expanded",
      ),
    ).toBe("false");

    await activateExpansionByKeyboard("Permissões do grupo Usuários", 32);
    expect(
      expansionHeader("Permissões do grupo Usuários").getAttribute(
        "aria-expanded",
      ),
    ).toBe("true");
  });

  it("consulta somente leitura: nenhum controle de edição", async () => {
    mountDetails(makeAdminRole({ id: 2, name: "user" }));

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil"),
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

  it("consulta o perfil admin sinalizando que ele é protegido", async () => {
    mountDetails(makeAdminRole({ id: 1, name: "admin" }));

    await vi.waitFor(() =>
      expect(dialogText()).toContain("Detalhes do perfil admin"),
    );
    expect(dialogText()).toContain(
      "Perfil protegido: não pode ser editado nem excluído.",
    );
    expect(dialogElement()?.querySelectorAll("input")).toHaveLength(0);
  });
});
