import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import NotFoundPage from "./NotFoundPage.vue";

describe("NotFoundPage.vue", () => {
  it("renders 404 heading and message", () => {
    const wrapper = mount(NotFoundPage, {
      global: {
        stubs: {
          RouterLink: {
            template: "<a><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.get("h1").text()).toBe("Página Não Encontrada");
    expect(wrapper.text()).toContain(
      "O endereço que você tentou acessar não existe",
    );
    expect(wrapper.text()).toContain("ERRO 404");
  });
});
