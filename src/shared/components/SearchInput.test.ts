import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SearchInput from "./SearchInput.vue";

const mountSearch = (props: Record<string, unknown> = {}) =>
  mount(SearchInput, {
    props: { modelValue: "", label: "Buscar na auditoria", ...props },
  });

describe("SearchInput.vue", () => {
  it("mostra o valor recebido e mantém o rótulo acessível", () => {
    const wrapper = mountSearch({ modelValue: "papel" });
    const input = wrapper.get('input[type="search"]');

    expect((input.element as HTMLInputElement).value).toBe("papel");
    expect(wrapper.get("label").text()).toContain("Buscar na auditoria");
  });

  it("emite update:modelValue a cada digitação, sem disparar busca sozinho", async () => {
    const wrapper = mountSearch();
    const input = wrapper.get('input[type="search"]');

    await input.setValue("papel");

    expect(wrapper.emitted("update:modelValue")).toEqual([["papel"]]);
    expect(wrapper.emitted("search")).toBeUndefined();
  });

  it("repassa placeholder e estado disabled", () => {
    const wrapper = mountSearch({
      modelValue: "",
      placeholder: "Nome ou email",
      disabled: true,
    });
    const input = wrapper.get('input[type="search"]');

    expect(input.attributes("placeholder")).toBe("Nome ou email");
    expect(input.attributes("disabled")).toBeDefined();
  });
});
