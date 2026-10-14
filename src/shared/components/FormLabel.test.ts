import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FormLabel from "./FormLabel.vue";

describe("FormLabel", () => {
  it("renderiza o asterisco ao lado do texto quando obrigatório", () => {
    const wrapper = mount(FormLabel, {
      props: { required: true },
      slots: { default: "Nome" },
    });
    const label = wrapper.find(".form-label__text");
    expect(label.exists()).toBe(true);
    expect(label.text().replace(/\s+/g, " ")).toContain("Nome *");
    expect(label.find(".required-mark").exists()).toBe(true);
  });

  it("não renderiza asterisco quando não obrigatório", () => {
    const wrapper = mount(FormLabel, { slots: { default: "CPF" } });
    expect(wrapper.find(".form-label__text").exists()).toBe(true);
    expect(wrapper.find(".required-mark").exists()).toBe(false);
    expect(wrapper.text()).toContain("CPF");
  });
});
