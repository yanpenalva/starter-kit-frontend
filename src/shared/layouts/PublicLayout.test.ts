import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PublicLayout from "./PublicLayout.vue";

describe("public layout", () => {
  it("keeps page content in place and provides a keyboard skip link", () => {
    const wrapper = mount(PublicLayout, {
      slots: {
        default: '<main id="main-content">Conteúdo sintético</main>',
      },
    });

    expect(wrapper.get(".public-layout__skip").attributes("href")).toBe(
      "#main-content",
    );
    expect(wrapper.get("main").text()).toBe("Conteúdo sintético");
  });
});
