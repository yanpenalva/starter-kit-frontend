import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ActionButton from "./ActionButton.vue";

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(ActionButton, {
    props: { label: "Criar usuário", ...props },
  });

describe("ActionButton.vue", () => {
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
