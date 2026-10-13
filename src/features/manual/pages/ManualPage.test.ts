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
const REQUIRED_ANCHOR_IDS = [...REQUIRED_SECTION_IDS, "perguntas-frequentes"];
const REQUIRED_EXPANSIONS = REQUIRED_SECTION_IDS.length + 7;

describe("ManualPage.vue", () => {
  it("documents every required topic with a matching anchor", () => {
    const wrapper = mountManual();

    REQUIRED_ANCHOR_IDS.forEach((id) => {
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    });
    expect(wrapper.find("#duvidas-title").exists()).toBe(true);
  });

  it("links the summary only to anchors present on the page", () => {
    const wrapper = mountManual();
    const links = wrapper.findAll(".manual__toc-list a");

    expect(links).toHaveLength(REQUIRED_ANCHOR_IDS.length);
    links.forEach((link) => {
      const id = link.attributes("href")?.replace("#", "");
      expect(REQUIRED_ANCHOR_IDS).toContain(id);
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    });
  });

  it("renders each section and FAQ as a collapsed Quasar expansion item", async () => {
    const wrapper = mountManual();

    expect(wrapper.findAll(".q-expansion-item")).toHaveLength(
      REQUIRED_EXPANSIONS,
    );
    expect(wrapper.findAll(".q-expansion-item__toggle-icon")).toHaveLength(
      REQUIRED_EXPANSIONS,
    );
    const usersHeader = wrapper.get('#usuarios [role="button"]');
    expect(usersHeader.attributes("aria-expanded")).toBe("false");
    await usersHeader.trigger("click");
    expect(usersHeader.attributes("aria-expanded")).toBe("true");
    expect(wrapper.text()).toContain("Usuários");
    expect(wrapper.text()).toContain("Quanto tempo dura a sessão?");
  });

  it("closes an open manual section when another section opens", async () => {
    const wrapper = mountManual();
    const usersHeader = wrapper.get('#usuarios [role="button"]');
    const loginHeader = wrapper.get('#login-e-perfis [role="button"]');

    await usersHeader.trigger("click");
    expect(usersHeader.attributes("aria-expanded")).toBe("true");
    await loginHeader.trigger("click");

    expect(loginHeader.attributes("aria-expanded")).toBe("true");
    expect(usersHeader.attributes("aria-expanded")).toBe("false");
  });

  it("closes an open section when another manual section opens", async () => {
    const wrapper = mountManual();
    const usersHeader = wrapper.get('#usuarios [role="button"]');
    const loginHeader = wrapper.get('#login-e-perfis [role="button"]');

    await usersHeader.trigger("click");
    expect(usersHeader.attributes("aria-expanded")).toBe("true");
    await loginHeader.trigger("click");

    expect(loginHeader.attributes("aria-expanded")).toBe("true");
    expect(usersHeader.attributes("aria-expanded")).toBe("false");
  });

  it("describes current dialogs, multi-select, search, pagination and icons", () => {
    const wrapper = mountManual();
    const text = wrapper.text();

    expect(text).toContain("janelas");
    expect(text).toContain("seletor múltiplo");
    expect(text).toContain("nome ou e-mail");
    expect(text).toContain("Itens por página");
    expect(text).toContain("ícones");
    expect(text).toContain("último administrador ativo");
    expect(text).not.toMatch(/buscar por nome, e-mail ou CPF/i);
    expect(text).not.toMatch(/separados por vírgula/i);
    expect(text).not.toMatch(/Salvar nome/i);
  });

  it("documents the delivered profile management behavior", () => {
    const text = mountManual().text();

    expect(text).toContain("permissões não fazem parte da busca");
    expect(text).toContain("todas as permissões do catálogo");
    expect(text).toContain("Perfis personalizados podem ser renomeados");
    expect(text).toContain("nomes Administrador e Usuário são reservados");
    expect(text).toContain(
      "Um perfil atribuído a usuários não pode ser excluído",
    );
  });

  it("answers current questions about access, sessions and protections", () => {
    const wrapper = mountManual();
    const text = wrapper.text();

    expect(text).toContain("Perguntas frequentes");
    expect(text).toContain("Por que não vejo o menu");
    expect(text).toContain("Como encontro uma conta de usuário?");
    expect(text).toContain("A sessão terminou");
    expect(wrapper.findAll(".manual__faq-answer")).toHaveLength(7);
    expect(text).toContain("Ação indisponível para o perfil Administrador.");
    expect(text).toContain("Ação indisponível para o perfil Administrador.");
  });

  it("explains server session duration without mentioning browser cache cleanup", async () => {
    const data = await import("../data/manual-content");
    const sessionEntry = data.MANUAL_FAQ.find((faq) =>
      faq.question.includes("Quanto tempo dura a sessão?"),
    );

    expect(sessionEntry?.answer).toContain("120 minutos");
    expect(sessionEntry?.answer).toContain("Você");
    expect(sessionEntry?.answer).not.toMatch(/5\s?min|cache/i);
    expect(mountManual().text()).toContain(sessionEntry?.answer ?? "");
  });

  it("keeps manual content in the data module and preserves section anchors", async () => {
    const data = await import("../data/manual-content");

    expect(data.MANUAL_SECTIONS.map((section) => section.id)).toEqual(
      REQUIRED_SECTION_IDS,
    );
    expect(mountManual().findAll(".q-expansion-item")).toHaveLength(
      REQUIRED_EXPANSIONS,
    );
  });
});
