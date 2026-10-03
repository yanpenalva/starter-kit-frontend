import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PublicHomePage from "./PublicHomePage.vue";

describe("public placeholder page", () => {
  it("renders public welcome content without account or personal data", () => {
    const wrapper = mount(PublicHomePage, {
      global: {
        stubs: {
          QIcon: { template: '<span aria-hidden="true" />' },
        },
      },
    });

    expect(wrapper.get("h1").text()).toContain("Seu próximo");
    expect(wrapper.text()).toContain("Nenhuma conta ou dado pessoal");
    expect(wrapper.find("form").exists()).toBe(false);
  });
});
