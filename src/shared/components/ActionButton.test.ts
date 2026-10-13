import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ActionButton from "./ActionButton.vue";

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(ActionButton, {
    props: { label: "Criar usuário", ...props },
  });

describe("ActionButton.vue", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renderiza o rótulo como botão comum por padrão", () => {
    const wrapper = mountButton();

    expect(wrapper.get("button").text()).toBe("Criar usuário");
    expect(wrapper.get("button").attributes("type")).toBe("button");
    expect(wrapper.get("button").attributes("disabled")).toBeUndefined();
  });

  it("repassa type, disabled e loading", () => {
    const wrapper = mountButton({ type: "submit", loading: true });

    expect(wrapper.get("button").attributes("type")).toBe("submit");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");

    const disabled = mountButton({ disabled: true });
    expect(disabled.get("button").attributes("disabled")).toBeDefined();
    expect(disabled.get("button").attributes("aria-busy")).toBeUndefined();
  });

  it("renderiza ações por ícone com nome acessível e tooltip", () => {
    const wrapper = mountButton({
      icon: "visibility",
      label: "Ver detalhes de Maria",
    });
    const button = wrapper.get("button");

    expect(button.attributes("aria-label")).toBe("Ver detalhes de Maria");
    expect(button.attributes("title")).toBe("Ver detalhes de Maria");
    expect(button.get(".material-icons").text()).toBe("visibility");
    expect(button.get(".material-icons").attributes("aria-hidden")).toBe(
      "true",
    );
    expect(button.classes()).toContain("action-button--icon");
  });

  it("mantém cor e disponibiliza explicação no hover e no foco quando bloqueado", async () => {
    const wrapper = mountButton({
      icon: "edit",
      color: "warning",
      iconSize: 18,
      disabled: true,
      tooltip: "Ação indisponível para o perfil Administrador.",
    });
    const button = wrapper.get("button");
    const shell = wrapper.get(".action-button-shell");
    expect(button.classes()).toContain("action-button--warning");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("title")).toBeUndefined();
    expect(button.attributes("aria-description")).toBe(
      "Ação indisponível para o perfil Administrador.",
    );
    expect(shell.attributes("tabindex")).toBe("0");
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();

    (shell.element as HTMLElement).focus();
    shell.element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await vi.waitFor(() => {
      const tooltip = document.body.querySelector('[role="tooltip"]');
      expect(tooltip?.getAttribute("role")).toBe("tooltip");
      expect(tooltip?.textContent).toBe(
        "Ação indisponível para o perfil Administrador.",
      );
      expect(shell.attributes("aria-describedby")).toContain(tooltip?.id);
    });

    shell.element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull(),
    );

    shell.element.dispatchEvent(new MouseEvent("mouseenter"));
    await vi.waitFor(() =>
      expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull(),
    );
  });

  it("emite click com o evento nativo quando está habilitado", async () => {
    const wrapper = mountButton();

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("click")).toHaveLength(1);
    expect(wrapper.emitted("click")?.[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it("não emite click enquanto carrega ou está desabilitado", async () => {
    const loading = mountButton({ loading: true });
    const disabled = mountButton({ disabled: true });

    for (const wrapper of [loading, disabled]) {
      wrapper
        .get("button")
        .element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    await Promise.resolve();

    expect(loading.emitted("click")).toBeUndefined();
    expect(disabled.emitted("click")).toBeUndefined();
  });
});
