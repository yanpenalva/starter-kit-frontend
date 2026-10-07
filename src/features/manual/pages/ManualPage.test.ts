import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ManualPage from "./ManualPage.vue";

const mountManual = () =>
  mount(ManualPage, {
    global: {
      stubs: {
        AppLayout: { name: "AppLayout", template: "<div><slot /></div>" },
      },
    },
  });

const REQUIRED_SECTION_IDS = [
  "primeiros-passos",
  "login-e-perfis",
  "usuarios",
  "papeis-permissoes",
  "auditoria",
  "filtros-e-paginacao",
];

describe("ManualPage.vue", () => {
  it("documents every required topic with its own anchor", () => {
    const wrapper = mountManual();

    REQUIRED_SECTION_IDS.forEach((id) => {
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    });
    expect(wrapper.find("#duvidas-title").exists()).toBe(true);
  });

  it("links the summary to the anchors so the page is navigable", () => {
    const wrapper = mountManual();
    const links = wrapper.findAll(".manual__toc-list a");

    expect(links).toHaveLength(REQUIRED_SECTION_IDS.length);
    links.forEach((link) => {
      expect(REQUIRED_SECTION_IDS).toContain(
        link.attributes("href")?.replace("#", ""),
      );
    });
  });

  it("labels each section so assistive technology announces its heading", () => {
    const wrapper = mountManual();

    REQUIRED_SECTION_IDS.forEach((id) => {
      const section = wrapper.get(`#${id}`);
      expect(section.attributes("aria-labelledby")).toBe(`${id}-title`);
      expect(wrapper.find(`#${id}-title`).exists()).toBe(true);
    });
  });

  it("answers the recurring questions about access and protected data", () => {
    const wrapper = mountManual();
    const text = wrapper.text();

    expect(text).toContain("Perguntas frequentes");
    expect(text).toContain("Por que não vejo o menu");
    expect(text).toContain("Por que o CPF aparece mascarado?");
    expect(text).toContain("sessão expirou");
    expect(wrapper.findAll(".manual__faq-question").length).toBe(
      wrapper.findAll(".manual__faq-answer").length,
    );
  });

  it("explains the administrative flows end to end", () => {
    const text = mountManual().text();

    expect(text).toContain("users.view");
    expect(text).toContain("roles.update-permissions");
    expect(text).toContain("logs.view");
    expect(text).toContain("último administrador ativo");
  });
});
