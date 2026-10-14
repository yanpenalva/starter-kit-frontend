import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import RequiredMark from "./RequiredMark.vue";

describe("RequiredMark", () => {
  it("shows a red required marker with an accessible tooltip on focus", () => {
    const wrapper = mount(RequiredMark);

    expect(wrapper.text()).toContain("*");
    expect(wrapper.attributes("tabindex")).toBe("0");
    expect(wrapper.attributes("aria-label")).toBe("Campo obrigatório");
    expect(wrapper.get('[role="tooltip"]').text()).toBe("Campo obrigatório");
    expect(wrapper.get(".required-mark").classes()).toContain("required-mark");
  });
});
