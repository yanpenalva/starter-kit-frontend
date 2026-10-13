import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Pagination from "./Pagination.vue";

type Meta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const mountPagination = (meta: Partial<Meta> = {}, props = {}) =>
  mount(Pagination, {
    props: {
      meta: { current_page: 1, last_page: 3, per_page: 15, total: 45, ...meta },
      ...props,
    },
  });

const button = (wrapper: ReturnType<typeof mountPagination>, label: string) =>
  wrapper.get(`button[aria-label="${label}"]`);

describe("Pagination.vue", () => {
  it("descreve o intervalo e a página atual a partir da meta", () => {
    const wrapper = mountPagination({
      current_page: 2,
      last_page: 3,
      per_page: 15,
      total: 45,
    });

    expect(wrapper.get(".ui-pagination__range").text()).toBe("16–30 de 45");
    expect(wrapper.get(".ui-pagination__status").text()).toContain(
      "Página 2 de 3",
    );
  });

  it("mostra 0–0 de 0 quando a listagem está vazia", () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    });

    expect(wrapper.get(".ui-pagination__range").text()).toBe("0–0 de 0");
    expect(wrapper.get(".ui-pagination__status").text()).toContain(
      "Página 1 de 1",
    );
    expect(
      button(wrapper, "Página anterior").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(wrapper, "Próxima página").attributes("disabled"),
    ).toBeDefined();
  });

  it("não destaca primeira/última página quando há duas páginas", () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 2,
      per_page: 15,
      total: 20,
    });

    expect(wrapper.find('button[aria-label="Primeira página"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('button[aria-label="Última página"]').exists()).toBe(
      false,
    );
  });

  it("desabilita a navegação fora dos limites", async () => {
    const first = mountPagination({ current_page: 1, last_page: 4, total: 60 });
    expect(
      button(first, "Página anterior").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(first, "Primeira página").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(first, "Próxima página").attributes("disabled"),
    ).toBeUndefined();

    const last = mountPagination({ current_page: 4, last_page: 4, total: 60 });
    expect(button(last, "Próxima página").attributes("disabled")).toBeDefined();
    expect(button(last, "Última página").attributes("disabled")).toBeDefined();
    expect(
      button(last, "Página anterior").attributes("disabled"),
    ).toBeUndefined();
  });

  it("emite a troca de página pedida pelo usuário", async () => {
    const wrapper = mountPagination({
      current_page: 2,
      last_page: 4,
      total: 60,
    });

    await button(wrapper, "Próxima página").trigger("click");
    await button(wrapper, "Página anterior").trigger("click");
    await button(wrapper, "Primeira página").trigger("click");
    await button(wrapper, "Última página").trigger("click");

    expect(wrapper.emitted("change")).toEqual([[3], [1], [1], [4]]);
  });

  it("não emite quando o destino é a própria página atual", async () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 1,
      total: 5,
      per_page: 15,
    });

    await button(wrapper, "Próxima página").trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
  });

  it("bloqueia a navegação enquanto está desabilitada", async () => {
    const wrapper = mountPagination(
      { current_page: 1, last_page: 3 },
      {
        disabled: true,
      },
    );

    expect(wrapper.get("nav").attributes("aria-busy")).toBe("true");
    await button(wrapper, "Próxima página").trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
  });
});
