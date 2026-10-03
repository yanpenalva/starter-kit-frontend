import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AuthLayout from "./AuthLayout.vue";

describe("presentation-only auth layout", () => {
  it("labels its content from synthetic title props and leaves slot ownership to caller", () => {
    const wrapper = mount(AuthLayout, {
      props: {
        title: "Uma etapa por vez",
        description: "Conteúdo de teste, sem dados de conta.",
        eyebrow: "ÁREA DE TESTE",
      },
      slots: {
        default:
          '<section data-test="slot-content">Conteúdo sintético</section>',
        footer: "Rodapé de teste",
      },
    });
    const heading = wrapper.get("h1");

    expect(wrapper.get("main").attributes("aria-labelledby")).toBe(
      heading.attributes("id"),
    );
    expect(heading.text()).toBe("Uma etapa por vez");
    expect(wrapper.get('[data-test="slot-content"]').text()).toBe(
      "Conteúdo sintético",
    );
    expect(wrapper.get(".auth-layout__footer").text()).toBe("Rodapé de teste");
    expect(wrapper.find("form").exists()).toBe(false);
  });
});
